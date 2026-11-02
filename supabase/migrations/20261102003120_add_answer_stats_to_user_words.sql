alter table public.user_words
  add column times_seen     integer not null default 0 check (times_seen >= 0),
  add column times_correct  integer not null default 0 check (times_correct >= 0),
  add column correct_streak integer not null default 0 check (correct_streak >= 0),
  add column last_seen_at   timestamptz,
  add constraint user_words_correct_le_seen check (times_correct <= times_seen),
  add constraint user_words_streak_le_correct check (correct_streak <= times_correct);

comment on column public.user_words.times_seen is 'Times this word has been tested in an exercise.';
comment on column public.user_words.times_correct is 'Times the learner answered this word correctly.';
comment on column public.user_words.correct_streak is 'Consecutive correct answers; resets to 0 on a miss.';
comment on column public.user_words.last_seen_at is 'When this word was last tested in an exercise. Null if never.';
