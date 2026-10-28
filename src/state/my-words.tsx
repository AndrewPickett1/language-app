import { createContext, use, useCallback, useEffect, useState, type ReactNode } from 'react';

import type { Word } from '@/data/words';
import { useAuth } from '@/state/auth';
import { useLanguage } from '@/state/language';
import { supabase } from '@/utils/supabase';
import { addWordToday, fetchWordAddStatus, type WordAddStatus } from '@/utils/word-add';
import { WordColumns, toWord, type LoadedWord, type WordRow } from '@/utils/word-rows';

type UserWordRow = { created_at: string; words: WordRow | null };

type Ctx = {
  /** The signed-in learner's words in the current language, oldest first. */
  words: Word[];
  /** How many of the learner's words are in other languages, so an empty list can say where they went. */
  otherLanguageCount: number;
  /** Ids of `words` in the order they were won, for "Newest". */
  collected: string[];
  /** True until the first fetch for the signed-in learner has finished. */
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  /** Whether today's word from Add a word is still free. Null until the server has answered. */
  canAddToday: boolean | null;
  /** Adds a word as today's one add (`add_word`), then reloads the list. Throws if the request fails. */
  add: (wordId: string) => Promise<WordAddStatus>;
};

const MyWordsContext = createContext<Ctx | null>(null);

/** The words the signed-in learner owns, read from `user_words` joined to `words`. */
export function MyWordsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const userId = user?.id;
  // Tagged with the learner they belong to, so a sign-out or account switch never shows someone else's words.
  const [loaded, setLoaded] = useState<Loaded>();
  const [addStatus, setAddStatus] = useState<{ userId: string; available: boolean }>();

  useEffect(() => {
    if (!userId) return;
    let live = true;
    fetchMyWords(userId).then((next) => {
      if (live) setLoaded((prev) => keepWordsOnError(prev, next));
    });
    loadAddStatus(userId).then((next) => {
      if (live && next) setAddStatus(next);
    });
    return () => {
      live = false;
    };
  }, [userId]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const [next, status] = await Promise.all([fetchMyWords(userId), loadAddStatus(userId)]);
    setLoaded((prev) => keepWordsOnError(prev, next));
    if (status) setAddStatus(status);
  }, [userId]);

  const add = useCallback(
    async (wordId: string) => {
      if (!userId) throw new Error('Sign in to add words.');
      const status = await addWordToday(wordId);
      if (status === 'added' || status === 'used') setAddStatus({ userId, available: false });
      if (status === 'added') await refresh();
      return status;
    },
    [userId, refresh]
  );

  const current = loaded?.userId === userId ? loaded : undefined;
  const loading = !!userId && !current;
  const error = current?.error ?? null;
  // Words without a language show up whichever language is picked.
  const all = current?.words ?? [];
  const words = all.filter((w) => w.language === null || w.language === language.name);
  const ctx: Ctx = { words, otherLanguageCount: all.length - words.length, collected: words.map((w) => w.id), loading, error, refresh, canAddToday: addStatus && addStatus.userId === userId ? addStatus.available : null, add };
  return <MyWordsContext value={ctx}>{children}</MyWordsContext>;
}

export function useMyWords() {
  const ctx = use(MyWordsContext);
  if (!ctx) throw new Error('useMyWords must be used inside <MyWordsProvider>');
  return ctx;
}

type Loaded = { userId: string; words: LoadedWord[]; error: string | null };

async function fetchMyWords(userId: string): Promise<Loaded> {
  let result;
  try {
    result = await supabase
      .from('user_words')
      .select(`created_at, words(${WordColumns})`)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .overrideTypes<UserWordRow[], { merge: false }>();
  } catch (e) {
    // A thrown request (network, polyfill) would otherwise leave the list loading forever.
    return { userId, words: [], error: e instanceof Error ? e.message : String(e) };
  }
  const { data, error } = result;
  if (error) return { userId, words: [], error: error.message };
  // A word can be won more than once; keep the first time.
  const seen = new Set<number>();
  const words: LoadedWord[] = [];
  for (const row of data) {
    if (!row.words || seen.has(row.words.id)) continue;
    seen.add(row.words.id);
    words.push(toWord(row.words));
  }
  return { userId, words, error: null };
}

/** Null when the server can't be reached, so the last answer stays. */
async function loadAddStatus(userId: string) {
  try {
    return { userId, available: await fetchWordAddStatus() };
  } catch (e) {
    console.warn(`Couldn't load today's word add: ${(e as Error).message}`);
    return null;
  }
}

/** A failed refresh keeps the words already on screen. */
function keepWordsOnError(prev: Loaded | undefined, next: Loaded): Loaded {
  return next.error && prev?.userId === next.userId ? { ...next, words: prev.words } : next;
}
