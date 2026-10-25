-- Spending a lotto pull now also counts toward the daily streak (once per day, like a finished exercise).
-- Same body as the live function, plus the record_activity call after a successful spend.
-- Signature, return shape and grants are unchanged.
create or replace function public.spend_lotto_pull()
returns table (current_lotto_pulls integer, max_lotto_pulls integer, next_pull_at timestamptz, server_now timestamptz, word_id uuid)
language plpgsql
security definer
set search_path to ''
as $$
declare
  uid    uuid := auth.uid();
  r      interval := public.lotto_recharge_interval();
  s      public.lotto_state%rowtype;
  c      record;
  picked uuid;
begin
  if uid is null then raise exception 'NOT_AUTHENTICATED'; end if;

  insert into public.lotto_state (user_id) values (uid) on conflict (user_id) do nothing;
  select * into s from public.lotto_state ls where ls.user_id = uid for update;

  select * into c from public.lotto_calc(
    s.current_lotto_pulls, s.recharge_start_time, s.max_lotto_pulls, r, now());

  if c.cur < 1 then
    raise exception 'NO_PULLS' using detail = (c.start_time + r)::text;
  end if;

  -- TODO: pick the word in this same transaction so a pull is never spent
  -- without a word being awarded (and vice versa).
  -- picked := public.pick_lotto_word(uid);
  -- insert into public.word_list (user_id, word_id) values (uid, picked)
  --   on conflict do nothing;

  update public.lotto_state ls
     set current_lotto_pulls = c.cur - 1,
         recharge_start_time = c.start_time,
         updated_at          = now()
   where ls.user_id = uid;

  -- Only reached once the pull is spent; NO_PULLS above counts nothing.
  perform public.record_activity(uid);

  return query select
    c.cur - 1,
    s.max_lotto_pulls,
    c.start_time + r,      -- after spending we're below max, so a timer is always running
    now(),
    picked;
end;
$$;
