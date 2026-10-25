import { supabase } from '@/utils/supabase';

/** One of the last 7 days. `pending` is only ever today, before anything has counted. */
export type DayStatus = 'done' | 'missed' | 'pending';

/** What `get_streak_summary` returns. The server works out the learner's local day. */
export type StreakSummaryRow = {
  current_streak: number;
  best_streak: number;
  /** The learner's local date on the server, as `YYYY-MM-DD`. */
  today: string;
  /** The last 7 days, oldest first, ending with today. */
  days: DayStatus[];
};

/** The learner's streak as of today. A missed day already shows as 0 here, with the best streak kept. */
export async function fetchStreakSummary(): Promise<StreakSummaryRow> {
  const { data, error } = await supabase.rpc('get_streak_summary').single().overrideTypes<StreakSummaryRow, { merge: false }>();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('get_streak_summary returned nothing.');
  return data;
}

/** The device's IANA timezone (`America/Toronto`), or null if the JS engine can't tell. */
export function deviceTimezone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

/** Tells the server the device's timezone, which decides when the learner's day rolls over. */
export async function syncTimezone() {
  const tz = deviceTimezone();
  if (!tz) return;
  const { error } = await supabase.rpc('set_timezone', { p_tz: tz });
  if (error) throw new Error(error.message);
}
