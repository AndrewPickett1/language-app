alter table public.user_words
  add column strength smallint not null default 0,
  add column recent_results smallint not null default 0,
  add column days_correct smallint not null default 0,
  add column last_correct_on date,
  add column hard_correct smallint not null default 0,
  add column mastered_at timestamptz;

alter table public.user_words
  add constraint user_words_strength_check check (strength between 0 and 100),
  add constraint user_words_recent_results_check check (recent_results between 0 and 255),
  add constraint user_words_days_correct_check check (days_correct >= 0),
  add constraint user_words_hard_correct_check check (hard_correct >= 0),
  add constraint user_words_user_word_key unique (user_id, word_id);

comment on column public.user_words.strength is 'Strength 0-100 as of last_seen_at. Fades over time: read it through word_effective_strength(). Server-only: written by record_word_results().';
comment on column public.user_words.recent_results is 'Last 8 answers as bits, bit 0 = newest, 1 = right. Answers in the window = least(times_seen, 8).';
comment on column public.user_words.days_correct is 'Number of different local days with at least one right answer.';
comment on column public.user_words.last_correct_on is 'Local date of the latest right answer; keeps days_correct to one per day.';
comment on column public.user_words.hard_correct is 'Right answers on production exercises (typing, building a sentence).';
comment on column public.user_words.mastered_at is 'When the word first passed every mastery rule. Never cleared: a faded mastered word shows as rusty.';

-- Backfill from existing stats. Capped at 60 so nobody starts out near mastery.
update public.user_words set
  strength        = least(60, round(100.0 * times_correct / times_seen * least(times_seen, 8) / 8.0))::smallint,
  recent_results  = ((1 << least(correct_streak, 8)) - 1)::smallint,
  days_correct    = case when times_correct > 0 then 1 else 0 end,
  last_correct_on = case when times_correct > 0 then last_seen_at::date end
where times_seen > 0;
