-- French: drop the "Le, la, un, une" module. The Genders lesson covers articles now.
-- Its module_words and any user_modules rows go with it (on delete cascade). The article words stay in words.
-- complete_module unlocks by the nearest lower position, so the gap it leaves is fine.
delete from public.modules m
 using public.language l
 where l.id = m.language_id and l.name = 'French' and m.title = 'Le, la, un, une';
