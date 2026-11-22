import { shuffle } from '@/data/lesson';
import type { Word } from '@/data/words';
import { progressFor, type WordProgress } from '@/utils/word-progress';

/** The Study hub exercises that quiz the learner's own words. `review` is the Daily Review's whole round (see `daily-review.ts`). */
export type StudyExercise = 'flashcards' | 'matching' | 'gender' | 'review';

type Rule = {
  /** How many words a session asks. */
  count: number;
  /** Fewest words a session can run on. Mastered words top a session up to this when nothing else is left. */
  min?: number;
  /** No two words share a meaning, so every pair has one right answer. */
  distinctMeanings?: boolean;
  /** With fewer words than `count`, ask each one twice (up to `count`) so a short session still has some practice. */
  repeatToFill?: boolean;
};

const Rules: Record<StudyExercise, Rule> = {
  flashcards: { count: 10, repeatToFill: true },
  matching: { count: 5, min: 2, distinctMeanings: true },
  gender: { count: 10 },
  review: { count: 10, min: 4 },
};

/** How many words a session of `exercise` asks at most. */
export function sessionSize(exercise: StudyExercise) {
  return Rules[exercise].count;
}

/** A miss this many local days back (but not today) puts a word first. */
const RecentMissDays = 3;
/** An untested word added this many local days back counts as just got. */
const FreshDays = 7;
/** Wrong this many times, and on at least `OftenWrongShare` of its answers, a word counts as often wrong. */
const OftenWrongMisses = 2;
const OftenWrongShare = 0.3;

/**
 * The tiers a study session draws from, first to last. A word goes in the first one it fits.
 * Mastered words (not rusty) fit none, so sessions leave them out.
 */
type Tier = 'recentMiss' | 'fresh' | 'oftenWrong' | 'learning' | 'rusty';
const TierOrder: Tier[] = ['recentMiss', 'fresh', 'oftenWrong', 'learning', 'rusty'];

function tierOf(p: WordProgress): Tier | null {
  if (p.stage === 'mastered') return null;
  if (p.missedDaysAgo != null && p.missedDaysAgo >= 1 && p.missedDaysAgo <= RecentMissDays) return 'recentMiss';
  if (p.timesSeen === 0 && p.addedDaysAgo <= FreshDays) return 'fresh';
  const misses = p.timesSeen - p.timesCorrect;
  if (misses >= OftenWrongMisses && misses / p.timesSeen >= OftenWrongShare) return 'oftenWrong';
  return p.stage === 'rusty' ? 'rusty' : 'learning';
}

/**
 * How a tier orders its words, lower first. Learning words are a weighted draw, so stronger ones still come
 * up, just less often: a word's chance goes with how far its strength is from 100.
 */
function sortKey(tier: Tier, p: WordProgress): number {
  switch (tier) {
    case 'recentMiss':
      return p.missedDaysAgo ?? 0;
    case 'fresh':
      return p.addedDaysAgo;
    case 'oftenWrong':
      return -(p.timesSeen - p.timesCorrect);
    case 'learning':
      // Weighted shuffle (Efraimidis–Spirakis): the biggest random() ** (1 / weight) comes first.
      return -(Math.random() ** (1 / (105 - p.strength)));
    case 'rusty':
      return p.strength;
  }
}

/**
 * Which of the learner's words a study session should quiz first: words missed in the last few days (not
 * today), then words just got and not yet tested, then words often answered wrong, then the rest of the
 * unmastered words (weaker ones more likely first), then rusty words. Mastered words fit no tier and go last,
 * weakest first, for `selectStudyWords` to drop. Words tie randomly.
 */
export function rankWords<W extends Word>(words: W[], progress: Record<string, WordProgress>): W[] {
  const rank = (t: Tier | null) => (t ? TierOrder.indexOf(t) : TierOrder.length);
  // Shuffled first so the stable sort breaks ties randomly.
  return shuffle(words)
    .map((word) => {
      const p = progressFor(progress, word.id);
      const tier = tierOf(p);
      return { word, tier, key: tier ? sortKey(tier, p) : p.strength };
    })
    .sort((a, b) => rank(a.tier) - rank(b.tier) || a.key - b.key)
    .map((r) => r.word);
}

/**
 * The words a session of `exercise` asks, in the order it asks them. Every Study hub exercise picks its words
 * here. `pool` is the words the exercise can ask (for Gender, only the learner's gendered nouns). With `onlyIds`
 * (Polish on My words), only those words are asked, if the learner owns any of them, mastered ones too. `focusId`
 * (the card's Polish it) is asked first. The rest are the highest-ranked by `rankWords`, shuffled so the session
 * doesn't run in priority order. Otherwise mastered words are only asked when there's nothing else to fill `min`.
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

  // Mastered words rank last, and are dropped below unless the learner picked them or they're needed.
  let ranked = rankWords(
    words.filter((w) => w !== focus),
    progress
  );
  if (rule.distinctMeanings) {
    // After ranking, so the higher-priority word keeps its meaning.
    const taken = new Set(focus ? [focus.meaning] : []);
    ranked = ranked.filter((w) => !taken.has(w.meaning) && taken.add(w.meaning));
  }
  if (only.length === 0) {
    const unmastered = ranked.filter((w) => progressFor(progress, w.id).stage !== 'mastered');
    const need = (rule.min ?? 1) - (focus ? 1 : 0);
    ranked = unmastered.length >= need ? unmastered : ranked.slice(0, need);
  }

  const rest = shuffle(ranked.slice(0, focus ? rule.count - 1 : rule.count));
  const picks = focus ? [focus, ...rest] : rest;
  if (!rule.repeatToFill || picks.length === 0) return picks;
  return Array.from({ length: Math.min(rule.count, picks.length * 2) }, (_, i) => picks[i % picks.length]);
}
