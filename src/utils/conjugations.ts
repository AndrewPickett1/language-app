import { useEffect, useState } from 'react';

import { PersonCodes, Tenses, splitForm, type Conjugation, type PersonCode } from '@/data/conjugations';
import type { Word } from '@/data/words';
import { supabase } from '@/utils/supabase';

type ConjugationRow = { person: string; tense: string; form: string };

// Conjugations don't change while the app runs, so each verb is fetched once. A failed fetch is dropped so it can retry.
const cache = new Map<string, Promise<Conjugation | undefined>>();

/** The verb's rows in `verb_conjugations`, or undefined when it has none (or isn't a database word). */
export function fetchConjugation(word: Word): Promise<Conjugation | undefined> {
  let pending = cache.get(word.id);
  if (!pending) {
    pending = load(word);
    pending.catch(() => cache.delete(word.id));
    cache.set(word.id, pending);
  }
  return pending;
}

async function load(word: Word): Promise<Conjugation | undefined> {
  // Words from the local deck have text ids and no rows.
  if (!/^\d+$/.test(word.id)) return undefined;
  const { data, error } = await supabase
    .from('verb_conjugations')
    .select('person, tense, form')
    .eq('word_id', Number(word.id))
    .overrideTypes<ConjugationRow[], { merge: false }>();
  if (error) throw new Error(error.message);

  const forms: Conjugation['forms'] = {};
  for (const row of data) {
    const tense = Tenses.find((t) => t.id === row.tense.trim().toLowerCase())?.id;
    const slot = PersonCodes.indexOf(row.person as PersonCode);
    if (!tense || slot < 0) continue;
    (forms[tense] ??= Array.from({ length: PersonCodes.length }, () => undefined))[slot] = splitForm(row.form, word.word);
  }
  return Object.keys(forms).length > 0 ? { forms } : undefined;
}

/** The verb's stored conjugation, undefined while loading, when it has none, or for a non-verb. */
export function useConjugation(word: Word): Conjugation | undefined {
  const verb = word.type === 'Verb';
  const [loaded, setLoaded] = useState<{ id: string; conjugation: Conjugation | undefined }>();

  useEffect(() => {
    if (!verb) return;
    let live = true;
    fetchConjugation(word).then(
      (conjugation) => {
        if (live) setLoaded({ id: word.id, conjugation });
      },
      (e: Error) => console.warn(`Couldn't load the conjugation of ${word.word}: ${e.message}`)
    );
    return () => {
      live = false;
    };
  }, [verb, word]);

  return verb && loaded?.id === word.id ? loaded.conjugation : undefined;
}
