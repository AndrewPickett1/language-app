import { createContext, use, useCallback, useState, type ReactNode } from 'react';

import { StarterWordIds, type Word } from '@/data/words';
import { useAuth } from '@/state/auth';
import { useLanguage } from '@/state/language';
import { useLotto } from '@/state/lotto';
import { useMyWords } from '@/state/my-words';
import { fetchWord } from '@/utils/word-rows';
import { sendWordResults } from '@/utils/word-stats';

export type PullResult = { word: Word; isNew: boolean };

/** Correct answers before a word stops showing up in "to review". */
const Mastered = 3;

type GameState = {
  collected: string[];
  correct: Record<string, number>;
};

type Game = GameState & {
  /** The learner's words in the current language with fewer than `Mastered` correct Study answers. */
  reviewCount: number;
  /**
   * Spends a pull on the server, which picks a word from the current language (honouring any guarantee)
   * and saves it to the learner's words. Null when no pulls are left; throws if the spend or loading the word fails.
   */
  pull: () => Promise<PullResult | null>;
  /** Counts an exercise answer toward mastery and records it on the learner's `user_words` row. */
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
  const lotto = useLotto();

  // Stable across renders so screens can use them in effects.
  const recordAnswer = useCallback((id: string, right: boolean) => {
    sendWordResults([{ wordId: id, correct: right }]);
    if (!right) return;
    setState((s) => ({ ...s, correct: { ...s.correct, [id]: (s.correct[id] ?? 0) + 1 } }));
  }, []);

  const game: Game = {
    ...state,
    reviewCount: myWords.words.filter((w) => (state.correct[w.id] ?? 0) < Mastered).length,
    async pull() {
      if (lotto.currentPulls <= 0) return null;
      if (!userId) throw new Error('Sign in to keep the words you win.');
      const spent = await lotto.spend(language.name);
      if (!spent.ok) return null;
      const { word_id: wordId, is_new: isNew } = spent.state;
      // The server has already saved a new word, so My words reloads even if showing it fails.
      if (isNew) {
        void myWords.refresh();
        setState((s) => ({ ...s, collected: [...s.collected, String(wordId)] }));
      }
      try {
        return { word: await fetchWord(Number(wordId)), isNew };
      } catch (e) {
        throw new Error(`Your word was saved, but it couldn't be shown. ${e instanceof Error ? e.message : ''}`.trim());
      }
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
