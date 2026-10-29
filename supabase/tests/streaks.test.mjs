// Tests for the daily streak migrations, against an in-process Postgres (PGlite).
// Run with: npm run test:db
import { PGlite } from '@electric-sql/pglite';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const migration = (name) => readFileSync(new URL(`../migrations/${name}`, import.meta.url), 'utf8');

const A = '00000000-0000-0000-0000-00000000000a';
const B = '00000000-0000-0000-0000-00000000000b';
const C = '00000000-0000-0000-0000-00000000000c';
const D = '00000000-0000-0000-0000-00000000000d';

// Just enough of Supabase for the migrations: auth.users, auth.uid(), the API roles,
// the old profiles columns the backfill reads, and a stand-in for grant_lotto_pull.
const Stubs = `
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  grant usage on schema auth, public to anon, authenticated;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable
    as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant execute on function auth.uid() to anon, authenticated;

  create table public.profiles (id uuid primary key references auth.users (id), current_streak smallint default 0, best_streak smallint default 0);

  create function public.grant_lotto_pull(p_user uuid)
  returns table (granted boolean, current_lotto_pulls integer, max_lotto_pulls integer, next_pull_at timestamptz)
  language sql security definer set search_path = '' as $$ select true, 1, 1, null::timestamptz $$;
  revoke all on function public.grant_lotto_pull(uuid) from public;

  -- The lotto tables and helpers spend_lotto_pull uses, copied from the live project.
  create table public.lotto_state (
    user_id uuid primary key references auth.users (id) on delete cascade,
    current_lotto_pulls integer not null default 1 check (current_lotto_pulls >= 0),
    max_lotto_pulls integer not null default 1 check (max_lotto_pulls >= 1),
    recharge_start_time timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );
  create function public.lotto_recharge_interval() returns interval language sql immutable as $$ select interval '12 hours' $$;
  create function public.lotto_calc(p_current integer, p_start timestamptz, p_max integer, p_recharge interval, p_now timestamptz, out cur integer, out start_time timestamptz)
  language plpgsql immutable as $$
  declare regen int;
  begin
    regen := greatest(0, floor(extract(epoch from p_now - p_start) / extract(epoch from p_recharge))::int);
    cur := least(p_max, p_current + regen);
    if cur >= p_max then start_time := p_now; else start_time := p_start + regen * p_recharge; end if;
  end;
  $$;
`;

async function setup() {
  const db = new PGlite();
  await db.exec(Stubs);
  // A user from before the move, with a streak on profiles.
  await db.exec(`insert into auth.users values ('${A}'), ('${D}'); insert into public.profiles values ('${A}', 3, 14), ('${D}', 0, 5);`);
  await db.exec(migration('20261025212531_create_user_streaks.sql'));
  await db.exec(migration('20261025212740_drop_profiles_streak_columns.sql'));
  await db.exec(migration('20261025213811_daily_streaks.sql'));
  await db.exec(migration('20261025215105_lotto_pull_keeps_streak.sql'));
  await db.exec(migration('20261028130000_claim_exercise_pull_lesson.sql'));
  await db.exec(`revoke all on function public.spend_lotto_pull() from public, anon; grant execute on function public.spend_lotto_pull() to authenticated;`);
  // Supabase grants table access to the API roles by default; RLS is what limits it.
  await db.exec(`grant all on public.user_streaks to anon, authenticated;`);
  await db.exec(`insert into auth.users values ('${B}');`);
  return db;
}

async function row(db, user) {
  const { rows } = await db.query(`select * from public.user_streaks where user_id = $1`, [user]);
  return rows[0];
}

async function record(db, user, day) {
  await db.query(`select public.record_activity_on($1, $2::date)`, [user, day]);
}

async function summary(db, user, today) {
  const { rows } = await db.query(`select * from public.streak_summary_for($1, $2::date)`, [user, today]);
  return rows[0];
}

/** Runs `sql` as a signed-in user (or anon when `user` is null), the way PostgREST would. */
async function as(db, user, sql, params) {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${user ? 'authenticated' : 'anon'}`);
    await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [user ?? '']);
    return tx.query(sql, params);
  });
}

const ymd = (d) => d.toISOString().slice(0, 10);

// ---- Table and backfill ----

test('backfill copies the old profiles streak', async () => {
  const db = await setup();
  const r = await row(db, A);
  assert.equal(r.current_streak, 3);
  assert.equal(r.best_streak, 14);
});

test('a new user gets a zero row with UTC and an empty mask', async () => {
  const db = await setup();
  const r = await row(db, B);
  assert.deepEqual([r.current_streak, r.best_streak, r.timezone, r.last_active_date, r.recent_days], [0, 0, 'UTC', null, 0]);
});

// ---- record_activity_on ----

test('the first active day starts a streak of 1', async () => {
  const db = await setup();
  await record(db, B, '2026-10-01');
  const r = await row(db, B);
  assert.deepEqual([r.current_streak, r.best_streak, r.recent_days, ymd(r.last_active_date)], [1, 1, 1, '2026-10-01']);
});

test('a second activity on the same day changes nothing', async () => {
  const db = await setup();
  await record(db, B, '2026-10-01');
  await record(db, B, '2026-10-01');
  const r = await row(db, B);
  assert.deepEqual([r.current_streak, r.recent_days], [1, 1]);
});

test('the next day extends the streak', async () => {
  const db = await setup();
  await record(db, B, '2026-10-01');
  await record(db, B, '2026-10-02');
  const r = await row(db, B);
  assert.deepEqual([r.current_streak, r.best_streak, r.recent_days], [2, 2, 0b11]);
});

test('a missed day restarts at 1 and keeps the best', async () => {
  const db = await setup();
  for (const d of ['2026-10-01', '2026-10-02', '2026-10-03']) await record(db, B, d);
  await record(db, B, '2026-10-05');
  const r = await row(db, B);
  assert.deepEqual([r.current_streak, r.best_streak], [1, 3]);
  // Today, then a gap, then the 3rd and 2nd (the 1st is still in the window too).
  assert.equal(r.recent_days, 0b11101);
});

test('a gap of a week or more clears the mask', async () => {
  const db = await setup();
  await record(db, B, '2026-10-01');
  await record(db, B, '2026-10-08');
  assert.equal((await row(db, B)).recent_days, 1);
});

test('a day before the last one counted is ignored', async () => {
  const db = await setup();
  await record(db, B, '2026-10-05');
  await record(db, B, '2026-10-04');
  const r = await row(db, B);
  assert.deepEqual([r.current_streak, r.recent_days, ymd(r.last_active_date)], [1, 1, '2026-10-05']);
});

test('ten days running gives a streak of 10 and a full mask', async () => {
  const db = await setup();
  for (let i = 1; i <= 10; i++) await record(db, B, `2026-10-${String(i).padStart(2, '0')}`);
  const r = await row(db, B);
  assert.deepEqual([r.current_streak, r.best_streak, r.recent_days], [10, 10, 127]);
});

test('the best streak survives a reset and a shorter new run', async () => {
  const db = await setup();
  for (const d of ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']) await record(db, B, d);
  for (const d of ['2026-10-10', '2026-10-11']) await record(db, B, d);
  const r = await row(db, B);
  assert.deepEqual([r.current_streak, r.best_streak], [2, 4]);
});

// ---- streak_summary_for ----

test('summary on an active day shows today done', async () => {
  const db = await setup();
  await record(db, B, '2026-10-01');
  const s = await summary(db, B, '2026-10-01');
  assert.deepEqual(s.days, ['missed', 'missed', 'missed', 'missed', 'missed', 'missed', 'done']);
  assert.equal(s.current_streak, 1);
  assert.equal(ymd(s.today), '2026-10-01');
});

test('summary the next morning keeps the streak and shows today pending', async () => {
  const db = await setup();
  await record(db, B, '2026-10-01');
  await record(db, B, '2026-10-02');
  const s = await summary(db, B, '2026-10-03');
  assert.equal(s.current_streak, 2);
  assert.deepEqual(s.days, ['missed', 'missed', 'missed', 'missed', 'done', 'done', 'pending']);
});

test('summary after a missed day shows 0 with the best intact, without a write', async () => {
  const db = await setup();
  for (const d of ['2026-10-01', '2026-10-02', '2026-10-03']) await record(db, B, d);
  const s = await summary(db, B, '2026-10-05');
  assert.deepEqual([s.current_streak, s.best_streak], [0, 3]);
  assert.deepEqual(s.days, ['missed', 'missed', 'done', 'done', 'done', 'missed', 'pending']);
  assert.equal((await row(db, B)).current_streak, 3, 'the stored row is untouched');
});

test('summary a week later is all missed and pending', async () => {
  const db = await setup();
  await record(db, B, '2026-10-01');
  const s = await summary(db, B, '2026-10-20');
  assert.equal(s.current_streak, 0);
  assert.deepEqual(s.days, ['missed', 'missed', 'missed', 'missed', 'missed', 'missed', 'pending']);
});

test('summary for a user with no row is zeros', async () => {
  const db = await setup();
  const s = await summary(db, C, '2026-10-01');
  assert.deepEqual([s.current_streak, s.best_streak], [0, 0]);
  assert.equal(s.days.at(-1), 'pending');
});

test('summary clamps a last day that is after today (timezone change)', async () => {
  const db = await setup();
  await record(db, B, '2026-10-02');
  const s = await summary(db, B, '2026-10-01');
  assert.equal(s.current_streak, 1);
  assert.equal(s.days.at(-1), 'done');
});

test('summary of a full week is seven done', async () => {
  const db = await setup();
  for (let i = 1; i <= 7; i++) await record(db, B, `2026-10-0${i}`);
  const s = await summary(db, B, '2026-10-07');
  assert.deepEqual(s.days, Array(7).fill('done'));
  assert.equal(s.current_streak, 7);
});

test('a migrated streak counts as kept through yesterday', async () => {
  const db = await setup();
  const { rows } = await db.query(`select (now() at time zone 'UTC')::date as today`);
  const s = await summary(db, A, ymd(rows[0].today));
  assert.deepEqual([s.current_streak, s.best_streak], [3, 14]);
  assert.deepEqual(s.days, ['missed', 'missed', 'missed', 'done', 'done', 'done', 'pending']);
});

test('a migrated streak continues when the learner is active today', async () => {
  const db = await setup();
  const { rows } = await db.query(`select (now() at time zone 'UTC')::date as today`);
  await record(db, A, ymd(rows[0].today));
  const r = await row(db, A);
  assert.deepEqual([r.current_streak, r.best_streak, r.recent_days], [4, 14, 0b1111]);
});

test('a migrated zero streak is left without a last day', async () => {
  const db = await setup();
  const r = await row(db, D);
  assert.deepEqual([r.current_streak, r.best_streak, r.last_active_date, r.recent_days], [0, 5, null, 0]);
});

// ---- Client RPCs ----

test('set_timezone saves a valid zone', async () => {
  const db = await setup();
  await as(db, B, `select public.set_timezone('America/Toronto')`);
  assert.equal((await row(db, B)).timezone, 'America/Toronto');
});

test('set_timezone rejects an unknown zone', async () => {
  const db = await setup();
  await assert.rejects(as(db, B, `select public.set_timezone('Mars/Olympus')`), /INVALID_TIMEZONE/);
});

test('set_timezone and get_streak_summary need a signed-in user', async () => {
  const db = await setup();
  await assert.rejects(as(db, null, `select public.set_timezone('UTC')`), /permission denied/);
  await assert.rejects(as(db, null, `select * from public.get_streak_summary()`), /permission denied/);
});

test("get_streak_summary uses the learner's local date", async () => {
  const db = await setup();
  await as(db, B, `select public.set_timezone('Pacific/Kiritimati')`);
  const { rows } = await as(db, B, `select * from public.get_streak_summary()`);
  const expected = await db.query(`select (now() at time zone 'Pacific/Kiritimati')::date as d`);
  assert.equal(ymd(rows[0].today), ymd(expected.rows[0].d));
});

test('the local date follows the timezone (UTC+14 is ahead of UTC-11)', async () => {
  const db = await setup();
  await db.exec(`update public.user_streaks set timezone = 'Pacific/Kiritimati' where user_id = '${A}';
                 update public.user_streaks set timezone = 'Pacific/Pago_Pago' where user_id = '${B}';`);
  const { rows } = await db.query(`select public.user_local_date($1) > public.user_local_date($2) as ahead`, [A, B]);
  assert.equal(rows[0].ahead, true);
});

test('claim_exercise_pull marks today done once and keeps its return shape', async () => {
  const db = await setup();
  const first = await as(db, B, `select * from public.claim_exercise_pull('study')`);
  await as(db, B, `select * from public.claim_exercise_pull('match')`);
  assert.deepEqual(first.fields.map((f) => f.name), ['granted', 'reason', 'current_lotto_pulls', 'max_lotto_pulls', 'next_pull_at', 'server_now']);
  const { rows } = await as(db, B, `select * from public.get_streak_summary()`);
  assert.equal(rows[0].current_streak, 1);
  assert.equal(rows[0].days.at(-1), 'done');
});

test('a finished lesson claims a pull and keeps the streak, and unknown sources are refused', async () => {
  const db = await setup();
  const { rows } = await as(db, B, `select * from public.claim_exercise_pull('lesson')`);
  assert.equal(rows[0].reason, 'granted');
  assert.equal((await row(db, B)).current_streak, 1);
  await assert.rejects(as(db, B, `select * from public.claim_exercise_pull('quiz')`), /INVALID_SOURCE/);
});

test('spending a lotto pull marks today done', async () => {
  const db = await setup();
  const spent = await as(db, B, `select * from public.spend_lotto_pull()`);
  assert.equal(spent.rows[0].current_lotto_pulls, 0);
  const { rows } = await as(db, B, `select * from public.get_streak_summary()`);
  assert.deepEqual([rows[0].current_streak, rows[0].days.at(-1)], [1, 'done']);
});

test('a pull with none left counts nothing', async () => {
  const db = await setup();
  await db.exec(`insert into public.lotto_state (user_id, current_lotto_pulls) values ('${B}', 0)`);
  await assert.rejects(as(db, B, `select * from public.spend_lotto_pull()`), /NO_PULLS/);
  const { rows } = await as(db, B, `select * from public.get_streak_summary()`);
  assert.deepEqual([rows[0].current_streak, rows[0].days.at(-1)], [0, 'pending']);
});

test('a pull and an exercise on the same day count once', async () => {
  const db = await setup();
  await as(db, B, `select * from public.spend_lotto_pull()`);
  await as(db, B, `select * from public.claim_exercise_pull('study')`);
  assert.equal((await row(db, B)).current_streak, 1);
});

test('signed-in users cannot call the functions that take a user id', async () => {
  const db = await setup();
  for (const sql of [
    `select public.record_activity('${B}')`,
    `select public.record_activity_on('${B}', '2026-10-01')`,
    `select * from public.streak_summary_for('${B}', '2026-10-01')`,
    `select public.user_local_date('${B}')`,
  ]) {
    await assert.rejects(as(db, B, sql), /permission denied/, sql);
  }
});

test('signed-in users can read only their own row and cannot write it', async () => {
  const db = await setup();
  const read = await as(db, B, `select user_id from public.user_streaks`);
  assert.deepEqual(read.rows.map((r) => r.user_id), [B]);
  const upd = await as(db, B, `update public.user_streaks set current_streak = 99 returning user_id`);
  assert.equal(upd.rows.length, 0);
  await assert.rejects(as(db, C, `insert into public.user_streaks (user_id, current_streak) values ('${C}', 99)`), /row-level security/);
  assert.equal((await row(db, B)).current_streak, 0);
});
