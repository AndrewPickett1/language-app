import type { Language } from '@/data/languages';
import { shuffle } from '@/data/lesson';
import { supabase } from '@/utils/supabase';
import { WordColumns, toWord, type LoadedWord, type WordRow } from '@/utils/word-rows';

/** A noun with a known gender, which `toWord` leaves undefined for neuter or missing ones. */
export type GenderNoun = LoadedWord & { gender: 'M' | 'F' };

type Row = { words: WordRow | null };

/**
 * The learner's own masculine and feminine nouns in `language`, shuffled. Filters on the raw
 * `word_type`, since the app's `WordType` also maps phrases and articles (which have a gender) to Noun.
 */
export async function fetchGenderNouns(userId: string, language: Language): Promise<GenderNoun[]> {
  const { data, error } = await supabase
    .from('user_words')
    .select(`words!inner(${WordColumns})`)
    .eq('user_id', userId)
    .eq('words.word_type', 'Noun')
    .not('words.gender', 'is', null)
    .overrideTypes<Row[], { merge: false }>();
  if (error) throw new Error(error.message);
  // A word can be won more than once; keep one.
  const seen = new Set<number>();
  const nouns: GenderNoun[] = [];
  for (const { words: row } of data) {
    if (!row || seen.has(row.id)) continue;
    seen.add(row.id);
    const word = toWord(row);
    // Words without a language show up whichever language is picked, as in My words.
    if (word.gender && (word.language === null || word.language === language.name)) nouns.push({ ...word, gender: word.gender });
  }
  return shuffle(nouns);
}

/** Stored nouns are capitalised; German keeps the capital, the others read lower-case. */
export function bareNoun(noun: GenderNoun, language: Language) {
  return language.code === 'DE' ? noun.word : noun.word.charAt(0).toLowerCase() + noun.word.slice(1);
}

const Vowel = /^[aeiouàâäéèêëîïôöùûüáíóú]/i;
const FrenchSilentH = /^h(?!a(che|ie|ll|mac|mburger|ndicap|ricot|sard|ut)|éros|ibou|ockey|omard|onte|uit)/i;
const ItalianLo = /^(s[^aeiou]|z|gn|ps|x|y)/i;

/** The noun with the article it really takes: "la mano", "l'ami", "lo zaino". */
export function withArticle(noun: GenderNoun, language: Language) {
  const bare = bareNoun(noun, language);
  let article = language.articles[noun.gender];
  if (language.code === 'FR' && (Vowel.test(bare) || FrenchSilentH.test(bare))) article = "l'";
  if (language.code === 'IT') {
    if (Vowel.test(bare)) article = "l'";
    else if (noun.gender === 'M' && ItalianLo.test(bare)) article = 'lo';
  }
  return article.endsWith("'") ? `${article}${bare}` : `${article} ${bare}`;
}

/** A one-line heads-up for nouns that break the usual ending rule, like día or mano. */
export function genderTip(noun: GenderNoun, language: Language): string | null {
  const bare = bareNoun(noun, language);
  const name = noun.word;
  if (language.code === 'ES' || language.code === 'IT' || language.code === 'PT') {
    if (noun.gender === 'M' && /a$/i.test(bare)) return `${name} ends in -a but is masculine. One to remember.`;
    if (noun.gender === 'F' && /o$/i.test(bare)) return `${name} ends in -o but is feminine.`;
  }
  if (language.code === 'FR' && noun.gender === 'F' && /age$/i.test(bare)) return `Most -age words are masculine, but ${bare} is feminine.`;
  return null;
}
