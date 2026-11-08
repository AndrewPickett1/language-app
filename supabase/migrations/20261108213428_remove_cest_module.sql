delete from public.modules m
 using public.language l
 where l.id = m.language_id and l.name = 'French' and m.title = 'C''est…';

insert into public.user_levels (user_id, level_id, completed_at)
select um.user_id, m.level_id, max(um.first_completed_at)
  from public.user_modules um
  join public.modules m on m.id = um.module_id
 group by um.user_id, m.level_id
having count(*) = (select count(*) from public.modules x where x.level_id = m.level_id)
on conflict (user_id, level_id) do nothing;
