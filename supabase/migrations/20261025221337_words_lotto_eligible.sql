-- Whether a word can be drawn from a Lotto pull. Every word, existing and new, is eligible unless set otherwise.
alter table public.words
  add column lotto_eligible boolean not null default true;

comment on column public.words.lotto_eligible is 'Whether this word can be drawn from a Lotto pull.';
