/**
 * Sample level map for the Learn screen. Not wired to the server yet: modules and progress are made up.
 * Points are on a 390px-wide canvas, one per module, bottom (first) to top (last).
 */

export type ModuleStatus = 'done' | 'current' | 'locked' | 'reward';

export type MapModule = {
  id: string;
  name: string;
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

export const LevelMap: MapUnit[] = [
  {
    number: 1,
    title: 'Lo básico',
    height: 710,
    modules: [
      { id: 'sino', name: 'Sí o no', glyph: 'S/N', status: 'done', stars: 3, x: 195, y: 620 },
      { id: 'hola', name: '¡Hola!', glyph: 'Hola', status: 'done', stars: 2, x: 275, y: 488 },
      { id: 'ser', name: 'Ser', glyph: 'Ser', status: 'current', x: 230, y: 356 },
      { id: 'bonus', name: 'Bonus pull', glyph: '?', status: 'reward', x: 130, y: 224 },
      { id: 'tener', name: 'Tener', glyph: 'Tener', status: 'locked', x: 180, y: 92 },
    ],
  },
  {
    number: 2,
    title: 'El presente',
    height: 580,
    modules: [
      { id: 'articles', name: 'El, la, los', glyph: 'el/la', status: 'locked', x: 195, y: 500 },
      { id: 'ar', name: 'Verbos en -ar', glyph: '-ar', status: 'locked', x: 270, y: 368 },
      { id: 'questions', name: 'Preguntas', glyph: '¿Qué?', status: 'locked', x: 220, y: 236 },
      { id: 'review', name: 'Unit check', glyph: 'Quiz', status: 'locked', x: 150, y: 104 },
    ],
  },
];

/** Lessons in a unit, leaving out reward capsules. */
export function unitProgress(unit: MapUnit) {
  const lessons = unit.modules.filter((m) => m.status !== 'reward');
  return { done: lessons.filter((m) => m.status === 'done').length, total: lessons.length };
}

/** The unit holding the learner's next module, for the home tile. */
export function currentUnit() {
  return LevelMap.find((u) => u.modules.some((m) => m.status === 'current')) ?? LevelMap[0];
}
