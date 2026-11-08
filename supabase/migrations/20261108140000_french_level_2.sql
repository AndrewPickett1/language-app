-- French Level 2: two slide lessons, Pronouns 1 and then Verbs 1.
-- Modules unlock by position across the whole language, so these go after every Level 1 module.
-- Safe to run again: each module is only added if its lesson_key isn't there yet.
insert into public.levels (language_id, number, title)
select l.id, 2, 'Level 2'
  from public.language l
 where l.name = 'French'
on conflict (language_id, number) do nothing;

insert into public.modules (language_id, level_id, unit, position, title, description, module_type, lesson_key)
select l.id, lv.id, 2, base.p + v.offset_, v.title, v.description, 'Lesson', v.lesson_key
  from public.language l
  join public.levels lv on lv.language_id = l.id and lv.number = 2
 cross join lateral (select coalesce(max(m.position), -1) + 1 as p from public.modules m where m.language_id = l.id) base
 cross join (values
   (0, 'Pronouns 1', 'What a pronoun is, and how to say I, you, he, she and we in French.', 'pronouns-1'),
   (1, 'Verbs 1', 'What verbs, conjugation and the infinitive are, with penser.', 'verbs-1')
 ) as v(offset_, title, description, lesson_key)
 where l.name = 'French'
   and not exists (select 1 from public.modules x where x.language_id = l.id and x.lesson_key = v.lesson_key);
