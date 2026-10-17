import { createContext, use, useCallback, useState, type ReactNode } from 'react';

import { StarterWordIds } from '@/data/words';
import { useAuth } from '@/state/auth';
import { drawWord, type PullResult } from '@/state/draw-word';
import { useLanguage } from '@/state/language';
import { useMyWords } from '@/state/my-words';
import { useStreak } from '@/state/streak';
import { supabase } from '@/utils/supabase';
import { fetchDeck } from '@/utils/word-rows';

export type { PullResult };

export const MaxPulls = 5;
export const RefillMs = 3 * 60 * 60 * 1000;
/** Correct answers before a word stops showing up in "to review". */
const Mastered = 3;

type GameState = {
  collected: string[];
  pulls: number;
  nextPullAt: number | null;
  correct: Record<string, number>;
};

type Game = GameState & {
  /** The learner's words in the current language with fewer than `Mastered` correct Study answers. */
  reviewCount: number;
  /** Draws from the current language's words in Supabase. Null when no pulls are left; throws if the fetch fails. */
  pull: () => Promise<PullResult | null>;
  refill: () => void;
  recordAnswer: (id: string, right: boolean) => void;
};

const GameContext = createContext<Game | null>(null);

function initialState(): GameState {
  return {
    collected: StarterWordIds,
    pulls: 3,
    nextPullAt: Date.now() + RefillMs,
    correct: {},
  };
}

/** Adds every pull that has refilled since `nextPullAt`. */
function settle(state: GameState, now: number): GameState {
  let { pulls, nextPullAt } = state;
  while (nextPullAt !== null && now >= nextPullAt && pulls < MaxPulls) {
    pulls += 1;
    nextPullAt = pulls < MaxPulls ? nextPullAt + RefillMs : null;
  }
  return pulls === state.pulls ? state : { ...state, pulls, nextPullAt };
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialState);
  const { language } = useLanguage();
  const myWords = useMyWords();
  const userId = useAuth().user?.id;
  const { markPlayed } = useStreak();

  // Stable across renders so screens can use them in effects.
  const refill = useCallback(() => setState((s) => settle(s, Date.now())), []);
  const recordAnswer = useCallback((id: string, right: boolean) => {
    if (!right) return;
    setState((s) => ({ ...s, correct: { ...s.correct, [id]: (s.correct[id] ?? 0) + 1 } }));
  }, []);

  const game: Game = {
    ...state,
    reviewCount: myWords.words.filter((w) => (state.correct[w.id] ?? 0) < Mastered).length,
    async pull() {
      if (settle(state, Date.now()).pulls <= 0) return null;
      const deck = await fetchDeck(language.name);
      if (deck.length === 0) throw new Error(`There are no ${language.name} words to pull yet.`);
      const result = drawWord([...myWords.collected, ...state.collected], deck);
      // Save a new word before spending the pull, so a failed save costs nothing. Repeats are already owned.
      if (result.isNew) {
        if (!userId) throw new Error('Sign in to keep the words you win.');
        const { error } = await supabase.from('user_words').insert({ user_id: userId, word_id: Number(result.word.id) });
        if (error) throw new Error(`Couldn't save your word. ${error.message}`);
        void myWords.refresh();
      }
      setState((s) => {
        const now = Date.now();
        const current = settle(s, now);
        return {
          ...current,
          pulls: Math.max(0, current.pulls - 1),
          nextPullAt: current.nextPullAt ?? now + RefillMs,
          collected: result.isNew ? [...current.collected, result.word.id] : current.collected,
        };
      });
      markPlayed('lotto');
      return result;
    },
    refill,
    recordAnswer,
  };

  return <GameContext value={game}>{children}</GameContext>;
}

export function useGame() {
  const game = use(GameContext);
  if (!game) throw new Error('useGame must be used inside <GameProvider>');
  return game;
}
