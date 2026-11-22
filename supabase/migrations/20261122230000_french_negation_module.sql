-- French Level 2: a "Negation 1" slide lesson right after To be, teaching ne … pas and n' before a vowel.
-- Modules unlock by position across the whole language, so it goes after every module there is.
-- Safe to run again: the module is only added if its lesson_key isn't there yet.
insert into public.modules (language_id, level_id, unit, position, title, description, module_type, lesson_key)
select l.id, lv.id, 2, base.p, 'Negation 1', 'How to say you don''t do something: ne before the verb, pas after it, and n'' before a vowel.', 'Lesson', 'negation-1'
  from public.language l
  join public.levels lv on lv.language_id = l.id and lv.number = 2
 cross join lateral (select coalesce(max(m.position), -1) + 1 as p from public.modules m where m.language_id = l.id) base
 where l.name = 'French'
   and not exists (select 1 from public.modules x where x.language_id = l.id and x.lesson_key = 'negation-1');
