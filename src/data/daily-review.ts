import type { Language } from '@/data/languages';
import { display, distractors, elides, gloss, isGendered, MatchPairs, shuffle, type LessonWord, type Step } from '@/data/lesson';
import { selectStudyWords } from '@/data/study-words';
import type { WordProgress } from '@/utils/word-progress';

/** The exercises a Daily Review can use. Each is a lesson step type, drawn by the same components. */
export type ReviewExercise = 'meaning' | 'listen' | 'gender' | 'pick' | 'match';

type Block = {
  exercise: ReviewExercise;
  /** Questions of this exercise, or pairs for `match`. */
  count: number;
};

/**
 * Which exercises a Daily Review uses, and in what order. Change a review by editing this list: blocks run
 * top to bottom, and each asks `count` questions. `match` is a finale on the review's own words.
 */
export const ReviewPlan: Block[] = [
  { exercise: 'meaning', count: 3 },
  { exercise: 'listen', count: 2 },
  { exercise: 'gender', count: 2 },
  { exercise: 'pick', count: 3 },
  { exercise: 'match', count: MatchPairs },
];

const AnyWord = () => true;

/** Which words an exercise can ask. Gender needs a masculine or feminine noun. */
const Fits: Record<ReviewExercise, (word: LessonWord) => boolean> = {
  meaning: AnyWord,
  listen: AnyWord,
  gender: isGendered,
  pick: AnyWord,
  match: AnyWord,
};

/** With few words, a word can be asked up to this many times in one review. */
const MaxUses = 2;
/** A match finale needs at least this many pairs. */
const MinPairs = 3;

/**
 * Plans one round of the Daily Review on the learner's own words (`pool`). `selectStudyWords` picks which
 * words come up (rusty, recently missed and weaker words first), and `ReviewPlan` decides the exercises and
 * their order. Exercises with rules (Gender) get their words first; the others share the rest, and any word
 * left over is asked in the first exercise every word fits. A plan block with no words to ask is skipped.
 * `deck` is the language's whole word list, for wrong answers.
 */
export function buildDailyReview(pool: LessonWord[], deck: LessonWord[], progress: Record<string, WordProgress>, language: Language): Step[] {
  const words = selectStudyWords('review', pool, progress);
  const uses = new Map<string, number>();
  const take = (exercise: ReviewExercise, count: number) => {
    const out: LessonWord[] = [];
    // Every fitting word once before any word twice, and never twice in one exercise.
    for (let pass = 0; pass < MaxUses && out.length < count; pass++) {
      for (const word of words) {
        if (out.length >= count) break;
        if (!Fits[exercise](word) || (uses.get(word.id) ?? 0) !== pass || out.includes(word)) continue;
        out.push(word);
        uses.set(word.id, pass + 1);
      }
    }
    return out;
  };

  const questions = ReviewPlan.filter((b) => b.exercise !== 'match');
  const picked = new Map<Block, LessonWord[]>();
  const open = (b: Block) => Fits[b.exercise] === AnyWord;
  for (const block of [...questions.filter((b) => !open(b)), ...questions.filter(open)]) {
    picked.set(block, take(block.exercise, block.count));
  }
  const spill = questions.find(open);
  const unused = words.filter((w) => !uses.has(w.id));
  if (spill) picked.set(spill, [...(picked.get(spill) ?? []), ...unused]);

  const steps: Step[] = [];
  let n = 0;
  const key = (kind: string) => `${kind}-${n++}`;
  for (const block of ReviewPlan) {
    if (block.exercise === 'match') {
      const pairs = matchPairs(words, block.count);
      if (pairs.length >= MinPairs) steps.push({ key: key('match'), kind: 'match', words: pairs });
      continue;
    }
    for (const word of shuffle(picked.get(block) ?? [])) {
      if (block.exercise === 'gender') {
        // le/la can't be told apart before a vowel (l'ami), so those use un/une.
        steps.push({ key: key('gender'), kind: 'gender', noun: word, indefinite: language.code === 'FR' && elides(word) });
      } else {
        const text = block.exercise === 'meaning' ? gloss : (w: LessonWord) => display(w, language);
        const options = shuffle([word, ...distractors(word, words, deck, text)]);
        steps.push({ key: key(block.exercise), kind: block.exercise, word, options });
      }
    }
  }
  return steps;
}

/** Up to `count` of the review's words, one per meaning, so no two English tiles read the same. */
function matchPairs(words: LessonWord[], count: number) {
  const pairs: LessonWord[] = [];
  for (const word of shuffle(words)) {
    if (pairs.length < count && !pairs.some((w) => gloss(w).toLowerCase() === gloss(word).toLowerCase())) pairs.push(word);
  }
  return pairs;
}
