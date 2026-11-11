-- French Level 2: a "To be" module right after Verbs 1, teaching être.
-- It's an Exercise module whose only word is a verb, so the app opens it on être's word card and drills
-- its conjugations instead of running the usual word lesson.
-- Safe to run again: the module is only added if Level 2 doesn't have one called "To be" yet.
insert into public.modules (language_id, level_id, unit, position, title, description, module_type)
select l.id, lv.id, 2, base.p, 'To be', 'Être, one of the most-used verbs in French: je suis, tu es, il est and the rest.', 'Exercise'
  from public.language l
  join public.levels lv on lv.language_id = l.id and lv.number = 2
 cross join lateral (select coalesce(max(m.position), -1) + 1 as p from public.modules m where m.language_id = l.id) base
 where l.name = 'French'
   and not exists (select 1 from public.modules x where x.level_id = lv.id and x.title = 'To be');

insert into public.module_words (module_id, word_id, position)
select m.id, w.id, 0
  from public.language l
  join public.levels lv on lv.language_id = l.id and lv.number = 2
  join public.modules m on m.level_id = lv.id and m.title = 'To be'
  join lateral (select min(id) as id from public.words where language_id = l.id and word = 'Être') w on w.id is not null
 where l.name = 'French'
on conflict (module_id, word_id) do nothing;
