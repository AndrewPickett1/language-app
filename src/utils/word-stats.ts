import type { Stage } from '@/data/mastery';
import { supabase } from '@/utils/supabase';

/**
 * How hard an answer was, which decides how much it grows the word's strength. Only `production` answers
 * count toward the "typed or built it twice" mastery rule.
 *
 *   recognition — picking from options: Pick the meaning, Pick the word, Match pairs, Gender pick, Flashcards, Matching, Gender
 *   recall      — Listen & pick
 *   production  — typing or building the word
 *
 * TODO: nothing sends `production` yet, so no word can pass the "typed or built it twice" rule and no one
 * can master a word. Send it from Spelling (and Build the sentence) once those exercises exist.
 */
export type AnswerKind = 'recognition' | 'recall' | 'production';

/** One answer to a question about a word. Words shown without a question (Meet the word) aren't sent. */
export type WordResult = { wordId: string; correct: boolean; kind: AnswerKind };

/** How one word changed in a `record_word_results` call. */
export type WordChange = {
  wordId: string;
  oldStage: Stage;
  newStage: Stage;
  oldStrength: number;
  newStrength: number;
  newlyMastered: boolean;
};

/** What a `record_word_results` call changed, and the mastery rewards the server granted for it. */
export type WordResultsSummary = {
  /** Newly mastered words first. */
  words: WordChange[];
  /** Words mastered in this call. */
  masteredCount: number;
  /** The learner's mastered words in total. */
  masteredTotal: number;
  /** A pull per newly mastered word, 0 when pulls were already full. */
  pullsGranted: number;
  /** Guaranteed Rare pulls, one every 10 mastered words. */
  guaranteesGranted: number;
  nextGuaranteeAt: number;
};

type SummaryRow = {
  words: { word_id: number; old_stage: Stage; new_stage: Stage; old_strength: number; new_strength: number; newly_mastered: boolean }[];
  mastered_count: number;
  mastered_total: number;
  pulls_granted: number;
  guarantees_granted: number;
  next_guarantee_at: number;
};

/** The server allows this many results per call. */
const MaxResults = 200;

/**
 * Records answers, in order, through `record_word_results`. The server updates each word's strength,
 * stage and mastery, grants mastery rewards, and returns what changed. Words the learner doesn't own are
 * skipped by the server. More answers than one call takes go in several calls, merged into one summary.
 */
export async function recordWordResults(results: WordResult[]): Promise<WordResultsSummary | null> {
  let summary: WordResultsSummary | null = null;
  for (let i = 0; i < results.length; i += MaxResults) {
    const next = await recordChunk(results.slice(i, i + MaxResults));
    summary = summary ? mergeSummaries(summary, next) : next;
  }
  return summary;
}

async function recordChunk(results: WordResult[]): Promise<WordResultsSummary> {
  const { data: row, error } = await supabase.rpc('record_word_results', {
    p_results: results.map((r) => ({ word_id: Number(r.wordId), correct: r.correct, kind: r.kind })),
  });
  if (error) throw new Error(error.message);
  // A jsonb result, which the untyped client can't describe.
  const data = row as SummaryRow | null;
  if (!data) throw new Error('record_word_results returned nothing.');
  return {
    words: data.words.map((w) => ({
      wordId: String(w.word_id),
      oldStage: w.old_stage,
      newStage: w.new_stage,
      oldStrength: w.old_strength,
      newStrength: w.new_strength,
      newlyMastered: w.newly_mastered,
    })),
    masteredCount: data.mastered_count,
    masteredTotal: data.mastered_total,
    pullsGranted: data.pulls_granted,
    guaranteesGranted: data.guarantees_granted,
    nextGuaranteeAt: data.next_guarantee_at,
  };
}

/** A word in both keeps where it started in `a` and where it ended in `b`. Newly mastered words stay first. */
function mergeSummaries(a: WordResultsSummary, b: WordResultsSummary): WordResultsSummary {
  const words = new Map(a.words.map((w) => [w.wordId, w]));
  for (const w of b.words) {
    const first = words.get(w.wordId);
    words.set(w.wordId, first ? { ...w, oldStage: first.oldStage, oldStrength: first.oldStrength, newlyMastered: first.newlyMastered || w.newlyMastered } : w);
  }
  return {
    words: [...words.values()].sort((x, y) => Number(y.newlyMastered) - Number(x.newlyMastered)),
    masteredCount: a.masteredCount + b.masteredCount,
    masteredTotal: b.masteredTotal,
    pullsGranted: a.pullsGranted + b.pullsGranted,
    guaranteesGranted: a.guaranteesGranted + b.guaranteesGranted,
    nextGuaranteeAt: b.nextGuaranteeAt,
  };
}

/** Fire and forget, for answers that shouldn't hold up the screen. */
export function sendWordResults(results: WordResult[]) {
  recordWordResults(results).catch((e: Error) => console.warn(`Couldn't record word results: ${e.message}`));
}
