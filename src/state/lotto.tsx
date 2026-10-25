import { createContext, use, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/state/auth';
import { useStreak } from '@/state/streak';
import {
  claimExercisePull,
  fetchLottoState,
  parseTimestamp,
  spendLottoPull,
  type BonusPullRow,
  type BonusSource,
  type LottoStateRow,
  type SpendResult,
} from '@/utils/lotto';
import { askForLottoNotifications, syncLottoNotification } from '@/utils/lotto-notification';

type LottoState = {
  /** Whose pulls these are, so a different learner never sees the last one's. */
  owner: string | null;
  currentPulls: number;
  maxPulls: number;
  /** Server time the next pull recharges. Null when pulls are full. */
  nextPullAt: Date | null;
  /** Server clock minus device clock, from the last RPC response. */
  clockOffsetMs: number;
  /** True until the first `get_lotto_state` answer (or failure). */
  loading: boolean;
  spending: boolean;
};

type Lotto = Omit<LottoState, 'owner'> & {
  /** Reloads pulls from the server, which applies any recharges. */
  refresh: () => Promise<void>;
  /** Spends one pull on the server. On `no_pulls` the state is refreshed so the countdown shows. */
  spend: () => Promise<SpendResult>;
  /** Claims the bonus pull a finished exercise earns. The server decides whether it's granted. */
  claimBonus: (source: BonusSource) => Promise<BonusPullRow>;
};

const LottoContext = createContext<Lotto | null>(null);

const Empty: LottoState = { owner: null, currentPulls: 0, maxPulls: 1, nextPullAt: null, clockOffsetMs: 0, loading: true, spending: false };

/** Pull counts always come from the server's answer, never from counting locally. */
function fromServer(state: LottoState, owner: string, row: LottoStateRow): LottoState {
  const serverNow = parseTimestamp(row.server_now);
  return {
    ...state,
    owner,
    currentPulls: row.current_lotto_pulls,
    maxPulls: row.max_lotto_pulls,
    nextPullAt: parseTimestamp(row.next_pull_at),
    clockOffsetMs: serverNow ? serverNow.getTime() - Date.now() : state.clockOffsetMs,
    loading: false,
  };
}

/**
 * The learner's lotto pulls. The server owns them: it recharges one per interval up to the max,
 * and the client only reads `lotto_state` and spends through `spend_lotto_pull`.
 */
export function LottoProvider({ children }: { children: ReactNode }) {
  const userId = useAuth().user?.id ?? null;
  const { refresh: refreshStreak } = useStreak();
  const [stored, setState] = useState<LottoState>(Empty);
  const spendingRef = useRef<Promise<SpendResult> | null>(null);
  const state = stored.owner === userId ? stored : { ...Empty, owner: userId };

  const onLoaded = useCallback(
    (row: LottoStateRow) => {
      if (userId) setState((s) => fromServer(s.owner === userId ? s : Empty, userId, row));
    },
    [userId]
  );
  const onLoadFailed = useCallback(
    (e: Error) => {
      console.warn(`Couldn't load your lotto pulls: ${e.message}`);
      setState((s) => (s.owner === userId ? { ...s, loading: false } : { ...Empty, owner: userId, loading: false }));
    },
    [userId]
  );
  const refresh = useCallback(async () => {
    if (userId) await fetchLottoState().then(onLoaded, onLoadFailed);
  }, [userId, onLoaded, onLoadFailed]);

  const spend = useCallback(async () => {
    if (!userId) throw new Error('Sign in to pull a capsule.');
    // Taps while a spend is in flight share it, so only one pull is spent.
    if (spendingRef.current) return spendingRef.current;
    const run = (async (): Promise<SpendResult> => {
      setState((s) => ({ ...s, spending: true }));
      try {
        const result = await spendLottoPull();
        if (result.ok) {
          setState((s) => fromServer(s, userId, result.state));
          // The spend also counts toward today's streak on the server. The Lotto screen shows the
          // pop-up once the word card closes, so this doesn't hold up the capsule.
          void refreshStreak('lotto');
          void askForLottoNotifications().then((granted) => {
            if (granted) void refreshNotification(result.state.next_pull_at, result.state.server_now);
          });
        } else {
          // Another device may have spent it. Show the server's countdown straight away, then reload the rest.
          setState((s) => ({ ...s, currentPulls: 0, nextPullAt: result.nextPullAt ?? s.nextPullAt }));
          void refresh();
        }
        return result;
      } finally {
        setState((s) => ({ ...s, spending: false }));
        spendingRef.current = null;
      }
    })();
    spendingRef.current = run;
    return run;
  }, [userId, refresh, refreshStreak]);

  const claimBonus = useCallback(
    async (source: BonusSource) => {
      if (!userId) throw new Error('Sign in to earn a bonus pull.');
      try {
        const row = await claimExercisePull(source);
        setState((s) => fromServer(s.owner === userId ? s : Empty, userId, row));
        return row;
      } finally {
        // The claim also counts toward today's streak on the server. Reload it before answering
        // so the streak pop-up is ready before the pull-earned one.
        await refreshStreak('study');
      }
    },
    [userId, refreshStreak]
  );

  // Load on sign-in, and again whenever the app comes back to the foreground.
  useEffect(() => {
    if (!userId) return;
    const load = () => fetchLottoState().then(onLoaded, onLoadFailed);
    void load();
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') void load();
    });
    return () => sub.remove();
  }, [userId, onLoaded, onLoadFailed]);

  // Keep one pending "pull ready" notification at the next recharge, in device time. None when full or signed out.
  const nextPullMs = userId ? (state.nextPullAt?.getTime() ?? null) : null;
  const { clockOffsetMs } = state;
  useEffect(() => {
    syncLottoNotification(nextPullMs === null ? null : new Date(nextPullMs - clockOffsetMs)).catch((e: Error) =>
      console.warn(`Couldn't schedule the lotto notification: ${e.message}`)
    );
  }, [nextPullMs, clockOffsetMs]);

  const lotto: Lotto = {
    currentPulls: state.currentPulls,
    maxPulls: state.maxPulls,
    nextPullAt: state.nextPullAt,
    clockOffsetMs: state.clockOffsetMs,
    loading: state.loading,
    spending: state.spending,
    refresh,
    spend,
    claimBonus,
  };
  return <LottoContext value={lotto}>{children}</LottoContext>;
}

/** Schedules the notification straight after permission is first granted, without waiting for the next state change. */
async function refreshNotification(nextPullAt: string, serverNow: string) {
  const next = parseTimestamp(nextPullAt);
  const now = parseTimestamp(serverNow);
  if (!next) return;
  const offset = now ? now.getTime() - Date.now() : 0;
  await syncLottoNotification(new Date(next.getTime() - offset));
}

export function useLotto() {
  const lotto = use(LottoContext);
  if (!lotto) throw new Error('useLotto must be used inside <LottoProvider>');
  return lotto;
}

/** How long the server takes to recharge one pull. Only drives the countdown's progress dial, so keep it in step with the server. */
export const RechargeMs = 3 * 60 * 60 * 1000;

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

/**
 * Time left until the next pull (`1:42:09`), by the server's clock, ticking once a second. Null when pulls are full.
 * At zero it asks the server once for the new state rather than adding the pull itself.
 */
export function useLottoCountdown() {
  const { nextPullAt, clockOffsetMs, refresh } = useLotto();
  const nextMs = nextPullAt?.getTime() ?? null;
  const [now, setNow] = useState(() => Date.now());
  const refreshedFor = useRef<number | null>(null);

  useEffect(() => {
    if (nextMs === null) return;
    const tick = () => setNow(Date.now());
    const timer = setInterval(tick, 1000);
    // Catch up straight away in case `now` went stale while there was nothing to count down.
    const first = setTimeout(tick, 0);
    return () => {
      clearInterval(timer);
      clearTimeout(first);
    };
  }, [nextMs]);

  const remainingMs = nextMs === null ? null : Math.max(0, nextMs - (now + clockOffsetMs));

  useEffect(() => {
    if (remainingMs !== 0 || nextMs === null || refreshedFor.current === nextMs) return;
    refreshedFor.current = nextMs;
    void refresh();
  }, [remainingMs, nextMs, refresh]);

  if (remainingMs === null) return null;
  const secs = Math.ceil(remainingMs / 1000);
  return {
    remainingMs,
    /** How much of the current recharge is done, 0–1. */
    progress: Math.min(1, Math.max(0, 1 - remainingMs / RechargeMs)),
    label: `${Math.floor(secs / 3600)}:${pad2(Math.floor((secs % 3600) / 60))}:${pad2(secs % 60)}`,
  };
}
