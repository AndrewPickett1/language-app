-- French: drop the "C'est…" module, the last one in Level 1.
-- Its module_words and any user_modules rows go with it (on delete cascade). Its words stay in words, and
-- learners keep any they already own. complete_module unlocks by the nearest lower position, so the gap is fine.
delete from public.modules m
 using public.language l
 where l.id = m.language_id and l.name = 'French' and m.title = 'C''est…';

-- Learners who'd finished every other Level 1 module have now finished the level, so they get its
-- user_levels row, dated by the last of those modules, as when user_levels was created.
insert into public.user_levels (user_id, level_id, completed_at)
select um.user_id, m.level_id, max(um.first_completed_at)
  from public.user_modules um
  join public.modules m on m.id = um.module_id
 group by um.user_id, m.level_id
having count(*) = (select count(*) from public.modules x where x.level_id = m.level_id)
on conflict (user_id, level_id) do nothing;
