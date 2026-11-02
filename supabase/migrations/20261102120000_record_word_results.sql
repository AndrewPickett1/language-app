-- Per-word answer stats on user_words (times_seen, times_correct, correct_streak, last_seen_at).
--
-- Only record_word_results() writes them. The client inserts user_words rows with just user_id and
-- word_id (a won Lotto word), so it can't start a word with made-up stats.

-- The API roles had insert and update on every column, and a column revoke can't undo a table grant.
-- user_words has no update policy, so nothing was updating it; give back only the insert the client does.
revoke insert, update on public.user_words from anon, authenticated;
grant insert (user_id, word_id) on public.user_words to authenticated;

-- Records the learner seeing words, in order. p_results is a JSON array of
-- {"word_id": <id>, "correct": true | false | null}: every entry counts as seen and stamps last_seen_at,
-- true also counts as correct and grows the streak, false resets the streak, and null (a word shown
-- without a question, like Meet the word) leaves both alone. Words the learner doesn't own are skipped.
create or replace function public.record_word_results(p_results jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  r   jsonb;
  ok  boolean;
begin
  if uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if jsonb_typeof(p_results) is distinct from 'array' then raise exception 'INVALID_RESULTS'; end if;
  if jsonb_array_length(p_results) > 200 then raise exception 'TOO_MANY_RESULTS'; end if;

  for r in select e.value from jsonb_array_elements(p_results) with ordinality as e(value, n) order by e.n loop
    ok := (r ->> 'correct')::boolean;
    update public.user_words uw set
      times_seen     = uw.times_seen + 1,
      times_correct  = uw.times_correct + (case when ok then 1 else 0 end),
      correct_streak = case when ok then uw.correct_streak + 1 when not ok then 0 else uw.correct_streak end,
      last_seen_at   = now()
    where uw.user_id = uid and uw.word_id = (r ->> 'word_id')::bigint;
  end loop;
end;
$$;

revoke all on function public.record_word_results(jsonb) from public, anon;
grant execute on function public.record_word_results(jsonb) to authenticated;
