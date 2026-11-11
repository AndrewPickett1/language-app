import type { Rarity } from '@/data/rarity';
import { supabase } from '@/utils/supabase';
import { toRarity } from '@/utils/word-rows';

/** What `get_lotto_state` returns. The server applies any recharges before answering. */
export type LottoStateRow = {
  current_lotto_pulls: number;
  max_lotto_pulls: number;
  /** Null when the learner's pulls are full. */
  next_pull_at: string | null;
  server_now: string;
  /** The rarity the next pull is guaranteed to be (the database's label, e.g. `Super Rare`). Null when there's no guarantee. */
  guaranteed_rarity?: string | null;
};

/** What `spend_lotto_pull` returns. The server picks the word and has already saved it to `user_words`. */
export type SpendLottoRow = {
  current_lotto_pulls: number;
  max_lotto_pulls: number;
  next_pull_at: string;
  server_now: string;
  word_id: number;
  /** False when the learner already had the word. */
  is_new: boolean;
  /** The guarantee this pull used, if any. */
  guarantee_used: string | null;
  /** The guarantee left for the next pull, if any. */
  guaranteed_rarity: string | null;
};

/** Exercises that earn a bonus pull when finished. */
export type BonusSource = 'study' | 'match' | 'lesson';

/** What `claim_exercise_pull` returns. `full` means the tray had no room, so nothing was added. */
export type BonusPullRow = {
  granted: boolean;
  reason: 'granted' | 'full';
  current_lotto_pulls: number;
  max_lotto_pulls: number;
  /** Null when the learner's pulls are full. */
  next_pull_at: string | null;
  server_now: string;
};

export type SpendResult = { ok: true; state: SpendLottoRow } | { ok: false; reason: 'no_pulls'; nextPullAt: Date | null };

/** The learner's pulls, with recharges applied by the server. */
export async function fetchLottoState(): Promise<LottoStateRow> {
  const { data, error } = await supabase.rpc('get_lotto_state').single().overrideTypes<LottoStateRow, { merge: false }>();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('get_lotto_state returned nothing.');
  return data;
}

/** The app's rarity for a database rarity label. Null stays null. */
export function toGuarantee(value: string | null | undefined): Rarity | null {
  return value ? toRarity(value) : null;
}

/**
 * Spends one pull on the server, which picks a word from `language` (using any guarantee) and saves it.
 * Being out of pulls is a result, not an error.
 */
export async function spendLottoPull(language: string): Promise<SpendResult> {
  const { data, error } = await supabase
    .rpc('spend_lotto_pull', { p_language: language })
    .single()
    .overrideTypes<SpendLottoRow, { merge: false }>();
  if (error) {
    if (error.message.includes('NO_PULLS')) return { ok: false, reason: 'no_pulls', nextPullAt: parseTimestamp(error.details) };
    if (error.message.includes('NOT_AUTHENTICATED')) throw new Error('Sign in to pull a capsule.');
    if (error.message.includes('NO_WORDS') || error.message.includes('UNKNOWN_LANGUAGE')) throw new Error(`There are no ${language} words to pull yet.`);
    throw new Error(error.message);
  }
  if (!data) throw new Error('spend_lotto_pull returned nothing.');
  return { ok: true, state: data };
}

/** Asks the server for the bonus pull a finished exercise earns. Capped at the learner's max pulls. */
export async function claimExercisePull(source: BonusSource): Promise<BonusPullRow> {
  const { data, error } = await supabase
    .rpc('claim_exercise_pull', { p_source: source })
    .single()
    .overrideTypes<BonusPullRow, { merge: false }>();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('claim_exercise_pull returned nothing.');
  return data;
}

/**
 * Reads a Postgres timestamptz as either PostgREST's ISO form or Postgres's own text form
 * (`2026-10-19 08:00:00.123456+00`, which `NO_PULLS` details use). Null if it can't be read.
 */
export function parseTimestamp(value: string | null | undefined): Date | null {
  if (!value) return null;
  const iso = value
    .trim()
    .replace(' ', 'T')
    // Hermes only reliably reads milliseconds, not microseconds.
    .replace(/(\.\d{3})\d+/, '$1')
    // `+00` → `+00:00`
    .replace(/([+-]\d{2})$/, '$1:00');
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : new Date(ms);
}
