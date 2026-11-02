import { shuffle } from '@/data/lesson';
import type { Word } from '@/data/words';
import type { WordStats } from '@/utils/word-stats';

/**
 * Which of the learner's words a study session should quiz first. Every word lands in one tier, and tiers
 * are used strictly in order: a later tier only fills the places an earlier one leaves. Words tie randomly.
 *
 *   focus  — words with no record yet, and words the learner gets wrong a lot, ranked together by `need`
 *   stale  — words answered well but not seen for `RecentDays`, least recently seen first
 *   fresh  — words seen recently and answered well, lowest accuracy first
 */
export type Tier = 'focus' | 'stale' | 'fresh';

export const TierOrder: Tier[] = ['focus', 'stale', 'fresh'];

/** A word answered right less often than this (correct / seen) is struggling and goes in `focus`. */
export const StrugglingAccuracy = 0.6;

/** A word whose last answer was wrong (its correct streak is 0) is struggling too. */
export const LastMissIsStruggling = true;

/**
 * How badly a never-seen word needs practice, on the same 0–1 scale as a struggling word's miss rate
 * (1 − accuracy). At 0.5, words missed more often than not come before new words, and the rest after.
 */
export const NewWordNeed = 0.5;

/** Seen within this many days counts as recent. */
export const RecentDays = 3;

const DayMs = 24 * 60 * 60 * 1000;

export type WordPriority = { word: Word; tier: Tier; /** Higher goes first within the tier. */ score: number };

/** Places one word. `stats` is undefined for a word with no record. */
export function prioritize(word: Word, stats: WordStats | undefined, now = Date.now()): WordPriority {
  if (!stats || stats.timesSeen === 0) return { word, tier: 'focus', score: NewWordNeed };

  // Sightings without a question (Meet the word) count as seen but not correct, so they read as misses here.
  const accuracy = stats.timesCorrect / stats.timesSeen;
  const struggling = accuracy < StrugglingAccuracy || (LastMissIsStruggling && stats.correctStreak === 0);
  if (struggling) return { word, tier: 'focus', score: 1 - accuracy };

  const lastSeen = stats.lastSeenAt?.getTime() ?? 0;
  const age = now - lastSeen;
  if (age >= RecentDays * DayMs) return { word, tier: 'stale', score: age };
  // Recent and doing well: the weakest of them first.
  return { word, tier: 'fresh', score: 1 - accuracy };
}

/** Every word, best to quiz first. */
export function rankWords(words: Word[], stats: Record<string, WordStats>, now = Date.now()): WordPriority[] {
  // Shuffled first so the stable sort breaks ties randomly.
  return shuffle(words)
    .map((w) => prioritize(w, stats[w.id], now))
    .sort((a, b) => TierOrder.indexOf(a.tier) - TierOrder.indexOf(b.tier) || b.score - a.score);
}

/** The `count` words a session should quiz, highest priority first. */
export function pickStudyWords(words: Word[], stats: Record<string, WordStats>, count: number, now = Date.now()): Word[] {
  return rankWords(words, stats, now)
    .slice(0, count)
    .map((p) => p.word);
}
