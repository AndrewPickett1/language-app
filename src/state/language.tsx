import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import { getLanguage, Languages, type Language, type LanguageCode } from '@/data/languages';
import { useAuth } from '@/state/auth';
import { supabase } from '@/utils/supabase';

type Ctx = {
  language: Language;
  setLanguage: (code: LanguageCode) => void;
  /** Every language the learner has picked, oldest first. Includes the current one. */
  started: LanguageCode[];
  /** True until the signed-in learner's saved language has been read from their profile. */
  loading: boolean;
};

const LanguageContext = createContext<Ctx | null>(null);

/** The language being learned. Starts on the one saved in the learner's `profiles` row and saves each change back to it. */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [code, setCode] = useState<LanguageCode>('ES');
  const [started, setStarted] = useState<LanguageCode[]>(['ES']);
  // The learner whose saved language has been applied, so an account switch reads it again.
  const [loadedFor, setLoadedFor] = useState<string>();

  // Switches straight away, then saves the choice to the learner's profile in the background.
  const setLanguage = (next: LanguageCode) => {
    setCode(next);
    setStarted((prev) => (prev.includes(next) ? prev : [...prev, next]));
    if (userId) {
      saveSelectedLanguage(userId, next).catch((e: Error) => console.warn(`Couldn't save the selected language: ${e.message}`));
    }
  };

  useEffect(() => {
    if (!userId) return;
    let live = true;
    fetchSelectedLanguage(userId).then((saved) => {
      if (!live) return;
      if (saved) {
        setCode(saved);
        setStarted((prev) => (prev.includes(saved) ? prev : [...prev, saved]));
      }
      setLoadedFor(userId);
    });
    return () => {
      live = false;
    };
  }, [userId]);

  const loading = !!userId && loadedFor !== userId;
  return <LanguageContext value={{ language: getLanguage(code), setLanguage, started, loading }}>{children}</LanguageContext>;
}

export function useLanguage() {
  const ctx = use(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
}

type ProfileRow = { language: { name: string } | null };

/** Points the learner's `currently_selected_language` at the `language` row with the same name as `code`. */
async function saveSelectedLanguage(userId: string, code: LanguageCode) {
  const { data: row, error: findError } = await supabase
    .from('language')
    .select('id')
    .ilike('name', getLanguage(code).name)
    .limit(1)
    .maybeSingle();
  if (findError) throw new Error(findError.message);
  if (!row) throw new Error(`There is no ${getLanguage(code).name} row in the language table.`);
  const { data: updated, error } = await supabase
    .from('profiles')
    .update({ currently_selected_language: row.id })
    .eq('id', userId)
    .select('id');
  if (error) throw new Error(error.message);
  // RLS or a missing profile row makes the update match nothing without returning an error.
  if (updated.length === 0) throw new Error('No profiles row was updated.');
}

/** The learner's `currently_selected_language`, matched to a local language by name. Null if unset or unknown. */
async function fetchSelectedLanguage(userId: string): Promise<LanguageCode | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('language:currently_selected_language(name)')
    .eq('id', userId)
    .maybeSingle()
    .overrideTypes<ProfileRow, { merge: false }>();
  if (error || !data?.language) return null;
  const name = data.language.name.toLowerCase();
  return Languages.find((l) => l.name.toLowerCase() === name)?.code ?? null;
}
