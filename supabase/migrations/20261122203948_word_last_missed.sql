-- What Study needs to pick words: when each word was last answered wrong, and how many of the learner's
-- local days ago that was and the word was added. The client never works out "today", so the server
-- returns days ago instead of dates.

alter table public.user_words add column last_missed_on date;

comment on column public.user_words.last_missed_on is 'Local date of the latest wrong answer. Server-only: written by record_word_results().';

-- Best guess for words answered before this column: last missed when they were last seen, if that answer
-- was wrong (bit 0 of recent_results is the newest answer). UTC, since older misses aren't recorded.
update public.user_words set last_missed_on = last_seen_at::date
where times_seen > 0 and last_seen_at is not null and recent_results & 1 = 0;

-- ---------- record_word_results: also stamps last_missed_on on a wrong answer ----------

create or replace function public.record_word_results(p_results jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  uid            uuid := auth.uid();
  today          date;
  r              jsonb;
  ok             boolean;
  k              text;
  wid            bigint;
  uw             public.user_words%rowtype;
  was_mastered   boolean;
  base           int;
  new_s          smallint;
  new_recent     smallint;
  new_days       smallint;
  new_hard       smallint;
  newly          boolean;
  key            text;
  changes        jsonb := '{}'::jsonb;
  mastered_now   int := 0;
  total_mastered int;
  milestones     int := 0;
  pulls          int := 0;
  g              record;
  i              int;
begin
  if uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if jsonb_typeof(p_results) is distinct from 'array' then raise exception 'INVALID_RESULTS'; end if;
  if jsonb_array_length(p_results) > 200 then raise exception 'TOO_MANY_RESULTS'; end if;
  today := public.user_local_date(uid);

  for r in select e.value from jsonb_array_elements(p_results) with ordinality as e(value, n) order by e.n loop
    wid := (r ->> 'word_id')::bigint;
    ok  := (r ->> 'correct')::boolean;
    k   := coalesce(r ->> 'kind', 'recognition');
    if wid is null or ok is null then raise exception 'INVALID_RESULTS'; end if;
    if k not in ('recognition', 'recall', 'production') then raise exception 'INVALID_KIND'; end if;

    select * into uw from public.user_words x where x.user_id = uid and x.word_id = wid for update;
    if not found then continue; end if;

    was_mastered := uw.mastered_at is not null;
    -- Start from the faded strength, so a long break costs what it should.
    base := public.word_effective_strength(uw.strength, uw.last_seen_at, uw.days_correct, was_mastered);

    key := wid::text;
    if not changes ? key then
      changes := changes || jsonb_build_object(key, jsonb_build_object(
        'word_id', wid,
        'old_strength', base,
        'old_stage', public.word_stage(uw.times_seen, base, was_mastered),
        'newly_mastered', false));
    end if;

    new_s := public.word_strength_after(base, ok, k,
               extract(epoch from (now() - uw.last_seen_at)) / 3600.0);
    new_recent := (((uw.recent_results << 1) | (case when ok then 1 else 0 end)) & 255)::smallint;
    new_days := uw.days_correct
      + case when ok and (uw.last_correct_on is null or uw.last_correct_on < today) then 1 else 0 end;
    new_hard := uw.hard_correct + case when ok and k = 'production' then 1 else 0 end;
    newly := not was_mastered and public.word_mastery_met(new_s, new_days, new_hard, new_recent);

    update public.user_words x set
      times_seen      = x.times_seen + 1,
      times_correct   = x.times_correct + case when ok then 1 else 0 end,
      correct_streak  = case when ok then x.correct_streak + 1 else 0 end,
      last_seen_at    = now(),
      strength        = new_s,
      recent_results  = new_recent,
      days_correct    = new_days,
      last_correct_on = case when ok then greatest(coalesce(x.last_correct_on, today), today) else x.last_correct_on end,
      last_missed_on  = case when ok then x.last_missed_on else greatest(coalesce(x.last_missed_on, today), today) end,
      hard_correct    = new_hard,
      mastered_at     = case when newly then now() else x.mastered_at end
    where x.id = uw.id;

    if newly then mastered_now := mastered_now + 1; end if;

    changes := jsonb_set(changes, array[key], (changes -> key) || jsonb_build_object(
      'new_strength', new_s,
      'new_stage', public.word_stage(uw.times_seen + 1, new_s, was_mastered or newly),
      'newly_mastered', ((changes -> key ->> 'newly_mastered')::boolean or newly)));
  end loop;

  select count(*) into total_mastered from public.user_words x where x.user_id = uid and x.mastered_at is not null;

  -- Rewards: a pull per newly mastered word (capped at max), a guaranteed Rare every 10 mastered.
  for i in 1..mastered_now loop
    select * into g from public.grant_lotto_pull(uid);
    if g.granted then pulls := pulls + 1; end if;
  end loop;

  milestones := total_mastered / 10 - (total_mastered - mastered_now) / 10;
  for i in 1..milestones loop
    perform public.grant_lotto_guarantee(uid, 'Rare'::public.rarity, 'mastery_milestone');
  end loop;

  return jsonb_build_object(
    'words', coalesce((select jsonb_agg(e.v order by (e.v ->> 'newly_mastered')::boolean desc)
                         from jsonb_each(changes) as e(k, v)), '[]'::jsonb),
    'mastered_count', mastered_now,
    'mastered_total', total_mastered,
    'pulls_granted', pulls,
    'guarantees_granted', milestones,
    'next_guarantee_at', (total_mastered / 10 + 1) * 10);
end;
$function$;

-- ---------- get_word_progress: adds added_days_ago and missed_days_ago ----------

-- A new return column needs a drop. Security definer now, to read the learner's local day through
-- user_local_date (which clients can't call); it still only returns auth.uid()'s rows.
drop function public.get_word_progress(bigint);

create function public.get_word_progress(p_language_id bigint default null)
returns table(
  word_id bigint, word text, meaning text, rarity public.rarity, word_type public.word_type, gender text,
  strength smallint, stage text,
  times_seen integer, times_correct integer, days_correct smallint, hard_correct smallint,
  recent_results smallint, recent_count smallint,
  mastered_at timestamptz, last_seen_at timestamptz, next_review_at timestamptz, added_at timestamptz,
  added_days_ago integer, missed_days_ago integer)
language sql
stable
security definer
set search_path = ''
as $$
  select w.id, w.word, w.meaning, w.rarity, w.word_type, w.gender,
         e.eff,
         public.word_stage(uw.times_seen, e.eff, uw.mastered_at is not null),
         uw.times_seen, uw.times_correct, uw.days_correct, uw.hard_correct,
         uw.recent_results, least(uw.times_seen, 8)::smallint,
         uw.mastered_at, uw.last_seen_at,
         -- Due again once it has faded about 20% (0.32 of a half-life).
         case when uw.last_seen_at is not null then
           uw.last_seen_at + make_interval(secs => (0.32 * public.word_half_life_days(uw.days_correct, uw.mastered_at is not null) * 86400)::double precision)
         end,
         uw.created_at,
         -- Never negative: a word added "tomorrow" in UTC is still added today.
         greatest(0, t.today - (uw.created_at at time zone t.tz)::date),
         t.today - uw.last_missed_on
    from public.user_words uw
    join public.words w on w.id = uw.word_id
    cross join (
      select public.user_local_date(auth.uid()) as today,
             coalesce((select s.timezone from public.user_streaks s where s.user_id = auth.uid()), 'UTC') as tz) t
    cross join lateral (select public.word_effective_strength(
        uw.strength, uw.last_seen_at, uw.days_correct, uw.mastered_at is not null) as eff) e
   where uw.user_id = auth.uid()
     and (p_language_id is null or w.language_id = p_language_id)
   order by uw.created_at;
$$;

revoke all on function public.get_word_progress(bigint) from public, anon;
grant execute on function public.get_word_progress(bigint) to authenticated;
