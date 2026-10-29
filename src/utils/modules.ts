import { useEffect, useState } from 'react';

import type { LessonWord } from '@/data/lesson';
import { buildLevelMap, type MapUnit, type ModuleRow } from '@/data/level-map';
import { useLanguage } from '@/state/language';
import { supabase } from '@/utils/supabase';
import { WordColumns, fetchDeckRows, toWord, type WordRow } from '@/utils/word-rows';

type Row = ModuleRow & { language: { name: string } | null };

/** Every module for the given language, in map order, matched by name like the language picker does. */
export async function fetchModules(languageName: string): Promise<ModuleRow[]> {
  const { data, error } = await supabase
    .from('modules')
    .select('id, unit, position, title, description, words:module_words(count), language:language_id!inner(name)')
    .ilike('language.name', languageName)
    .order('unit')
    .order('position')
    .overrideTypes<Row[], { merge: false }>();
  if (error) throw new Error(error.message);
  return data.map(({ language: _, ...row }) => row);
}

type Loaded = { language: string; units: MapUnit[]; error: string | null };

/** The current language's level map from the `modules` table. `units` is undefined while it loads. */
export function useLevelMap() {
  const { language } = useLanguage();
  const [loaded, setLoaded] = useState<Loaded>();

  useEffect(() => {
    let live = true;
    fetchModules(language.name)
      .then((rows) => ({ language: language.name, units: buildLevelMap(rows), error: null }))
      .catch((e: Error) => ({ language: language.name, units: [], error: e.message }))
      .then((next) => {
        if (live) setLoaded(next);
      });
    return () => {
      live = false;
    };
  }, [language.name]);

  const current = loaded?.language === language.name ? loaded : undefined;
  return { units: current?.units, error: current?.error ?? null };
}

export type Lesson = { id: string; unit: number; title: string; description: string | null; words: LessonWord[] };

type LessonRow = {
  id: number;
  unit: number;
  title: string;
  description: string | null;
  words: { position: number; word: WordRow | null }[];
};

export function toLessonWord(row: WordRow): LessonWord {
  return { ...toWord(row), kind: row.word_type };
}

/** One module and its words, in teaching order. */
export async function fetchLesson(id: string): Promise<Lesson> {
  const { data, error } = await supabase
    .from('modules')
    .select(`id, unit, title, description, words:module_words(position, word:word_id(${WordColumns}))`)
    .eq('id', Number(id))
    .maybeSingle()
    .overrideTypes<LessonRow, { merge: false }>();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("That module doesn't exist.");
  const words = [...data.words].sort((a, b) => a.position - b.position).flatMap((w) => (w.word ? [toLessonWord(w.word)] : []));
  return { id: String(data.id), unit: data.unit, title: data.title, description: data.description, words };
}

/** The language's whole deck with each word's kind, for wrong answers and gender practice. */
export async function fetchLessonDeck(languageName: string): Promise<LessonWord[]> {
  return (await fetchDeckRows(languageName)).map(toLessonWord);
}
