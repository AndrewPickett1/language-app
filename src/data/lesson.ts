import type { Word } from '@/data/words';

/** A word with its raw `word_type` from the database (Noun, Phrase, Article…), which `Word.type` flattens. */
export type LessonWord = Word & { kind: string };

type StepBase = { key: string; /** A second go at a question answered wrong earlier in the lesson. */ retry?: boolean };

/** One screen of a lesson, in the order of the exercise designs: meet, pick the meaning, pick the word, listen, gender, match. */
export type Step = StepBase &
  (
    | { kind: 'meet'; word: LessonWord }
    | { kind: 'meaning' | 'pick' | 'listen'; word: LessonWord; options: LessonWord[] }
    | { kind: 'gender'; noun: LessonWord; indefinite: boolean }
    | { kind: 'match'; words: LessonWord[] }
  );

/** Steps that can be answered wrong and come back at the end. */
export const RetryKinds: Step['kind'][] = ['meaning', 'pick', 'listen', 'gender'];

/** Words are met three at a time, each group followed by a meaning quiz on it. */
const GroupSize = 3;
const PickCount = 4;
const ListenCount = 3;
const MatchPairs = 5;

export function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** "Maison" → "maison". Words are stored capitalised, but read lower-case inside a lesson. */
export function lowerFirst(text: string) {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/**
 * The first sense of a meaning, short enough for an answer tile: "Hello; good morning" → "Hello".
 * Articles keep their gender note, so un and une don't both read "A".
 */
export function gloss(word: Word & { kind?: string }) {
  const first = word.meaning.split(';')[0].trim();
  const note = word.kind === 'Article' && !first.includes('(') ? word.meaning.match(/\([^)]*\)\s*$/)?.[0] : undefined;
  return note ? `${first} ${note.trim()}` : first;
}

export function isGendered(word: LessonWord) {
  return word.kind === 'Noun' && !!word.gender;
}

const ElidesBefore = /^[aeiouyhàâäéèêëîïôöùûü]/i;
/** Common nouns with an aspirated h, which keep le/la: le haricot, la hauteur. */
const AspiratedH = /^(hache|haie|hall|hamac|hamburger|handicap|haricot|hasard|haut|hauteur|héros|hibou|hockey|homard|honte|huit)\b/i;

/** French drops le/la to l' before a vowel or a silent h. */
export function elides(word: Word) {
  return ElidesBefore.test(word.word) && !AspiratedH.test(word.word);
}

/** The article for a gendered noun: le/la (l' before a vowel), or un/une. */
export function articleFor(word: Word, indefinite = false) {
  if (indefinite) return word.gender === 'F' ? 'une' : 'un';
  if (elides(word)) return "l'";
  return word.gender === 'F' ? 'la' : 'le';
}

/** How a word reads in a lesson: nouns with their article ("la maison", "l'ami"), everything else lower-case. */
export function display(word: LessonWord, indefinite = false) {
  const bare = lowerFirst(word.word);
  if (!isGendered(word)) return bare;
  const article = articleFor(word, indefinite);
  return article.endsWith("'") ? `${article}${bare}` : `${article} ${bare}`;
}

/**
 * Three wrong answers for `word`, shown as `text`. The lesson's own words come first (they're what
 * the learner is learning), then the rest of the deck, preferring the same kind of word.
 */
function distractors(word: LessonWord, lesson: LessonWord[], deck: LessonWord[], text: (w: LessonWord) => string) {
  const others = (list: LessonWord[]) => list.filter((w) => w.id !== word.id);
  const sameKind = (list: LessonWord[]) => shuffle(others(list).filter((w) => w.kind === word.kind));
  const pool = [...sameKind(lesson), ...sameKind(deck), ...shuffle(others(lesson)), ...shuffle(others(deck))];
  const seen = new Set([text(word).toLowerCase()]);
  const out: LessonWord[] = [];
  for (const w of pool) {
    const t = text(w).toLowerCase();
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(w);
    if (out.length === 3) break;
  }
  return out;
}

/**
 * The lesson for a module: meet its words three at a time with a meaning quiz after each group,
 * then pick-the-word, listening, gender (when there are nouns, or the module teaches articles) and a
 * match-pairs finale. `deck` is the language's whole word list, for wrong answers and gender practice.
 */
export function buildLesson(words: LessonWord[], deck: LessonWord[]): Step[] {
  const steps: Step[] = [];
  let n = 0;
  const key = (kind: string) => `${kind}-${n++}`;
  const quiz = (kind: 'meaning' | 'pick' | 'listen', word: LessonWord): Step => ({
    key: key(kind),
    kind,
    word,
    options: shuffle([word, ...distractors(word, words, deck, kind === 'meaning' ? gloss : (w) => display(w))]),
  });

  for (let i = 0; i < words.length; i += GroupSize) {
    const group = words.slice(i, i + GroupSize);
    for (const word of group) steps.push({ key: key('meet'), kind: 'meet', word });
    for (const word of shuffle(group)) steps.push(quiz('meaning', word));
  }

  for (const word of shuffle(words).slice(0, PickCount)) steps.push(quiz('pick', word));
  for (const word of shuffle(words).slice(0, ListenCount)) steps.push(quiz('listen', word));

  // An articles module practises on nouns from the deck, switching between le/la and un/une.
  const teachesArticles = words.some((w) => w.kind === 'Article');
  const nouns = teachesArticles ? shuffle(deck.filter(isGendered)).slice(0, 6) : shuffle(words.filter(isGendered)).slice(0, 4);
  nouns.forEach((noun, i) => {
    // le/la can't be told apart before a vowel (l'ami), so those always use un/une.
    steps.push({ key: key('gender'), kind: 'gender', noun, indefinite: elides(noun) || (teachesArticles && i % 2 === 1) });
  });

  // One meaning per pair, so no two English tiles read the same.
  const pairs: LessonWord[] = [];
  for (const word of shuffle(words)) {
    if (pairs.length < MatchPairs && !pairs.some((w) => gloss(w).toLowerCase() === gloss(word).toLowerCase())) pairs.push(word);
  }
  if (pairs.length >= 3) steps.push({ key: key('match'), kind: 'match', words: pairs });

  return steps;
}
