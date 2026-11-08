-- One word a day from the Add a word screen.
--
-- profiles.last_word_added_on is the learner's local date (user_local_date) of their last add.
-- They can add again once it's earlier than today. Nothing resets it at midnight.
-- Only add_word() writes it; the client reads it through get_word_add_status().

alter table public.profiles
  add column last_word_added_on date;

comment on column public.profiles.last_word_added_on is 'Local date of the learner''s last word from Add a word. Server-only: written by add_word().';

-- The API roles had insert and update on every column, and a column revoke can't undo a table grant.
-- Give back only the columns the client writes, so last_word_added_on stays server-only.
revoke insert, update on public.profiles from anon, authenticated;
grant insert (id, created_at, currently_selected_language) on public.profiles to authenticated;
grant update (currently_selected_language) on public.profiles to authenticated;

-- Adds p_word_id to the learner's words if today's add is still free.
-- status: 'added', 'used' (today's add is taken), 'owned' (already theirs, nothing spent), 'unknown_word'.
create or replace function public.add_word(p_word_id bigint)
returns table (status text, today date)
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid     uuid := auth.uid();
  d       date;
  claimed uuid;
begin
  if uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  d := public.user_local_date(uid);

  if not exists (select 1 from public.words w where w.id = p_word_id) then
    return query select 'unknown_word'::text, d;
    return;
  end if;

  if exists (select 1 from public.user_words uw where uw.user_id = uid and uw.word_id = p_word_id) then
    return query select 'owned'::text, d;
    return;
  end if;

  -- Claims today. The row lock means two calls at once can't both get it, and `<` means a
  -- timezone change that moves today back can't win a second add.
  insert into public.profiles as p (id, last_word_added_on) values (uid, d)
  on conflict (id) do update set last_word_added_on = excluded.last_word_added_on
    where p.last_word_added_on is null or p.last_word_added_on < excluded.last_word_added_on
  returning p.id into claimed;

  if claimed is null then
    return query select 'used'::text, d;
    return;
  end if;

  insert into public.user_words (user_id, word_id) values (uid, p_word_id);
  perform public.record_activity(uid);

  return query select 'added'::text, d;
end;
$$;

-- Whether the learner can add a word today.
create or replace function public.get_word_add_status()
returns table (available boolean, today date)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  uid  uuid := auth.uid();
  d    date;
  last date;
begin
  if uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  d := public.user_local_date(uid);
  select p.last_word_added_on into last from public.profiles p where p.id = uid;
  return query select last is null or last < d, d;
end;
$$;

revoke all on function public.add_word(bigint) from public, anon;
revoke all on function public.get_word_add_status() from public, anon;
grant execute on function public.add_word(bigint) to authenticated;
grant execute on function public.get_word_add_status() to authenticated;
