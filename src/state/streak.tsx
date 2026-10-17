import { createContext, use, useCallback, useEffect, useState, type ReactNode } from 'react';

import { useAuth } from '@/state/auth';
import { supabase } from '@/utils/supabase';

/**
 * Everything that keeps a streak going, with the line the streak pop-up shows for it.
 * To add a trigger, add it here and call `markPlayed('<reason>')` where it happens.
 */
export const StreakMessages = {
  lotto: 'You pulled your daily capsule. Streak saved for today!',
  study: 'You finished a study session. Streak saved for today!',
} as const;

export type StreakReason = keyof typeof StreakMessages;

type StreakState = {
  streak: number;
  /** The longest streak the learner has had, never less than `streak`. */
  best: number;
  /** Local date (`dayKey`) of the learner's last streak-keeping activity. */
  lastPlayed: string | null;
  /** Set by the first activity of the day, until the streak pop-up is closed. */
  popup: StreakReason | null;
  /** Days of the streak rewards (`StreakRewards`) the learner has claimed. */
  claimed: number[];
};

type Streak = {
  streak: number;
  best: number;
  playedToday: boolean;
  /** Counts toward today's streak. Only the first call each day changes anything. */
  markPlayed: (reason: StreakReason) => void;
  /** Why the streak just grew, while its pop-up is waiting to be shown or closed. */
  streakPopup: StreakReason | null;
  closeStreakPopup: () => void;
  claimedRewards: number[];
  /** Marks the streak reward for `day` as claimed. */
  claimReward: (day: number) => void;
};

const StreakContext = createContext<Streak | null>(null);

/** The local calendar day, as `YYYY-MM-DD`. */
function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function daysAgo(n: number) {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date;
}

/** Same day: no change. The day after the last one: the streak grows. Any later: it starts over at 1. */
function markPlayed(state: StreakState, reason: StreakReason): StreakState {
  const today = dayKey(new Date());
  if (state.lastPlayed === today) return state;
  const continued = state.lastPlayed === dayKey(daysAgo(1));
  const streak = continued ? state.streak + 1 : 1;
  return { ...state, streak, best: Math.max(state.best, streak), lastPlayed: today, popup: reason };
}

/**
 * The learner's daily streak. The current and best streak are read from their `profiles` row on sign-in.
 * Everything else is sample data that resets on reload: last kept yesterday, with the day 3, 5 and 7 rewards claimed.
 */
export function StreakProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [state, setState] = useState<StreakState>(() => ({ streak: 0, best: 0, lastPlayed: dayKey(daysAgo(1)), popup: null, claimed: [3, 5, 7] }));

  useEffect(() => {
    if (!userId) return;
    let live = true;
    fetchStreak(userId)
      .then(({ current, best }) => {
        if (live) setState((s) => ({ ...s, streak: current, best: Math.max(best, current) }));
      })
      .catch((e: Error) => console.warn(`Couldn't load the streak: ${e.message}`));
    return () => {
      live = false;
    };
  }, [userId]);

  // Stable across renders so the game and screens can call them from effects and async work.
  const mark = useCallback((reason: StreakReason) => setState((s) => markPlayed(s, reason)), []);
  const closeStreakPopup = useCallback(() => setState((s) => ({ ...s, popup: null })), []);
  const claimReward = useCallback(
    (day: number) => setState((s) => (s.claimed.includes(day) ? s : { ...s, claimed: [...s.claimed, day] })),
    [],
  );

  const streak: Streak = {
    streak: state.streak,
    best: state.best,
    playedToday: state.lastPlayed === dayKey(new Date()),
    markPlayed: mark,
    streakPopup: state.popup,
    closeStreakPopup,
    claimedRewards: state.claimed,
    claimReward,
  };
  return <StreakContext value={streak}>{children}</StreakContext>;
}

export function useStreak() {
  const streak = use(StreakContext);
  if (!streak) throw new Error('useStreak must be used inside <StreakProvider>');
  return streak;
}

type StreakRow = { current_streak: number | null; best_streak: number | null };

/** The learner's `current_streak` and `best_streak` from their profile. Missing values count as 0. */
async function fetchStreak(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('current_streak, best_streak')
    .eq('id', userId)
    .maybeSingle()
    .overrideTypes<StreakRow, { merge: false }>();
  if (error) throw new Error(error.message);
  return { current: data?.current_streak ?? 0, best: data?.best_streak ?? 0 };
}
