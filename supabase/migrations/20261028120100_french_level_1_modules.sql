-- French Level 1: five modules and the words they teach.
-- The top nouns and adjectives (and être) are already in the French deck, so those rows are reused.
-- New words are added only if French doesn't have them yet, so this is safe to run again.
-- zipf_freq is the word's Zipf frequency (log10 of uses per billion words), rounded to a whole number.

-- New words: greetings, yes/no, articles and "it is" phrases.
insert into public.words
  (language_id, word, meaning, word_type, gender, rarity, zipf_freq, example_sentence, example_sentence_translation, lotto_eligible)
select l.id, v.word, v.meaning, v.word_type::public.word_type, v.gender, 'Common'::public.rarity, v.zipf_freq, v.example, v.example_meaning, v.lotto_eligible
from public.language l
cross join (values
  ('Bonjour', 'Hello; good morning', 'Phrase', null, 5, 'Bonjour, je m''appelle Léa.', 'Hello, my name is Léa.', true),
  ('Salut', 'Hi; bye', 'Phrase', null, 5, 'Salut, ça va ?', 'Hi, how are you?', true),
  ('Bonsoir', 'Good evening', 'Phrase', null, 4, 'Bonsoir, madame.', 'Good evening, madam.', true),
  ('Au revoir', 'Goodbye', 'Phrase', null, 4, 'Au revoir et à demain !', 'Goodbye, see you tomorrow!', true),
  ('Oui', 'Yes', 'Adverb', null, 6, 'Oui, j''ai faim.', 'Yes, I''m hungry.', true),
  ('Non', 'No', 'Adverb', null, 6, 'Non, merci.', 'No, thank you.', true),
  ('Merci', 'Thank you; thanks', 'Phrase', null, 5, 'Merci beaucoup !', 'Thank you very much!', true),
  ('S''il vous plaît', 'Please', 'Phrase', null, 5, 'Un café, s''il vous plaît.', 'A coffee, please.', true),
  ('Le', 'The (masculine)', 'Article', 'M', 7, 'Le chat dort.', 'The cat is sleeping.', false),
  ('La', 'The (feminine)', 'Article', 'F', 7, 'La maison est grande.', 'The house is big.', false),
  ('Un', 'A; an (masculine)', 'Article', 'M', 7, 'J''ai un chien.', 'I have a dog.', false),
  ('Une', 'A; an (feminine)', 'Article', 'F', 7, 'C''est une pomme.', 'It''s an apple.', false),
  ('C''est', 'It is; that is', 'Phrase', null, 6, 'C''est bon !', 'It''s good!', true),
  ('Ce n''est pas', 'It isn''t; that isn''t', 'Phrase', null, 5, 'Ce n''est pas grave.', 'It doesn''t matter.', true),
  ('Il est', 'He is; it is (masculine)', 'Phrase', null, 6, 'Il est petit.', 'He is small.', true),
  ('Elle est', 'She is; it is (feminine)', 'Phrase', null, 5, 'Elle est jolie.', 'She is pretty.', true),
  ('Qu''est-ce que c''est ?', 'What is it?', 'Phrase', null, 4, 'Qu''est-ce que c''est ? C''est un livre.', 'What is it? It''s a book.', true)
) as v(word, meaning, word_type, gender, zipf_freq, example, example_meaning, lotto_eligible)
where l.name = 'French'
  and not exists (select 1 from public.words w where w.language_id = l.id and w.word = v.word);

-- The reused words had no frequency yet.
update public.words w
set zipf_freq = v.zipf_freq
from public.language l, (values
  ('Homme', 6), ('Femme', 6), ('Enfant', 5), ('Jour', 6), ('Temps', 6),
  ('Maison', 6), ('Ami', 5), ('Chose', 6), ('Vie', 6), ('Main', 5),
  ('Grand', 6), ('Petit', 6), ('Bon', 6), ('Mauvais', 5), ('Beau', 5),
  ('Nouveau', 6), ('Vieux', 5), ('Jeune', 5), ('Vrai', 6), ('Autre', 6),
  ('Être', 7)
) as v(word, zipf_freq)
where l.name = 'French' and w.language_id = l.id and w.word = v.word and w.zipf_freq is null;

-- The modules, in order.
insert into public.modules (language_id, unit, position, title, description)
select l.id, 1, v.position, v.title, v.description
from public.language l
cross join (values
  (0, 'Bonjour !', 'Say hello and goodbye, and answer yes or no.'),
  (1, 'Top 10 nouns', 'The ten nouns you''ll hear most: people, time, home and life.'),
  (2, 'Le, la, un, une', 'Every noun is masculine or feminine. The little word in front tells you which.'),
  (3, 'Top 10 adjectives', 'Big, small, good, bad: ten words to describe almost anything.'),
  (4, 'C''est…', 'It is, it isn''t, and what is it? Put your first sentences together.')
) as v(position, title, description)
where l.name = 'French'
on conflict (language_id, position) do nothing;

-- Pair each module with its words, in teaching order.
insert into public.module_words (module_id, word_id, position)
select m.id, w.id, v.word_position
from public.language l
join public.modules m on m.language_id = l.id
cross join lateral (values
  (0, 'Bonjour', 0), (0, 'Salut', 1), (0, 'Bonsoir', 2), (0, 'Au revoir', 3),
  (0, 'Oui', 4), (0, 'Non', 5), (0, 'Merci', 6), (0, 'S''il vous plaît', 7),
  (1, 'Homme', 0), (1, 'Femme', 1), (1, 'Enfant', 2), (1, 'Jour', 3), (1, 'Temps', 4),
  (1, 'Maison', 5), (1, 'Ami', 6), (1, 'Chose', 7), (1, 'Vie', 8), (1, 'Main', 9),
  (2, 'Le', 0), (2, 'La', 1), (2, 'Un', 2), (2, 'Une', 3),
  (3, 'Grand', 0), (3, 'Petit', 1), (3, 'Bon', 2), (3, 'Mauvais', 3), (3, 'Beau', 4),
  (3, 'Nouveau', 5), (3, 'Vieux', 6), (3, 'Jeune', 7), (3, 'Vrai', 8), (3, 'Autre', 9),
  (4, 'C''est', 0), (4, 'Ce n''est pas', 1), (4, 'Il est', 2), (4, 'Elle est', 3),
  (4, 'Qu''est-ce que c''est ?', 4), (4, 'Être', 5)
) as v(module_position, word, word_position)
join lateral (
  -- French has a few duplicate rows (Papillon, Nuage), so take the lowest id to be safe.
  select min(id) as id from public.words where language_id = l.id and word = v.word
) w on w.id is not null
where l.name = 'French' and m.unit = 1 and m.position = v.module_position
on conflict (module_id, word_id) do nothing;
