-- ---------- Tunable rules (pure functions, easy to adjust) ----------

-- Days for strength to halve. Doubles with each day the word was right (up to 6), and again once mastered.
create or replace function public.word_half_life_days(p_days_correct int, p_mastered boolean)
returns numeric language sql immutable set search_path = '' as $$
  select (2 * power(2, least(greatest(coalesce(p_days_correct, 0), 0), 6))
            * case when p_mastered then 2 else 1 end)::numeric
$$;

-- Strength right now, after fading since it was last seen.
create or replace function public.word_effective_strength(
  p_strength int, p_last_seen timestamptz, p_days_correct int, p_mastered boolean, p_now timestamptz default now())
returns smallint language sql stable set search_path = '' as $$
  select (case when p_last_seen is null then p_strength
    else round(p_strength * power(0.5::numeric,
      greatest(extract(epoch from (p_now - p_last_seen)) / 86400.0, 0)
        / public.word_half_life_days(p_days_correct, p_mastered)))
  end)::smallint
$$;

-- new | learning | familiar | strong | mastered | rusty
create or replace function public.word_stage(p_times_seen int, p_effective int, p_mastered boolean)
returns text language sql immutable set search_path = '' as $$
  select case
    when p_mastered then case when p_effective < 60 then 'rusty' else 'mastered' end
    when coalesce(p_times_seen, 0) = 0 then 'new'
    when p_effective < 40 then 'learning'
    when p_effective < 70 then 'familiar'
    else 'strong' end
$$;

-- Strength after one answer. Right: gain shrinks near 100, harder exercises and coming back
-- after a break (16h+) gain more. Wrong: lose 5 plus 20% of current strength.
create or replace function public.word_strength_after(p_base int, p_correct boolean, p_kind text, p_hours_since numeric)
returns smallint language sql immutable set search_path = '' as $$
  select (case when p_correct then
    least(100, p_base + greatest(1, ceil(
      20 * case p_kind when 'production' then 2.0 when 'recall' then 1.5 else 1.0 end
         * (1 - p_base / 100.0)
         * case when p_hours_since >= 16 then 1.5 else 1.0 end)))
  else greatest(0, p_base - round(5 + 0.2 * p_base)) end)::smallint
$$;

-- The four mastery rules.
create or replace function public.word_mastery_met(p_strength int, p_days_correct int, p_hard_correct int, p_recent int)
returns boolean language sql immutable set search_path = '' as $$
  select p_strength >= 90
     and p_days_correct >= 3
     and p_hard_correct >= 2
     and length(replace((p_recent::bit(8))::text, '0', '')) >= 7
$$;

-- ---------- record_word_results: now scores, checks mastery and returns what changed ----------

drop function public.record_word_results(jsonb);

create function public.record_word_results(p_results jsonb)
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

comment on function public.record_word_results(jsonb) is
  'Records exercise answers [{word_id, correct, kind: recognition|recall|production}], updates strength and mastery, grants mastery rewards, and returns what changed per word.';

-- ---------- get_word_progress: everything the progress screens need ----------

create or replace function public.get_word_progress(p_language_id bigint default null)
returns table(
  word_id bigint, word text, meaning text, rarity public.rarity, word_type public.word_type, gender text,
  strength smallint, stage text,
  times_seen integer, times_correct integer, days_correct smallint, hard_correct smallint,
  recent_results smallint, recent_count smallint,
  mastered_at timestamptz, last_seen_at timestamptz, next_review_at timestamptz, added_at timestamptz)
language sql
stable
security invoker
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
         uw.created_at
    from public.user_words uw
    join public.words w on w.id = uw.word_id
    cross join lateral (select public.word_effective_strength(
        uw.strength, uw.last_seen_at, uw.days_correct, uw.mastered_at is not null) as eff) e
   where uw.user_id = auth.uid()
     and (p_language_id is null or w.language_id = p_language_id)
   order by uw.created_at;
$$;

-- ---------- Privileges ----------
revoke all on function public.record_word_results(jsonb) from public, anon;
grant execute on function public.record_word_results(jsonb) to authenticated;

revoke all on function public.get_word_progress(bigint) from public, anon;
grant execute on function public.get_word_progress(bigint) to authenticated;

revoke all on function public.word_half_life_days(int, boolean) from public, anon;
revoke all on function public.word_effective_strength(int, timestamptz, int, boolean, timestamptz) from public, anon;
revoke all on function public.word_stage(int, int, boolean) from public, anon;
revoke all on function public.word_strength_after(int, boolean, text, numeric) from public, anon;
revoke all on function public.word_mastery_met(int, int, int, int) from public, anon;
grant execute on function public.word_half_life_days(int, boolean) to authenticated;
grant execute on function public.word_effective_strength(int, timestamptz, int, boolean, timestamptz) to authenticated;
grant execute on function public.word_stage(int, int, boolean) to authenticated;
