create table public.user_modules (
  user_id            uuid        not null references auth.users(id) on delete cascade,
  module_id          bigint      not null references public.modules(id) on delete cascade,
  first_completed_at timestamptz not null default now(),
  last_completed_at  timestamptz not null default now(),
  times_completed    integer     not null default 1 check (times_completed >= 1),
  best_score         smallint    check (best_score between 0 and 100),
  primary key (user_id, module_id)
);

comment on table public.user_modules is 'One row per module a learner has completed. Server-only: written by complete_module().';

create index user_modules_module_id_idx on public.user_modules (module_id);

alter table public.user_modules enable row level security;

create policy "user_modules: read own" on public.user_modules
  for select using ((select auth.uid()) = user_id);

create or replace function public.complete_module(p_module_id bigint, p_score smallint default null)
returns table(
  first_completion    boolean,
  times_completed     integer,
  best_score          smallint,
  pull_granted        boolean,
  current_lotto_pulls integer,
  max_lotto_pulls     integer,
  next_pull_at        timestamptz
)
language plpgsql
security definer
set search_path to ''
as $function$
declare
  uid  uuid := auth.uid();
  m    public.modules%rowtype;
  prev bigint;
  um   public.user_modules%rowtype;
  g    record;
begin
  if uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if p_score is not null and (p_score < 0 or p_score > 100) then raise exception 'INVALID_SCORE'; end if;

  select * into m from public.modules mm where mm.id = p_module_id;
  if not found then raise exception 'UNKNOWN_MODULE'; end if;

  -- The module just before this one in its language must already be completed.
  select mm.id into prev from public.modules mm
   where mm.language_id = m.language_id and mm.position < m.position
   order by mm.position desc limit 1;

  if prev is not null and not exists (
    select 1 from public.user_modules u where u.user_id = uid and u.module_id = prev
  ) then
    raise exception 'MODULE_LOCKED';
  end if;

  insert into public.user_modules as u (user_id, module_id, best_score)
  values (uid, p_module_id, p_score)
  on conflict (user_id, module_id) do update
     set last_completed_at = now(),
         times_completed   = u.times_completed + 1,
         best_score        = greatest(u.best_score, excluded.best_score)
  returning u.* into um;

  perform public.record_activity(uid);

  -- Bonus pull (capped at max) for the first completion only.
  if um.times_completed = 1 then
    select * into g from public.grant_lotto_pull(uid);
  else
    select * into g from public.get_lotto_state();
    g := row(false, g.current_lotto_pulls, g.max_lotto_pulls, g.next_pull_at);
  end if;

  return query select um.times_completed = 1, um.times_completed, um.best_score,
                      coalesce(g.granted, false), g.current_lotto_pulls, g.max_lotto_pulls, g.next_pull_at;
end;
$function$;

revoke all on function public.complete_module(bigint, smallint) from public, anon;
grant execute on function public.complete_module(bigint, smallint) to authenticated;
