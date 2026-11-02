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
