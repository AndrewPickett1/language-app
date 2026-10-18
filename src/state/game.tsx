import { createContext, use, useCallback, useState, type ReactNode } from 'react';

import { StarterWordIds } from '@/data/words';
import { useAuth } from '@/state/auth';
import { drawWord, type PullResult } from '@/state/draw-word';
import { useLanguage } from '@/state/language';
import { useLotto } from '@/state/lotto';
import { useMyWords } from '@/state/my-words';
import { useStreak } from '@/state/streak';
import { supabase } from '@/utils/supabase';
import { fetchDeck } from '@/utils/word-rows';

export type { PullResult };

/** Correct answers before a word stops showing up in "to review". */
const Mastered = 3;

type GameState = {
  collected: string[];
  correct: Record<string, number>;
};

type Game = GameState & {
  /** The learner's words in the current language with fewer than `Mastered` correct Study answers. */
  reviewCount: number;
  /** Spends a pull on the server and draws from the current language's words. Null when no pulls are left; throws if the fetch fails. */
  pull: () => Promise<PullResult | null>;
  recordAnswer: (id: string, right: boolean) => void;
};

const GameContext = createContext<Game | null>(null);

function initialState(): GameState {
  return {
    collected: StarterWordIds,
    correct: {},
  };
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialState);
  const { language } = useLanguage();
  const myWords = useMyWords();
  const userId = useAuth().user?.id;
  const { markPlayed } = useStreak();
  const lotto = useLotto();

  // Stable across renders so screens can use them in effects.
  const recordAnswer = useCallback((id: string, right: boolean) => {
    if (!right) return;
    setState((s) => ({ ...s, correct: { ...s.correct, [id]: (s.correct[id] ?? 0) + 1 } }));
  }, []);

  const game: Game = {
    ...state,
    reviewCount: myWords.words.filter((w) => (state.correct[w.id] ?? 0) < Mastered).length,
    async pull() {
      if (lotto.currentPulls <= 0) return null;
      // Draw before spending, so a failed deck fetch costs nothing.
      // TODO: use word_id from spend_lotto_pull once the server picker exists
      const deck = await fetchDeck(language.name);
      if (deck.length === 0) throw new Error(`There are no ${language.name} words to pull yet.`);
      const result = drawWord([...myWords.collected, ...state.collected], deck);
      if (result.isNew && !userId) throw new Error('Sign in to keep the words you win.');
      const spent = await lotto.spend();
      if (!spent.ok) return null;
      // Repeats are already owned, so only a new word needs saving.
      if (result.isNew) {
        const { error } = await supabase.from('user_words').insert({ user_id: userId, word_id: Number(result.word.id) });
        if (error) throw new Error(`Couldn't save your word. ${error.message}`);
        void myWords.refresh();
        setState((s) => ({ ...s, collected: [...s.collected, result.word.id] }));
      }
      markPlayed('lotto');
      return result;
    },
    recordAnswer,
  };

  return <GameContext value={game}>{children}</GameContext>;
}

export function useGame() {
  const game = use(GameContext);
  if (!game) throw new Error('useGame must be used inside <GameProvider>');
  return game;
}
