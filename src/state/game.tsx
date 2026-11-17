import { createContext, use, useCallback, useState, type ReactNode } from 'react';

import { StarterWordIds, type Word } from '@/data/words';
import { useAuth } from '@/state/auth';
import { useLanguage } from '@/state/language';
import { useLotto } from '@/state/lotto';
import { useMyWords } from '@/state/my-words';
import { fetchWord } from '@/utils/word-rows';
import { hasMastered } from '@/data/mastery';
import { progressFor } from '@/utils/word-progress';
import { sendWordResults, type AnswerKind } from '@/utils/word-stats';

export type PullResult = { word: Word; isNew: boolean };

type GameState = {
  collected: string[];
};

type Game = GameState & {
  /** The learner's words in the current language that aren't mastered, plus mastered ones gone rusty. */
  reviewCount: number;
  /**
   * Spends a pull on the server, which picks a word from the current language (honouring any guarantee)
   * and saves it to the learner's words. Null when no pulls are left; throws if the spend or loading the word fails.
   */
  pull: () => Promise<PullResult | null>;
  /** Records an exercise answer on the learner's `user_words` row, which grows or fades the word's strength. */
  recordAnswer: (id: string, right: boolean, kind?: AnswerKind) => void;
};

const GameContext = createContext<Game | null>(null);

function initialState(): GameState {
  return {
    collected: StarterWordIds,
  };
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialState);
  const { language } = useLanguage();
  const myWords = useMyWords();
  const userId = useAuth().user?.id;
  const lotto = useLotto();

  // Stable across renders so screens can use them in effects.
  const recordAnswer = useCallback((id: string, right: boolean, kind: AnswerKind = 'recognition') => {
    sendWordResults([{ wordId: id, correct: right, kind }]);
  }, []);

  const game: Game = {
    ...state,
    reviewCount: myWords.words.filter((w) => {
      const { stage } = progressFor(myWords.progress, w.id);
      return stage === 'rusty' || !hasMastered(stage);
    }).length,
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
