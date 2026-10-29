-- Finishing a Learn module (a lesson) earns a pull and keeps the streak, like Flashcards and Matching.
-- Signature and return shape unchanged; only the allowed sources grow.
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
  if p_source is null or p_source not in ('study', 'match', 'lesson') then raise exception 'INVALID_SOURCE'; end if;

  perform public.record_activity(uid);

  select * into g from public.grant_lotto_pull(uid);

  return query select g.granted,
                      case when g.granted then 'granted' else 'full' end,
                      g.current_lotto_pulls, g.max_lotto_pulls, g.next_pull_at, now();
end;
$$;

revoke all on function public.claim_exercise_pull(text) from public, anon;
grant execute on function public.claim_exercise_pull(text) to authenticated;
