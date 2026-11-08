-- Modules come in two types. Exercise modules teach words (meet them, then quiz them). Lesson modules
-- teach a concept through a short run of slides the app draws, picked by lesson_key.
-- module_type was added to the live project from the dashboard, so it's only created here if missing.
do $$ begin
  create type public.module_type as enum ('Lesson', 'Exercise');
exception when duplicate_object then null;
end $$;

alter table public.modules add column if not exists module_type public.module_type default 'Exercise';

alter table public.modules add column if not exists lesson_key text
  check (lesson_key is null or module_type = 'Lesson');

comment on column public.modules.module_type is 'Exercise: teaches its module_words. Lesson: teaches a concept through slides.';
comment on column public.modules.lesson_key is 'Which of the app''s slide lessons a Lesson module shows, e.g. ''genders''.';

-- French: a Genders lesson right after Bonjour ! (position 0), before Top 10 nouns.
-- Positions are unique per language and checked row by row, so the later modules move out of the way
-- first and then come back one place further on. Safe to run again: nothing moves once the lesson exists.
update public.modules m
   set position = m.position + 1000
  from public.language l
 where l.id = m.language_id and l.name = 'French' and m.position >= 1
   and not exists (select 1 from public.modules x where x.language_id = l.id and x.lesson_key = 'genders');

update public.modules m
   set position = m.position - 999
  from public.language l
 where l.id = m.language_id and l.name = 'French' and m.position >= 1000;

insert into public.modules (language_id, unit, position, title, description, module_type, lesson_key)
select l.id, 1, 1, 'Genders', 'What nouns and articles are, and why every French noun is masculine or feminine.', 'Lesson', 'genders'
  from public.language l
 where l.name = 'French'
   and not exists (select 1 from public.modules x where x.language_id = l.id and x.lesson_key = 'genders');
