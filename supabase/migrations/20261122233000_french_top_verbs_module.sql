-- A module whose words are all verbs drills their conjugations. drill_conjugations lets one teach its verbs
-- as ordinary words instead (meet the word, pick the meaning, match pairs).
alter table public.modules add column if not exists drill_conjugations boolean not null default true;

-- French Level 2: "Top 5 verbs" right after Negation 1, teaching savoir, vouloir, parler, manger and boire
-- as words, without the conjugation drill.
-- Safe to run again: the module is only added if Level 2 doesn't have one called "Top 5 verbs" yet.
insert into public.modules (language_id, level_id, unit, position, title, description, module_type, drill_conjugations)
select l.id, lv.id, 2, base.p, 'Top 5 verbs', 'Five verbs you''ll use every day: to know, to want, to speak, to eat and to drink.', 'Exercise', false
  from public.language l
  join public.levels lv on lv.language_id = l.id and lv.number = 2
 cross join lateral (select coalesce(max(m.position), -1) + 1 as p from public.modules m where m.language_id = l.id) base
 where l.name = 'French'
   and not exists (select 1 from public.modules x where x.level_id = lv.id and x.title = 'Top 5 verbs');

insert into public.module_words (module_id, word_id, position)
select m.id, w.id, v.position
  from public.language l
  join public.levels lv on lv.language_id = l.id and lv.number = 2
  join public.modules m on m.level_id = lv.id and m.title = 'Top 5 verbs'
 cross join (values (0, 'Savoir'), (1, 'Vouloir'), (2, 'Parler'), (3, 'Manger'), (4, 'Boire')) as v(position, word)
  join lateral (select min(id) as id from public.words where language_id = l.id and word = v.word) w on w.id is not null
 where l.name = 'French'
on conflict (module_id, word_id) do nothing;
