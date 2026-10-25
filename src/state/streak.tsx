import { createContext, use, useCallback, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/state/auth';
import { fetchStreakSummary, syncTimezone, type DayStatus, type StreakSummaryRow } from '@/utils/streak';

/**
 * Everything that keeps a streak going, with the line the streak pop-up shows for it. The server decides
 * what counts (each action's RPC calls `record_activity`); after one, call `refresh(reason)`.
 */
export const StreakMessages = {
  lotto: 'You pulled a capsule. Streak saved for today!',
  study: 'You finished an exercise. Streak saved for today!',
} as const;

export type StreakReason = keyof typeof StreakMessages;

/** One of the last 7 days, with its local date (`YYYY-MM-DD`) from the server. */
export type StreakDay = { date: string; status: DayStatus };

type StreakState = {
  /** Whose streak this is, so a different learner never sees the last one's. */
  owner: string | null;
  summary: StreakSummaryRow | null;
  /** Set when a refresh finds today newly done, until the streak pop-up is closed. */
  popup: StreakReason | null;
  /** Days of the streak rewards (`StreakRewards`) the learner has claimed. */
  claimed: number[];
};

type Streak = {
  streak: number;
  /** The longest streak the learner has had, never less than `streak`. */
  best: number;
  playedToday: boolean;
  /** The streak ran out: the learner had one before but missed a day. */
  lost: boolean;
  /** The last 7 days, oldest first, ending with today. Empty until the first load. */
  days: StreakDay[];
  loading: boolean;
  /**
   * Reloads the streak from the server. Never throws. Pass the `reason` after an action that counts
   * toward the streak, so the pop-up shows for it if that action is what saved today.
   */
  refresh: (reason?: StreakReason) => Promise<void>;
  /** Why the streak just grew, while its pop-up is waiting to be shown or closed. */
  streakPopup: StreakReason | null;
  closeStreakPopup: () => void;
  claimedRewards: number[];
  /** Marks the streak reward for `day` as claimed. */
  claimReward: (day: number) => void;
};

const StreakContext = createContext<Streak | null>(null);

// Sample data that resets on reload: the day 3, 5 and 7 rewards claimed.
const Empty: StreakState = { owner: null, summary: null, popup: null, claimed: [3, 5, 7] };

/** `YYYY-MM-DD` plus `offset` days, worked out in UTC so the device's timezone can't shift it. */
function addDays(date: string, offset: number) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + offset)).toISOString().slice(0, 10);
}

/**
 * The learner's daily streak. The server owns it: spending a pull (`spend_lotto_pull`) or finishing an exercise
 * (`claim_exercise_pull`) counts toward today, and `get_streak_summary` reads it back with any missed day already applied.
 * Only the claimed rewards are local sample data.
 */
export function StreakProvider({ children }: { children: ReactNode }) {
  const userId = useAuth().user?.id ?? null;
  const [stored, setState] = useState<StreakState>(Empty);
  const state = stored.owner === userId ? stored : { ...Empty, owner: userId };

  const refresh = useCallback(async (reason?: StreakReason) => {
    if (!userId) return;
    try {
      const summary = await fetchStreakSummary();
      setState((s) => {
        const prev = s.owner === userId ? s : { ...Empty, owner: userId };
        // Celebrate only when this action is what took today from not done to done.
        const savedNow = !!reason && prev.summary?.today === summary.today && prev.summary.days.at(-1) !== 'done' && summary.days.at(-1) === 'done';
        return { ...prev, summary, popup: savedNow ? reason : prev.popup };
      });
    } catch (e) {
      console.warn(`Couldn't load the streak: ${(e as Error).message}`);
    }
  }, [userId]);

  // On sign-in and each return to the foreground: send the timezone first so the server's "today" is right,
  // then reload, since the day may have rolled over.
  useEffect(() => {
    if (!userId) return;
    const load = () =>
      syncTimezone()
        .catch((e: Error) => console.warn(`Couldn't save the timezone: ${e.message}`))
        .then(() => refresh());
    void load();
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') void load();
    });
    return () => sub.remove();
  }, [userId, refresh]);

  const closeStreakPopup = useCallback(() => setState((s) => ({ ...s, popup: null })), []);
  const claimReward = useCallback(
    (day: number) => setState((s) => (s.claimed.includes(day) ? s : { ...s, claimed: [...s.claimed, day] })),
    [],
  );

  const { summary } = state;
  const streak: Streak = {
    streak: summary?.current_streak ?? 0,
    best: summary?.best_streak ?? 0,
    playedToday: summary?.days.at(-1) === 'done',
    lost: !!summary && summary.current_streak === 0 && summary.best_streak > 0,
    days: summary ? summary.days.map((status, i) => ({ date: addDays(summary.today, i - (summary.days.length - 1)), status })) : [],
    loading: !summary,
    refresh,
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
