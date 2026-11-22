import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useAuth } from '@/state/auth';
import { supabase } from '@/utils/supabase';

/** What `get_daily_review_status` returns. The server works out "today". */
type StatusRow = { done_today: boolean; rounds_today: number; today: string };

/**
 * What `complete_daily_review` returns. Only the first round of the learner's day can grant a pull
 * (`full` when the tray had no room). Later rounds come back `already_reviewed`, with null lotto columns.
 */
export type DailyReviewRow = {
  first_today: boolean;
  rounds_today: number;
  granted: boolean;
  reason: 'granted' | 'full' | 'already_reviewed';
  current_lotto_pulls: number | null;
  max_lotto_pulls: number | null;
  next_pull_at: string | null;
  server_now: string;
};

/** Whether the learner has finished a Daily Review today. */
export async function fetchDailyReviewStatus(): Promise<StatusRow> {
  const { data, error } = await supabase.rpc('get_daily_review_status').single().overrideTypes<StatusRow, { merge: false }>();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('get_daily_review_status returned nothing.');
  return data;
}

/** Records a finished round. The server keeps the streak, and grants a pull for the day's first round. */
export async function completeDailyReview(): Promise<DailyReviewRow> {
  const { data, error } = await supabase.rpc('complete_daily_review').single().overrideTypes<DailyReviewRow, { merge: false }>();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('complete_daily_review returned nothing.');
  return data;
}

/** Whether today's Daily Review is done, reloaded each time the screen gains focus. Null until the server answers. */
export function useDailyReviewDone() {
  const userId = useAuth().user?.id;
  const [done, setDone] = useState<{ userId: string; done: boolean }>();

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      let live = true;
      fetchDailyReviewStatus().then(
        (s) => live && setDone({ userId, done: s.done_today }),
        (e: Error) => console.warn(`Couldn't load today's review: ${e.message}`)
      );
      return () => {
        live = false;
      };
    }, [userId])
  );

  return done && done.userId === userId ? done.done : null;
}
