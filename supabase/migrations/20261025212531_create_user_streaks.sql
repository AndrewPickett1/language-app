create table public.user_streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak smallint not null default 0 check (current_streak >= 0),
  best_streak smallint not null default 0 check (best_streak >= 0),
  updated_at timestamptz not null default now()
);

alter table public.user_streaks enable row level security;

create policy "user_streaks: read own" on public.user_streaks
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Copy the existing streaks from profiles, and give every other user a zero row.
insert into public.user_streaks (user_id, current_streak, best_streak)
select u.id,
       coalesce(p.current_streak, 0),
       greatest(coalesce(p.best_streak, 0), coalesce(p.current_streak, 0))
from auth.users u
left join public.profiles p on p.id = u.id
on conflict (user_id) do nothing;

create or replace function public.handle_new_user_streak()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  insert into public.user_streaks (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user_streak() from public, anon, authenticated;

create trigger on_auth_user_created_streak
  after insert on auth.users
  for each row execute function public.handle_new_user_streak();
