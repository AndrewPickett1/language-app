import { createContext, use, useState, type ReactNode } from 'react';

import { RarityOrder, type Rarity } from '@/data/rarity';
import { bareWord, type Word, type WordType } from '@/data/words';

export type GenderFilter = 'any' | 'M' | 'F';
export type WordSort = 'rarity' | 'az' | 'new';

export type WordFilters = {
  /** Empty means every type. */
  types: WordType[];
  /** Empty means every rarity. */
  rarities: Rarity[];
  gender: GenderFilter;
  sort: WordSort;
};

export const NoFilters: WordFilters = { types: [], rarities: [], gender: 'any', sort: 'rarity' };

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
  if (f.sort === 'az') return rows.sort((a, b) => bareWord(a.word).localeCompare(bareWord(b.word), 'es'));
  if (f.sort === 'new') return rows.sort((a, b) => collected.indexOf(b.id) - collected.indexOf(a.id));
  return rows.sort((a, b) => RarityOrder.indexOf(a.rarity) - RarityOrder.indexOf(b.rarity));
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
