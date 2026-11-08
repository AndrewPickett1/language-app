import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import type { LessonWord } from '@/data/lesson';
import { buildLevelMap, type MapUnit, type ModuleRow, type ModuleType } from '@/data/level-map';
import { useLanguage } from '@/state/language';
import { useLotto } from '@/state/lotto';
import { useMyWords } from '@/state/my-words';
import { useStreak } from '@/state/streak';
import { supabase } from '@/utils/supabase';
import { WordColumns, fetchDeckRows, toWord, type WordRow } from '@/utils/word-rows';
import { sendWordResults, type WordResult } from '@/utils/word-stats';

type Row = ModuleRow & { language: { name: string } | null };

/**
 * Every module for the given language, in map order, matched by name like the language picker does.
 * `done` holds the learner's own `user_modules` row (RLS hides everyone else's), empty until they finish it.
 */
export async function fetchModules(languageName: string): Promise<ModuleRow[]> {
  const { data, error } = await supabase
    .from('modules')
    .select('id, unit, position, title, description, module_type, words:module_words(count), done:user_modules(best_score), language:language_id!inner(name)')
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

export type Lesson = {
  id: string;
  unit: number;
  title: string;
  description: string | null;
  type: ModuleType;
  /** For a Lesson module, which slide lesson it shows (see `ConceptLessons`). */
  lessonKey: string | null;
  words: LessonWord[];
};

type LessonRow = {
  id: number;
  unit: number;
  title: string;
  description: string | null;
  module_type: ModuleType | null;
  lesson_key: string | null;
  words: { position: number; word: WordRow | null }[];
};

export function toLessonWord(row: WordRow): LessonWord {
  return { ...toWord(row), kind: row.word_type };
}

/** One module and its words, in teaching order. A Lesson module has none. */
export async function fetchLesson(id: string): Promise<Lesson> {
  const { data, error } = await supabase
    .from('modules')
    .select(`id, unit, title, description, module_type, lesson_key, words:module_words(position, word:word_id(${WordColumns}))`)
    .eq('id', Number(id))
    .maybeSingle()
    .overrideTypes<LessonRow, { merge: false }>();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("That module doesn't exist.");
  const words = [...data.words].sort((a, b) => a.position - b.position).flatMap((w) => (w.word ? [toLessonWord(w.word)] : []));
  return {
    id: String(data.id),
    unit: data.unit,
    title: data.title,
    description: data.description,
    type: data.module_type ?? 'Exercise',
    lessonKey: data.lesson_key,
    words,
  };
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
  /** How many of the module's words were new to the learner's words. */
  words_added: number;
  /** True only the first time this finishes the module's level (every module in it done). */
  level_completed: boolean;
};

/**
 * Records a finished module in `user_modules` on the server, which also adds the module's words to the
 * learner's words (`user_words`), keeps the streak and grants a pull the first time. `score` is the lesson's accuracy, 0–100. Throws `MODULE_LOCKED` if the module
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

/**
 * Finishing a module from a lesson screen. `finish(score)` records it on the server once, then reloads
 * pulls, the streak and (if any were added) the learner's words, which come from the server rather than
 * being counted here. `earnedPull` turns true when the server granted a pull, only on a first completion.
 * `results` are the lesson's word sightings, sent once the module's words are in `user_words`.
 */
export function useFinishModule(id: string) {
  const lotto = useLotto();
  const streak = useStreak();
  const myWords = useMyWords();
  const [earnedPull, setEarnedPull] = useState(false);
  const claimed = useRef(false);

  const finish = (score: number | null, results: WordResult[] = []) => {
    if (claimed.current) return;
    claimed.current = true;
    completeModule(id, score)
      .then(async (row) => {
        sendWordResults(results);
        await Promise.all([lotto.refresh(), streak.refresh('study'), row.words_added > 0 && myWords.refresh()]);
        if (row.pull_granted) setEarnedPull(true);
      })
      .catch((e: Error) => {
        console.warn(`Couldn't record the finished module: ${e.message}`);
        // Words the learner already owned still get their stats.
        sendWordResults(results);
      });
  };

  return { finish, earnedPull };
}
