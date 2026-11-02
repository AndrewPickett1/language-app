import { supabase } from '@/utils/supabase';

/** One sighting of a word. `correct` is null when it was shown without a question (Meet the word). */
export type WordResult = { wordId: string; correct: boolean | null };

/**
 * Records sightings, in order, on the learner's `user_words` rows through `record_word_results`: each one
 * counts as seen and stamps `last_seen_at`, a right answer counts as correct and grows `correct_streak`,
 * and a wrong one resets it. Words the learner doesn't own are skipped by the server.
 */
export async function recordWordResults(results: WordResult[]): Promise<void> {
  if (results.length === 0) return;
  const { error } = await supabase.rpc('record_word_results', {
    p_results: results.map((r) => ({ word_id: Number(r.wordId), correct: r.correct })),
  });
  if (error) throw new Error(error.message);
}

/** Fire and forget, for answers that shouldn't hold up the screen. */
export function sendWordResults(results: WordResult[]) {
  recordWordResults(results).catch((e: Error) => console.warn(`Couldn't record word results: ${e.message}`));
}

/** A learner's answer record for one word, from its `user_words` row. */
export type WordStats = { timesSeen: number; timesCorrect: number; correctStreak: number; lastSeenAt: Date | null };

type WordStatsRow = { word_id: number; times_seen: number; times_correct: number; correct_streak: number; last_seen_at: string | null };

/** The learner's answer stats, keyed by word id. Words without a `user_words` row aren't in it. */
export async function fetchWordStats(userId: string): Promise<Record<string, WordStats>> {
  const { data, error } = await supabase
    .from('user_words')
    .select('word_id, times_seen, times_correct, correct_streak, last_seen_at')
    .eq('user_id', userId)
    .overrideTypes<WordStatsRow[], { merge: false }>();
  if (error) throw new Error(error.message);
  // A word won twice has two rows, which record_word_results updates alike, so either will do.
  const stats: Record<string, WordStats> = {};
  for (const row of data) {
    stats[String(row.word_id)] = {
      timesSeen: row.times_seen,
      timesCorrect: row.times_correct,
      correctStreak: row.correct_streak,
      lastSeenAt: row.last_seen_at ? new Date(row.last_seen_at) : null,
    };
  }
  return stats;
}
