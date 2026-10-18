import { createContext, use, useState, type ReactNode } from 'react';

import { RarityOrder, type Rarity } from '@/data/rarity';
import { bareWord, type Word, type WordType } from '@/data/words';

export type GenderFilter = 'any' | 'M' | 'F';
export type WordSort = 'rarity' | 'az' | 'new';
export type WordColumn = 'word' | 'meaning' | 'type' | 'gender';
/** A sort picked by tapping a column header in the list. */
export type ColumnSort = { column: WordColumn; dir: 'asc' | 'desc' };

export type WordFilters = {
  /** Empty means every type. */
  types: WordType[];
  /** Empty means every rarity. */
  rarities: Rarity[];
  gender: GenderFilter;
  sort: WordSort;
  /** Set by the column headers; when present it wins over `sort`. */
  column: ColumnSort | null;
};

export const NoFilters: WordFilters = { types: [], rarities: [], gender: 'any', sort: 'rarity', column: null };

/** True when the filters hide any words (sorting alone doesn't count). */
export function isFiltered(f: WordFilters) {
  return f.types.length > 0 || f.rarities.length > 0 || f.gender !== 'any';
}

/** Filters and sorts `words`. `collected` is the ids in the order they were won, for "Newest". */
export function applyWordFilters(words: Word[], f: WordFilters, collected: string[]): Word[] {
  const rows = words.filter(
    (w) =>
      (f.types.length === 0 || f.types.includes(w.type)) &&
      (f.rarities.length === 0 || f.rarities.includes(w.rarity)) &&
      (f.gender === 'any' || w.gender === f.gender)
  );
  if (f.column) {
    const { column, dir } = f.column;
    // Words with no gender stay at the bottom whichever way the column is sorted.
    if (column === 'gender') {
      const sign = dir === 'asc' ? 1 : -1;
      return rows.sort((a, b) => (a.gender ? 0 : 1) - (b.gender ? 0 : 1) || sign * compareColumn(column, a, b));
    }
    return rows.sort((a, b) => (dir === 'asc' ? 1 : -1) * compareColumn(column, a, b));
  }
  if (f.sort === 'az') return rows.sort((a, b) => bareWord(a.word).localeCompare(bareWord(b.word), 'es'));
  if (f.sort === 'new') return rows.sort((a, b) => collected.indexOf(b.id) - collected.indexOf(a.id));
  return rows.sort((a, b) => RarityOrder.indexOf(a.rarity) - RarityOrder.indexOf(b.rarity));
}

function compareColumn(column: WordColumn, a: Word, b: Word): number {
  const byWord = bareWord(a.word).localeCompare(bareWord(b.word), 'es');
  if (column === 'meaning') return a.meaning.replace(/^the /, '').localeCompare(b.meaning.replace(/^the /, ''), 'en');
  if (column === 'type') return a.type.localeCompare(b.type) || byWord;
  if (column === 'gender') return (a.gender ?? '').localeCompare(b.gender ?? '') || byWord;
  return byWord;
}

/** Tapping a header sorts by it A→Z; tapping the same header again flips the direction. */
export function nextColumnSort(current: ColumnSort | null, column: WordColumn): ColumnSort {
  return { column, dir: current?.column === column && current.dir === 'asc' ? 'desc' : 'asc' };
}

type Ctx = { filters: WordFilters; setFilters: (f: WordFilters) => void };

const WordFiltersContext = createContext<Ctx | null>(null);

/** The "My words" filters, shared by the list and the Filters screen. */
export function WordFiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState(NoFilters);
  return <WordFiltersContext value={{ filters, setFilters }}>{children}</WordFiltersContext>;
}

export function useWordFilters() {
  const ctx = use(WordFiltersContext);
  if (!ctx) throw new Error('useWordFilters must be used inside <WordFiltersProvider>');
  return ctx;
}
