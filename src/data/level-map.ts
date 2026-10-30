/**
 * Level map layout for the Learn screen. Modules come from the `modules` table (see `useLevelMap` in
 * `src/utils/modules.ts`). Modules the learner has finished (a `user_modules` row) are done, the first one
 * they haven't is up next, and the rest are locked.
 * Points are on a 390px-wide canvas, one per module, bottom (first) to top (last).
 */

export type ModuleStatus = 'done' | 'current' | 'locked' | 'reward';

export type MapModule = {
  id: string;
  name: string;
  description: string | null;
  wordCount: number;
  /** Short text on the capsule. */
  glyph: string;
  status: ModuleStatus;
  /** 0–3, for done modules. */
  stars?: number;
  x: number;
  y: number;
};

export type MapUnit = {
  number: number;
  title: string;
  /** Height of the unit's map area. */
  height: number;
  modules: MapModule[];
};

/** A `modules` row as the Learn screen reads it, with its `module_words` count. */
export type ModuleRow = {
  id: number;
  unit: number;
  position: number;
  title: string;
  description: string | null;
  words: { count: number }[];
  /** The learner's `user_modules` row, if they've finished it. */
  done: { best_score: number | null }[];
};

/** Stars for a finished module from its best accuracy. */
function starsFor(bestScore: number | null) {
  if (bestScore === null) return 3;
  return bestScore >= 90 ? 3 : bestScore >= 70 ? 2 : 1;
}

const UnitTitles: Record<number, string> = { 1: 'The basics', 2: 'The present' };

/** Side-to-side positions the road winds through, repeated for longer units. */
const Xs = [195, 275, 230, 130, 180];
/** Vertical gap between modules, and the space above the top one and below the bottom one. */
const Step = 132;
const Top = 92;
const Bottom = 90;

/** Groups modules (already in unit and position order) into units and lays each unit out on the map. */
export function buildLevelMap(rows: ModuleRow[]): MapUnit[] {
  const next = rows.find((row) => row.done.length === 0);
  const byUnit = new Map<number, ModuleRow[]>();
  for (const row of rows) byUnit.set(row.unit, [...(byUnit.get(row.unit) ?? []), row]);

  return [...byUnit].map(([number, unitRows]) => {
    const height = Top + Bottom + Step * (unitRows.length - 1);
    return {
      number,
      title: UnitTitles[number] ?? `Unit ${number}`,
      height,
      modules: unitRows.map((row, i) => ({
        id: String(row.id),
        name: row.title,
        description: row.description,
        wordCount: row.words[0]?.count ?? 0,
        glyph: String(i + 1),
        status: row.done.length > 0 ? 'done' : row === next ? 'current' : 'locked',
        stars: row.done.length > 0 ? starsFor(row.done[0].best_score) : undefined,
        x: Xs[i % Xs.length],
        y: height - Bottom - Step * i,
      })),
    };
  });
}

/** Lessons in a unit, leaving out reward capsules. */
export function unitProgress(unit: MapUnit) {
  const lessons = unit.modules.filter((m) => m.status !== 'reward');
  return { done: lessons.filter((m) => m.status === 'done').length, total: lessons.length };
}

/** The unit holding the learner's next module, for the home tile. Undefined when there are no units. */
export function currentUnit(units: MapUnit[]): MapUnit | undefined {
  return units.find((u) => u.modules.some((m) => m.status === 'current')) ?? units[0];
}
