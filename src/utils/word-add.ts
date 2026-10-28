import { supabase } from '@/utils/supabase';

/** What `add_word` did. Only `added` uses up the day. */
export type WordAddStatus = 'added' | 'used' | 'owned' | 'unknown_word';

type StatusRow = { available: boolean; today: string };
type AddRow = { status: WordAddStatus; today: string };

/** Whether the learner can still add today's word. The server works out "today". */
export async function fetchWordAddStatus(): Promise<boolean> {
  const { data, error } = await supabase.rpc('get_word_add_status').single().overrideTypes<StatusRow, { merge: false }>();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('get_word_add_status returned nothing.');
  return data.available;
}

/** Adds a word as the learner's one add for today. The server refuses a second one. */
export async function addWordToday(wordId: string): Promise<WordAddStatus> {
  const { data, error } = await supabase.rpc('add_word', { p_word_id: Number(wordId) }).single().overrideTypes<AddRow, { merge: false }>();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('add_word returned nothing.');
  return data.status;
}
