/**
 * Level map layout for the Learn screen. Modules come from the `modules` table, grouped by their level from
 * `levels` (see `useLevelMap` in `src/utils/modules.ts`). Modules the learner has finished (a `user_modules` row)
 * are done, the first one they haven't is up next, and the rest are locked.
 * Points are on a 390px-wide canvas, one per module, bottom (first) to top (last).
 */

export type ModuleStatus = 'done' | 'current' | 'locked' | 'reward';

/** Exercise modules teach words. Lesson modules teach a concept through slides and have no words. */
export type ModuleType = 'Exercise' | 'Lesson';

export type MapModule = {
  id: string;
  name: string;
  description: string | null;
  type: ModuleType;
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
  /** The learner has a `user_levels` row: they finished every module in it at some point. */
  completed: boolean;
  /** Height of the unit's map area. */
  height: number;
  modules: MapModule[];
};

/** A `modules` row as the Learn screen reads it, with its `module_words` count. */
export type ModuleRow = {
  id: number;
  position: number;
  /** The module's `levels` row, with the learner's `user_levels` row once they've finished it. */
  level: { number: number; title: string; done: { completed_at: string }[] };
  title: string;
  description: string | null;
  /** Null counts as Exercise, the column's default. */
  module_type: ModuleType | null;
  words: { count: number }[];
  /** The learner's `user_modules` row, if they've finished it. */
  done: { best_score: number | null }[];
};

/** Stars for a finished module from its best accuracy. */
function starsFor(bestScore: number | null) {
  if (bestScore === null) return 3;
  return bestScore >= 90 ? 3 : bestScore >= 70 ? 2 : 1;
}

/** Side-to-side positions the road winds through, repeated for longer units. */
const Xs = [195, 275, 230, 130, 180];
/** Vertical gap between modules, and the space above the top one and below the bottom one. */
const Step = 132;
const Top = 92;
const Bottom = 90;

/** Groups modules into their levels, in level and position order, and lays each level out on the map. */
export function buildLevelMap(rows: ModuleRow[]): MapUnit[] {
  const sorted = [...rows].sort((a, b) => a.level.number - b.level.number || a.position - b.position);
  const next = sorted.find((row) => row.done.length === 0);
  const byUnit = new Map<number, ModuleRow[]>();
  for (const row of sorted) byUnit.set(row.level.number, [...(byUnit.get(row.level.number) ?? []), row]);

  return [...byUnit].map(([number, unitRows]) => {
    const height = Top + Bottom + Step * (unitRows.length - 1);
    const { level } = unitRows[0];
    return {
      number,
      title: level.title,
      completed: level.done.length > 0,
      height,
      modules: unitRows.map((row, i) => ({
        id: String(row.id),
        name: row.title,
        description: row.description,
        type: row.module_type ?? 'Exercise',
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

/** Stars earned across a unit's finished modules, out of three per module. */
export function unitStars(unit: MapUnit) {
  const lessons = unit.modules.filter((m) => m.status !== 'reward');
  return { stars: lessons.reduce((sum, m) => sum + (m.stars ?? 0), 0), max: lessons.length * 3 };
}

/** Units the learner can open: finished ones, the one with their next module, and always the first. */
export function openUnits(units: MapUnit[]): MapUnit[] {
  return units.filter((u, i) => i === 0 || u.completed || u.modules.some((m) => m.status === 'done' || m.status === 'current'));
}

/** The unit holding the learner's next module, for the home tile. Undefined when there are no units. */
export function currentUnit(units: MapUnit[]): MapUnit | undefined {
  return units.find((u) => u.modules.some((m) => m.status === 'current')) ?? units[0];
}
