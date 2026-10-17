import { createContext, use, useCallback, useEffect, useState, type ReactNode } from 'react';

import type { Word } from '@/data/words';
import { useAuth } from '@/state/auth';
import { useLanguage } from '@/state/language';
import { supabase } from '@/utils/supabase';
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
};

const MyWordsContext = createContext<Ctx | null>(null);

/** The words the signed-in learner owns, read from `user_words` joined to `words`. */
export function MyWordsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const userId = user?.id;
  // Tagged with the learner they belong to, so a sign-out or account switch never shows someone else's words.
  const [loaded, setLoaded] = useState<Loaded>();

  useEffect(() => {
    if (!userId) return;
    let live = true;
    fetchMyWords(userId).then((next) => {
      if (live) setLoaded((prev) => keepWordsOnError(prev, next));
    });
    return () => {
      live = false;
    };
  }, [userId]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const next = await fetchMyWords(userId);
    setLoaded((prev) => keepWordsOnError(prev, next));
  }, [userId]);

  const current = loaded?.userId === userId ? loaded : undefined;
  const loading = !!userId && !current;
  const error = current?.error ?? null;
  // Words without a language show up whichever language is picked.
  const all = current?.words ?? [];
  const words = all.filter((w) => w.language === null || w.language === language.name);
  const ctx: Ctx = { words, otherLanguageCount: all.length - words.length, collected: words.map((w) => w.id), loading, error, refresh };
  return <MyWordsContext value={ctx}>{children}</MyWordsContext>;
}

export function useMyWords() {
  const ctx = use(MyWordsContext);
  if (!ctx) throw new Error('useMyWords must be used inside <MyWordsProvider>');
  return ctx;
}

type Loaded = { userId: string; words: LoadedWord[]; error: string | null };

async function fetchMyWords(userId: string): Promise<Loaded> {
  const { data, error } = await supabase
    .from('user_words')
    .select(`created_at, words(${WordColumns})`)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .overrideTypes<UserWordRow[], { merge: false }>();
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

/** A failed refresh keeps the words already on screen. */
function keepWordsOnError(prev: Loaded | undefined, next: Loaded): Loaded {
  return next.error && prev?.userId === next.userId ? { ...next, words: prev.words } : next;
}
