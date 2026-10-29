import type { Rarity } from '@/data/rarity';
import type { Word, WordType } from '@/data/words';
import { supabase } from '@/utils/supabase';

/** The `words` columns the app reads, with the `language` row embedded through `language_id`. */
export const WordColumns =
  'id, word, meaning, rarity, word_type, gender, example_sentence, example_sentence_translation, language:language_id(name)';

export type WordRow = {
  id: number;
  word: string;
  meaning: string;
  rarity: string;
  word_type: string;
  gender: string | null;
  example_sentence: string | null;
  example_sentence_translation: string | null;
  language: { name: string } | null;
};

export type LoadedWord = Word & { language: string | null };

/** Every word in the `words` table for the given language, matched by name like the language picker does. */
export async function fetchDeck(languageName: string): Promise<Word[]> {
  return (await fetchDeckRows(languageName)).map(toWord);
}

/** The deck as raw rows, for callers that need the database's own `word_type`. */
export async function fetchDeckRows(languageName: string): Promise<WordRow[]> {
  const { data, error } = await supabase
    .from('words')
    .select(WordColumns.replace('language:language_id(name)', 'language:language_id!inner(name)'))
    .ilike('language.name', languageName)
    .overrideTypes<WordRow[], { merge: false }>();
  if (error) throw new Error(error.message);
  return data;
}

export function toWord(row: WordRow): LoadedWord {
  return {
    id: String(row.id),
    word: row.word,
    meaning: row.meaning,
    type: toWordType(row.word_type),
    gender: toGender(row.gender),
    rarity: toRarity(row.rarity),
    example: row.example_sentence ?? '',
    exampleMeaning: row.example_sentence_translation ?? '',
    language: row.language?.name ?? null,
  };
}

const Rarities: Record<string, Rarity> = {
  common: 'common',
  uncommon: 'uncommon',
  rare: 'rare',
  superrare: 'superRare',
  ultrarare: 'ultraRare',
};

/** "Super Rare", "super_rare" and "SuperRare" all become `superRare`. */
function toRarity(value: string): Rarity {
  return Rarities[value.toLowerCase().replace(/[\s_-]/g, '')] ?? 'common';
}

function toWordType(value: string): WordType {
  const v = value.toLowerCase();
  if (v.startsWith('verb')) return 'Verb';
  if (v.startsWith('adj')) return 'Adjective';
  return 'Noun';
}

/** "M", "masculine", "F", "feminine" → 'M' | 'F'. */
function toGender(value: string | null): Word['gender'] {
  const v = value?.trim().charAt(0).toUpperCase();
  return v === 'M' || v === 'F' ? v : undefined;
}
