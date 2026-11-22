-- The Daily Review: a mixed round of exercises on the learner's own words.
--
-- One daily_reviews row per learner per local day (user_local_date). The first round finished that day
-- earns a pull and keeps the streak; later rounds only count up `rounds`. Only complete_daily_review()
-- writes it; clients can read their own rows.

create table public.daily_reviews (
  user_id            uuid not null references auth.users (id) on delete cascade,
  review_date        date not null,
  rounds             integer not null default 1 check (rounds >= 1),
  pull_granted       boolean not null default false,
  first_completed_at timestamptz not null default now(),
  last_completed_at  timestamptz not null default now(),
  primary key (user_id, review_date)
);

comment on table public.daily_reviews is 'Daily Review rounds per learner per local day. Server-only: written by complete_daily_review().';

alter table public.daily_reviews enable row level security;

create policy "Learners read their own daily reviews" on public.daily_reviews
  for select to authenticated using (user_id = (select auth.uid()));

revoke insert, update, delete, truncate on public.daily_reviews from anon, authenticated;
grant select on public.daily_reviews to authenticated;

-- Records a finished Daily Review round. The first round of the learner's local day grants a pull
-- (capped at max by grant_lotto_pull: `full` grants nothing) and keeps the streak.
-- reason: 'granted', 'full', or 'already_reviewed' (a later round, which earns nothing). The lotto
-- columns are null for a later round, since nothing about the pulls changed.
create or replace function public.complete_daily_review()
returns table (
  first_today         boolean,
  rounds_today        integer,
  granted             boolean,
  reason              text,
  current_lotto_pulls integer,
  max_lotto_pulls     integer,
  next_pull_at        timestamptz,
  server_now          timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid   uuid := auth.uid();
  d     date;
  n     integer;
  first boolean;
  g     record;
begin
  if uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  d := public.user_local_date(uid);

  -- The row lock on (uid, d) means two rounds finished at once can't both be first.
  insert into public.daily_reviews as r (user_id, review_date) values (uid, d)
  on conflict (user_id, review_date) do update set rounds = r.rounds + 1, last_completed_at = now()
  returning r.rounds into n;

  -- A timezone change that moves today back can't earn a second reward.
  first := n = 1 and not exists (
    select 1 from public.daily_reviews r where r.user_id = uid and r.review_date > d
  );

  perform public.record_activity(uid);

  if not first then
    return query select false, n, false, 'already_reviewed'::text, null::integer, null::integer, null::timestamptz, now();
    return;
  end if;

  select * into g from public.grant_lotto_pull(uid);
  update public.daily_reviews r set pull_granted = g.granted where r.user_id = uid and r.review_date = d;

  return query select true, n, g.granted,
                      case when g.granted then 'granted' else 'full' end,
                      g.current_lotto_pulls, g.max_lotto_pulls, g.next_pull_at, now();
end;
$$;

-- Whether the learner has finished a Daily Review round today, and how many.
create or replace function public.get_daily_review_status()
returns table (done_today boolean, rounds_today integer, today date)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  d   date;
  n   integer;
begin
  if uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  d := public.user_local_date(uid);
  select r.rounds into n from public.daily_reviews r where r.user_id = uid and r.review_date = d;
  return query select coalesce(n, 0) > 0, coalesce(n, 0), d;
end;
$$;

revoke all on function public.complete_daily_review() from public, anon;
revoke all on function public.get_daily_review_status() from public, anon;
grant execute on function public.complete_daily_review() to authenticated;
grant execute on function public.get_daily_review_status() to authenticated;
