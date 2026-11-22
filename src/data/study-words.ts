import { shuffle } from '@/data/lesson';
import type { Word } from '@/data/words';
import { progressFor, type WordProgress } from '@/utils/word-progress';

/** The Study hub exercises that quiz the learner's own words. */
export type StudyExercise = 'flashcards' | 'matching' | 'gender';

type Rule = {
  /** How many words a session asks. */
  count: number;
  /** No two words share a meaning, so every pair has one right answer. */
  distinctMeanings?: boolean;
  /** With fewer words than `count`, ask each one twice (up to `count`) so a short session still has some practice. */
  repeatToFill?: boolean;
};

const Rules: Record<StudyExercise, Rule> = {
  flashcards: { count: 10, repeatToFill: true },
  matching: { count: 5, distinctMeanings: true },
  gender: { count: 10 },
};

/** How many words a session of `exercise` asks at most. */
export function sessionSize(exercise: StudyExercise) {
  return Rules[exercise].count;
}

/**
 * Which of the learner's words a study session should quiz first: rusty words (mastered, but faded), then
 * the rest from the lowest strength up. New words have no strength yet, so they count as 0. Words tie randomly.
 */
export function rankWords<W extends Word>(words: W[], progress: Record<string, WordProgress>): W[] {
  // Shuffled first so the stable sort breaks ties randomly.
  return shuffle(words)
    .map((word) => ({ word, p: progressFor(progress, word.id) }))
    .sort((a, b) => Number(b.p.stage === 'rusty') - Number(a.p.stage === 'rusty') || a.p.strength - b.p.strength)
    .map((r) => r.word);
}

/**
 * The words a session of `exercise` asks, in the order it asks them. Every Study hub exercise picks its words
 * here. `pool` is the words the exercise can ask (for Gender, only the learner's gendered nouns). With `onlyIds`
 * (Polish on My words), only those words are asked, if the learner owns any of them. `focusId` (the card's Polish it)
 * is asked first. The rest are the highest-ranked by `rankWords`, shuffled so the session isn't weakest-first.
 */
export function selectStudyWords<W extends Word>(
  exercise: StudyExercise,
  pool: W[],
  progress: Record<string, WordProgress>,
  { focusId, onlyIds }: { focusId?: string; onlyIds?: string[] } = {}
): W[] {
  const rule = Rules[exercise];
  const only = onlyIds ? pool.filter((w) => onlyIds.includes(w.id)) : [];
  const words = only.length > 0 ? only : pool;
  const focus = pool.find((w) => w.id === focusId);

  let ranked = rankWords(
    words.filter((w) => w !== focus),
    progress
  );
  if (rule.distinctMeanings) {
    // After ranking, so the higher-priority word keeps its meaning.
    const taken = new Set(focus ? [focus.meaning] : []);
    ranked = ranked.filter((w) => !taken.has(w.meaning) && taken.add(w.meaning));
  }

  const rest = shuffle(ranked.slice(0, focus ? rule.count - 1 : rule.count));
  const picks = focus ? [focus, ...rest] : rest;
  if (!rule.repeatToFill || picks.length === 0) return picks;
  return Array.from({ length: Math.min(rule.count, picks.length * 2) }, (_, i) => picks[i % picks.length]);
}
