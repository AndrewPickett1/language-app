// Tests for the Daily Review (complete_daily_review), against an in-process Postgres (PGlite).
// Run with: npm run test:db
import { PGlite } from '@electric-sql/pglite';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const migration = (name) => readFileSync(new URL(`../migrations/${name}`, import.meta.url), 'utf8');

const A = '00000000-0000-0000-0000-00000000000a';
const B = '00000000-0000-0000-0000-00000000000b';

// Just enough of Supabase for the migrations: auth.users, auth.uid(), the API roles, and a
// grant_lotto_pull stand-in that logs its calls and reports a full tray when `tray_full` says so.
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

  create table public.pull_log (user_id uuid);
  create table public.tray_full (user_id uuid primary key);
  create function public.grant_lotto_pull(p_user uuid)
  returns table (granted boolean, current_lotto_pulls integer, max_lotto_pulls integer, next_pull_at timestamptz)
  language plpgsql security definer set search_path = '' as $$
  begin
    if exists (select 1 from public.tray_full f where f.user_id = p_user) then
      return query select false, 3, 3, null::timestamptz;
      return;
    end if;
    insert into public.pull_log values (p_user);
    return query select true, 2, 3, now() + interval '3 hours';
  end;
  $$;
  revoke all on function public.grant_lotto_pull(uuid) from public;
`;

async function setup() {
  const db = new PGlite();
  await db.exec(Stubs);
  await db.exec(`insert into auth.users values ('${A}'), ('${B}');`);
  await db.exec(migration('20261025212531_create_user_streaks.sql'));
  await db.exec(migration('20261025212740_drop_profiles_streak_columns.sql'));
  await db.exec(migration('20261025213811_daily_streaks.sql'));
  await db.exec(`grant all on public.user_streaks to anon, authenticated;`);
  await db.exec(migration('20261122204440_daily_review.sql'));
  return db;
}

/** Runs `sql` as a signed-in user (or anon when `user` is null), the way PostgREST would. */
async function as(db, user, sql, params) {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${user ? 'authenticated' : 'anon'}`);
    await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [user ?? '']);
    return tx.query(sql, params);
  });
}

async function complete(db, user) {
  const { rows } = await as(db, user, `select * from public.complete_daily_review()`);
  return rows[0];
}

async function status(db, user) {
  const { rows } = await as(db, user, `select * from public.get_daily_review_status()`);
  return rows[0];
}

async function pullsGranted(db, user) {
  const { rows } = await db.query(`select count(*)::int as n from public.pull_log where user_id = $1`, [user]);
  return rows[0].n;
}

test('the first review of the day grants a pull', async () => {
  const db = await setup();
  assert.equal((await status(db, A)).done_today, false);
  const done = await complete(db, A);
  assert.equal(done.first_today, true);
  assert.equal(done.rounds_today, 1);
  assert.equal(done.granted, true);
  assert.equal(done.reason, 'granted');
  assert.equal(done.current_lotto_pulls, 2);
  assert.equal(await pullsGranted(db, A), 1);
  const s = await status(db, A);
  assert.equal(s.done_today, true);
  assert.equal(s.rounds_today, 1);
});

test('later reviews the same day count rounds but grant nothing', async () => {
  const db = await setup();
  await complete(db, A);
  const again = await complete(db, A);
  assert.equal(again.first_today, false);
  assert.equal(again.rounds_today, 2);
  assert.equal(again.granted, false);
  assert.equal(again.reason, 'already_reviewed');
  assert.equal(again.current_lotto_pulls, null);
  await complete(db, A);
  assert.equal(await pullsGranted(db, A), 1);
  assert.equal((await status(db, A)).rounds_today, 3);
});

test('the next local day earns a pull again', async () => {
  const db = await setup();
  await complete(db, A);
  await db.exec(`update public.daily_reviews set review_date = review_date - 1 where user_id = '${A}'`);
  assert.equal((await status(db, A)).done_today, false);
  const done = await complete(db, A);
  assert.equal(done.first_today, true);
  assert.equal(done.granted, true);
  assert.equal(await pullsGranted(db, A), 2);
});

test('a review dated after today (timezone change) blocks a second reward', async () => {
  const db = await setup();
  await complete(db, A);
  await db.exec(`update public.daily_reviews set review_date = review_date + 1 where user_id = '${A}'`);
  const done = await complete(db, A);
  assert.equal(done.first_today, false);
  assert.equal(done.granted, false);
  assert.equal(await pullsGranted(db, A), 1);
});

test('a full tray still uses up the day', async () => {
  const db = await setup();
  await db.exec(`insert into public.tray_full values ('${A}')`);
  const done = await complete(db, A);
  assert.equal(done.first_today, true);
  assert.equal(done.granted, false);
  assert.equal(done.reason, 'full');
  const { rows } = await db.query(`select pull_granted from public.daily_reviews where user_id = $1`, [A]);
  assert.equal(rows[0].pull_granted, false);
  assert.equal((await complete(db, A)).reason, 'already_reviewed');
});

test('every review keeps the streak', async () => {
  const db = await setup();
  await complete(db, A);
  const { rows } = await as(db, A, `select * from public.get_streak_summary()`);
  assert.equal(rows[0].current_streak, 1);
  assert.equal(rows[0].days.at(-1), 'done');
});

test("one learner's review doesn't use up another's", async () => {
  const db = await setup();
  await complete(db, A);
  assert.equal((await complete(db, B)).granted, true);
  assert.equal((await status(db, B)).rounds_today, 1);
});

test('learners read only their own rows and cannot write them', async () => {
  const db = await setup();
  await complete(db, A);
  await complete(db, B);
  const { rows } = await as(db, A, `select user_id from public.daily_reviews`);
  assert.deepEqual(rows.map((r) => r.user_id), [A]);
  await assert.rejects(as(db, A, `update public.daily_reviews set rounds = 0`), /permission denied/);
  await assert.rejects(as(db, A, `insert into public.daily_reviews (user_id, review_date) values ('${A}', '2000-01-01')`), /permission denied/);
  await assert.rejects(as(db, A, `delete from public.daily_reviews`), /permission denied/);
});

test('the functions need a signed-in user', async () => {
  const db = await setup();
  await assert.rejects(as(db, null, `select * from public.complete_daily_review()`), /permission denied/);
  await assert.rejects(as(db, null, `select * from public.get_daily_review_status()`), /permission denied/);
});
