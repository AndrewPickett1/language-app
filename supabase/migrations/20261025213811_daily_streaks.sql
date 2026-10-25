-- Daily streaks, kept on public.user_streaks.
--
-- A day is the learner's local day, from the IANA timezone on their row. The server works out
-- the date; the client never sends one.
--
-- recent_days is a 7-bit mask of the last 7 days, anchored to last_active_date:
-- bit 0 = last_active_date, bit 6 = six days before it. Storage stays one row per user.
--
-- Reset is lazy: nothing runs at midnight. streak_summary_for() re-anchors the streak and the mask
-- to today when they're read, so a missed day shows as 0 / 'missed' without a write.
-- Only record_activity_on() writes, and only claim_exercise_pull() calls it (via record_activity).

alter table public.user_streaks
  add column timezone text not null default 'UTC',
  add column last_active_date date,
  add column recent_days smallint not null default 0 check (recent_days between 0 and 127);

-- Streaks from before this had no date. Treat them as kept through yesterday (UTC) so they aren't
-- lost on the first read; finishing an exercise today keeps them going.
update public.user_streaks
   set last_active_date = (now() at time zone 'UTC')::date - 1,
       recent_days      = (1 << least(current_streak, 7)) - 1
 where current_streak > 0 and last_active_date is null;

-- Today's date where the learner is. Unknown users and bad timezones fall back to UTC.
create or replace function public.user_local_date(p_user uuid)
returns date
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  tz text;
begin
  select s.timezone into tz from public.user_streaks s where s.user_id = p_user;
  return (now() at time zone coalesce(tz, 'UTC'))::date;
exception when invalid_parameter_value then
  return (now() at time zone 'UTC')::date;
end;
$$;

-- Counts p_day toward the streak. Repeat calls for the same day change nothing.
-- A day earlier than the last one counted (after a timezone change) is ignored.
create or replace function public.record_activity_on(p_user uuid, p_day date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  s   public.user_streaks%rowtype;
  gap integer;
  cur integer;
  mask integer;
begin
  if p_user is null then raise exception 'USER_REQUIRED'; end if;
  if p_day is null then raise exception 'DAY_REQUIRED'; end if;

  insert into public.user_streaks (user_id) values (p_user) on conflict (user_id) do nothing;
  select * into s from public.user_streaks us where us.user_id = p_user for update;

  if s.last_active_date is not null and p_day <= s.last_active_date then return; end if;

  gap  := p_day - s.last_active_date;  -- null on the first ever day
  cur  := case when gap = 1 then s.current_streak + 1 else 1 end;
  mask := case when gap is null or gap >= 7 then 1 else ((s.recent_days::integer << gap) & 127) | 1 end;

  update public.user_streaks us
     set current_streak   = least(cur, 32767),
         best_streak      = greatest(s.best_streak, least(cur, 32767)),
         last_active_date = p_day,
         recent_days      = mask,
         updated_at       = now()
   where us.user_id = p_user;
end;
$$;

create or replace function public.record_activity(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.record_activity_on(p_user, public.user_local_date(p_user));
end;
$$;

-- The streak as of p_today. days runs oldest to today: 'done', 'missed', or 'pending' (today, not done yet).
create or replace function public.streak_summary_for(p_user uuid, p_today date)
returns table (current_streak integer, best_streak integer, today date, days text[])
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  s    public.user_streaks%rowtype;
  gap  integer;
  mask integer := 0;
  cur  integer := 0;
  out_days text[] := '{}';
  i    integer;
begin
  select * into s from public.user_streaks us where us.user_id = p_user;

  if found and s.last_active_date is not null then
    -- A timezone change can put the last day after "today"; treat that as today.
    gap  := greatest(p_today - s.last_active_date, 0);
    mask := case when gap >= 7 then 0 else (s.recent_days::integer << gap) & 127 end;
    cur  := case when gap <= 1 then s.current_streak else 0 end;
  end if;

  for i in reverse 6..0 loop
    out_days := out_days || case
      when (mask >> i) & 1 = 1 then 'done'
      when i = 0 then 'pending'
      else 'missed'
    end;
  end loop;

  return query select cur, greatest(coalesce(s.best_streak, 0), cur), p_today, out_days;
end;
$$;

-- What the client calls to read its own streak.
create or replace function public.get_streak_summary()
returns table (current_streak integer, best_streak integer, today date, days text[])
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  return query select * from public.streak_summary_for(uid, public.user_local_date(uid));
end;
$$;

-- Saves the learner's IANA timezone (e.g. 'America/Toronto'), which decides when their day rolls over.
create or replace function public.set_timezone(p_tz text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if p_tz is null or not exists (select 1 from pg_catalog.pg_timezone_names n where n.name = p_tz) then
    raise exception 'INVALID_TIMEZONE';
  end if;

  insert into public.user_streaks (user_id, timezone) values (uid, p_tz)
  on conflict (user_id) do update set timezone = excluded.timezone, updated_at = now()
  where public.user_streaks.timezone is distinct from excluded.timezone;
end;
$$;

-- Finishing an exercise now also counts toward the streak. Signature and return shape unchanged.
create or replace function public.claim_exercise_pull(p_source text)
returns table (
  granted boolean,
  reason text,
  current_lotto_pulls integer,
  max_lotto_pulls integer,
  next_pull_at timestamptz,
  server_now timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  g   record;
begin
  if uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if p_source is null or p_source not in ('study', 'match') then raise exception 'INVALID_SOURCE'; end if;

  perform public.record_activity(uid);

  select * into g from public.grant_lotto_pull(uid);

  return query select g.granted,
                      case when g.granted then 'granted' else 'full' end,
                      g.current_lotto_pulls, g.max_lotto_pulls, g.next_pull_at, now();
end;
$$;

-- Functions that take a user id are server-only.
revoke all on function public.user_local_date(uuid) from public, anon, authenticated;
revoke all on function public.record_activity_on(uuid, date) from public, anon, authenticated;
revoke all on function public.record_activity(uuid) from public, anon, authenticated;
revoke all on function public.streak_summary_for(uuid, date) from public, anon, authenticated;

revoke all on function public.get_streak_summary() from public, anon;
revoke all on function public.set_timezone(text) from public, anon;
grant execute on function public.get_streak_summary() to authenticated;
grant execute on function public.set_timezone(text) to authenticated;

revoke all on function public.claim_exercise_pull(text) from public, anon;
grant execute on function public.claim_exercise_pull(text) to authenticated;
