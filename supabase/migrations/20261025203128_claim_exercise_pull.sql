-- One bonus pull per exercise per UTC day.
create table public.lotto_bonus_claims (
  user_id    uuid not null references auth.users (id) on delete cascade,
  source     text not null check (source in ('study', 'match')),
  claimed_on date not null,
  claimed_at timestamptz not null default now(),
  primary key (user_id, source, claimed_on)
);

-- Only claim_exercise_pull writes here; clients get no direct access.
alter table public.lotto_bonus_claims enable row level security;

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
  uid   uuid := auth.uid();
  today date := (now() at time zone 'utc')::date;
  g     record;
begin
  if uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if p_source is null or p_source not in ('study', 'match') then raise exception 'INVALID_SOURCE'; end if;

  insert into public.lotto_bonus_claims (user_id, source, claimed_on)
  values (uid, p_source, today)
  on conflict do nothing;

  if not found then
    return query select false, 'already_claimed'::text, s.current_lotto_pulls, s.max_lotto_pulls, s.next_pull_at, s.server_now
                   from public.get_lotto_state() s;
    return;
  end if;

  select * into g from public.grant_lotto_pull(uid);

  if not g.granted then
    -- Tray was full: give the claim back so a later session today can still earn it.
    delete from public.lotto_bonus_claims c
     where c.user_id = uid and c.source = p_source and c.claimed_on = today;
    return query select false, 'full'::text, s.current_lotto_pulls, s.max_lotto_pulls, s.next_pull_at, s.server_now
                   from public.get_lotto_state() s;
    return;
  end if;

  return query select true, 'granted'::text, g.current_lotto_pulls, g.max_lotto_pulls, g.next_pull_at, now();
end;
$$;

revoke all on function public.claim_exercise_pull(text) from public, anon;
grant execute on function public.claim_exercise_pull(text) to authenticated;
