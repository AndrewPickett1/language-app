import type { Stage } from '@/data/mastery';
import { supabase } from '@/utils/supabase';

/**
 * How well the learner knows one of their words, from `get_word_progress`. Strength is the current one,
 * after fading, and the stage and mastery rules are the server's.
 */
export type WordProgress = {
  wordId: string;
  /** 0–100. */
  strength: number;
  stage: Stage;
  timesSeen: number;
  timesCorrect: number;
  /** Mastery rule 2: different days answered right, target 3. */
  daysCorrect: number;
  /** Mastery rule 3: right answers on production exercises, target 2. */
  hardCorrect: number;
  /** The last 8 answers: bit 0 is the newest, 1 is right. Decode with `decodeRecent`. */
  recentResults: number;
  /** How many of those bits are answers, min(timesSeen, 8). */
  recentCount: number;
  masteredAt: Date | null;
  lastSeenAt: Date | null;
  nextReviewAt: Date | null;
};

type ProgressRow = {
  word_id: number;
  strength: number;
  stage: Stage;
  times_seen: number;
  times_correct: number;
  days_correct: number;
  hard_correct: number;
  recent_results: number;
  recent_count: number;
  mastered_at: string | null;
  last_seen_at: string | null;
  next_review_at: string | null;
};

const date = (s: string | null) => (s ? new Date(s) : null);

/** Progress for every word the learner owns, in every language, keyed by word id. */
export async function fetchWordProgress(): Promise<Record<string, WordProgress>> {
  const { data, error } = await supabase.rpc('get_word_progress');
  if (error) throw new Error(error.message);
  const progress: Record<string, WordProgress> = {};
  for (const row of (data ?? []) as ProgressRow[]) {
    progress[String(row.word_id)] = {
      wordId: String(row.word_id),
      strength: row.strength,
      stage: row.stage,
      timesSeen: row.times_seen,
      timesCorrect: row.times_correct,
      daysCorrect: row.days_correct,
      hardCorrect: row.hard_correct,
      recentResults: row.recent_results,
      recentCount: row.recent_count,
      masteredAt: date(row.mastered_at),
      lastSeenAt: date(row.last_seen_at),
      nextReviewAt: date(row.next_review_at),
    };
  }
  return progress;
}

/** A word with no progress row yet reads as new. */
export function progressFor(progress: Record<string, WordProgress>, wordId: string): WordProgress {
  return (
    progress[wordId] ?? {
      wordId,
      strength: 0,
      stage: 'new',
      timesSeen: 0,
      timesCorrect: 0,
      daysCorrect: 0,
      hardCorrect: 0,
      recentResults: 0,
      recentCount: 0,
      masteredAt: null,
      lastSeenAt: null,
      nextReviewAt: null,
    }
  );
}
