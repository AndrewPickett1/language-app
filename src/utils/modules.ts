import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { LessonWord } from '@/data/lesson';
import { buildLevelMap, type MapUnit, type ModuleRow } from '@/data/level-map';
import { useLanguage } from '@/state/language';
import { supabase } from '@/utils/supabase';
import { WordColumns, fetchDeckRows, toWord, type WordRow } from '@/utils/word-rows';

type Row = ModuleRow & { language: { name: string } | null };

/**
 * Every module for the given language, in map order, matched by name like the language picker does.
 * `done` holds the learner's own `user_modules` row (RLS hides everyone else's), empty until they finish it.
 */
export async function fetchModules(languageName: string): Promise<ModuleRow[]> {
  const { data, error } = await supabase
    .from('modules')
    .select('id, unit, position, title, description, words:module_words(count), done:user_modules(best_score), language:language_id!inner(name)')
    .ilike('language.name', languageName)
    .order('unit')
    .order('position')
    .overrideTypes<Row[], { merge: false }>();
  if (error) throw new Error(error.message);
  return data.map(({ language: _, ...row }) => row);
}

type Loaded = { language: string; units: MapUnit[]; error: string | null };

/** The current language's level map from the `modules` table. `units` is undefined while it first loads. */
export function useLevelMap() {
  const { language } = useLanguage();
  const [loaded, setLoaded] = useState<Loaded>();

  // Loads on focus, so a module finished in a lesson shows as done on the way back.
  useFocusEffect(
    useCallback(() => {
      let live = true;
      fetchModules(language.name).then(
        (rows) => {
          if (live) setLoaded({ language: language.name, units: buildLevelMap(rows), error: null });
        },
        (e: Error) => {
          // A failed reload keeps the map already on screen.
          if (live) setLoaded((prev) => (prev?.language === language.name ? prev : { language: language.name, units: [], error: e.message }));
        }
      );
      return () => {
        live = false;
      };
    }, [language.name])
  );

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

/** What `complete_module` returns. `pull_granted` is only ever true on a module's first completion. */
export type ModuleCompletion = {
  first_completion: boolean;
  times_completed: number;
  best_score: number | null;
  pull_granted: boolean;
  current_lotto_pulls: number;
  max_lotto_pulls: number;
  next_pull_at: string | null;
};

/**
 * Records a finished module in `user_modules` on the server, which also keeps the streak and grants a
 * pull the first time. `score` is the lesson's accuracy, 0–100. Throws `MODULE_LOCKED` if the module
 * before it isn't done yet.
 */
export async function completeModule(id: string, score: number | null): Promise<ModuleCompletion> {
  const { data, error } = await supabase
    .rpc('complete_module', { p_module_id: Number(id), p_score: score })
    .single()
    .overrideTypes<ModuleCompletion, { merge: false }>();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('complete_module returned nothing.');
  return data;
}
