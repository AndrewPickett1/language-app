import { shuffle } from '@/data/lesson';
import type { Word } from '@/data/words';
import { progressFor, type WordProgress } from '@/utils/word-progress';

/**
 * Which of the learner's words a study session should quiz first: rusty words (mastered, but faded), then
 * the rest from the lowest strength up. New words have no strength yet, so they count as 0. Words tie randomly.
 */
export function rankWords(words: Word[], progress: Record<string, WordProgress>): Word[] {
  // Shuffled first so the stable sort breaks ties randomly.
  return shuffle(words)
    .map((word) => ({ word, p: progressFor(progress, word.id) }))
    .sort((a, b) => Number(b.p.stage === 'rusty') - Number(a.p.stage === 'rusty') || a.p.strength - b.p.strength)
    .map((r) => r.word);
}

/** The `count` words a session should quiz, highest priority first. */
export function pickStudyWords(words: Word[], progress: Record<string, WordProgress>, count: number): Word[] {
  return rankWords(words, progress).slice(0, count);
}
