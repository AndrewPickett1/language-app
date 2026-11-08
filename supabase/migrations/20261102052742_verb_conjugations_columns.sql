alter table public.verb_conjugations
  add column word_id bigint not null references public.words(id) on delete cascade,
  add column person  text   not null check (person in ('1sg','2sg','3sg','1pl','2pl','3pl')),
  add column tense   text   not null default 'present',
  add column form    text   not null,
  add constraint verb_conjugations_word_person_tense_key unique (word_id, person, tense);

comment on table public.verb_conjugations is 'Conjugated forms of verbs in words, one row per verb + person + tense.';
comment on column public.verb_conjugations.person is 'Language-agnostic grammatical person: 1sg, 2sg, 3sg, 1pl, 2pl, 3pl. Pronoun labels are mapped per language.';
comment on column public.verb_conjugations.form is 'The conjugated verb alone, without the pronoun.';

create policy "verb_conjugations: read all" on public.verb_conjugations
  for select to anon, authenticated using (true);
