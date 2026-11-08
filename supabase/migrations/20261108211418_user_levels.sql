-- A learner finishes a level once they've completed every module in it. complete_module records that
-- in user_levels the moment the last one is done, and reports it as level_completed. The row is never
-- removed, so a module added to a finished level later doesn't reopen it.
create table public.user_levels (
  user_id      uuid        not null references auth.users(id) on delete cascade,
  level_id     bigint      not null references public.levels(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, level_id)
);

comment on table public.user_levels is 'One row per level a learner has finished. Server-only: written by complete_module().';

create index user_levels_level_id_idx on public.user_levels (level_id);

alter table public.user_levels enable row level security;

create policy "user_levels: read own" on public.user_levels
  for select using ((select auth.uid()) = user_id);

-- Learners who had already finished every module of a level, dated by the last of those modules.
insert into public.user_levels (user_id, level_id, completed_at)
select um.user_id, m.level_id, max(um.first_completed_at)
  from public.user_modules um
  join public.modules m on m.id = um.module_id
 group by um.user_id, m.level_id
having count(*) = (select count(*) from public.modules x where x.level_id = m.level_id)
on conflict (user_id, level_id) do nothing;

-- The return type changes, so the function is dropped and created again.
drop function public.complete_module(bigint, smallint);

create function public.complete_module(p_module_id bigint, p_score smallint default null)
returns table(
  first_completion    boolean,
  times_completed     integer,
  best_score          smallint,
  pull_granted        boolean,
  current_lotto_pulls integer,
  max_lotto_pulls     integer,
  next_pull_at        timestamptz,
  words_added         integer,
  level_completed     boolean
)
language plpgsql
security definer
set search_path to ''
as $function$
declare
  uid      uuid := auth.uid();
  m        public.modules%rowtype;
  prev     bigint;
  um       public.user_modules%rowtype;
  granted  boolean := false;
  cur      integer;
  mx       integer;
  nxt      timestamptz;
  added    integer;
  finished integer := 0;
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

  -- The level is finished once none of its modules is missing a user_modules row. Only the first time counts.
  if not exists (
    select 1 from public.modules mm
     where mm.level_id = m.level_id
       and not exists (select 1 from public.user_modules u where u.user_id = uid and u.module_id = mm.id)
  ) then
    insert into public.user_levels (user_id, level_id)
    values (uid, m.level_id)
    on conflict (user_id, level_id) do nothing;
    get diagnostics finished = row_count;
  end if;

  -- user_words has no unique key, so only words the learner doesn't own yet go in.
  insert into public.user_words (user_id, word_id)
  select uid, mw.word_id
    from public.module_words mw
   where mw.module_id = p_module_id
     and not exists (select 1 from public.user_words uw where uw.user_id = uid and uw.word_id = mw.word_id)
   order by mw.position;
  get diagnostics added = row_count;

  perform public.record_activity(uid);

  -- Bonus pull (capped at max) for the first completion only.
  if um.times_completed = 1 then
    select gp.granted, gp.current_lotto_pulls, gp.max_lotto_pulls, gp.next_pull_at
      into granted, cur, mx, nxt
      from public.grant_lotto_pull(uid) gp;
  else
    select ls.current_lotto_pulls, ls.max_lotto_pulls, ls.next_pull_at
      into cur, mx, nxt
      from public.get_lotto_state() ls;
  end if;

  return query select um.times_completed = 1, um.times_completed, um.best_score,
                      coalesce(granted, false), cur, mx, nxt, added, finished > 0;
end;
$function$;

revoke all on function public.complete_module(bigint, smallint) from public, anon;
grant execute on function public.complete_module(bigint, smallint) to authenticated;
