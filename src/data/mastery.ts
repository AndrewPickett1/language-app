import { Bright, Fixed, Themes } from '@/theme/tokens';
import type { WordProgress } from '@/utils/word-progress';

/**
 * How well the learner knows a word. The server works it out from strength (0–100, fading over time):
 * new (never tested), learning (<40), familiar (40–69), strong (70+), mastered (passed all four mastery
 * rules, for good) and rusty (mastered, but faded below 60, which keeps the badge and asks for a review).
 */
export type Stage = 'new' | 'learning' | 'familiar' | 'strong' | 'mastered' | 'rusty';

/** The order of the stage filter chips on My words. */
export const StageOrder: Stage[] = ['mastered', 'strong', 'familiar', 'learning', 'rusty', 'new'];

/** Rusty's muted greys aren't design-system tokens; they only mean "faded" here. */
const Rust = { ring: '#b3a6c9', soft: '#e9e1d3' } as const;

type StageMeta = {
  name: string;
  /** The progress ring and strength bar. Null for new words, which show an empty track. */
  ring: string | null;
  /** The stage chip's fill. */
  chip: string;
  /** Inside the ring on My words. */
  inner: string;
};

export const StageInfo: Record<Stage, StageMeta> = {
  new: { name: 'New', ring: null, chip: Fixed.white, inner: Fixed.white },
  learning: { name: 'Learning', ring: Bright.tangerine, chip: Themes.light.sunshineSoft, inner: Fixed.white },
  familiar: { name: 'Familiar', ring: Bright.sky, chip: Themes.light.skySoft, inner: Fixed.white },
  strong: { name: 'Strong', ring: Bright.leaf, chip: Themes.light.leafSoft, inner: Fixed.white },
  mastered: { name: 'Mastered', ring: Bright.sunshine, chip: Bright.sunshine, inner: Themes.light.sunshineSoft },
  rusty: { name: 'Rusty', ring: Rust.ring, chip: Rust.soft, inner: Rust.soft },
};

/** Mastered and rusty words both hold the Mastered badge. */
export function hasMastered(stage: Stage) {
  return stage === 'mastered' || stage === 'rusty';
}

/** The animated holo foil on a mastered card, and the still, muted foil on a rusty one. */
export const HoloColors = ['#ff9ad5', '#ffe27a', '#8ff0c8', '#9fd8ff', '#c7a8ff', '#ff9ad5', '#ffe27a'];
export const RustyColors = ['#d8cfe2', '#e8e0cc', '#d5e2da', '#dcd6e8'];

/** Strength bar tick marks: where familiar and strong start, and the mastery line (drawn bold). */
export const StrengthTicks = [40, 70, 90];

/** The mastery rules' targets. The server checks them; these only draw the progress toward them. */
export const MasteryTargets = { strength: 90, days: 3, hard: 2, recent: 7 } as const;

/** The last answers (up to 8), oldest first, true for right. Bit 0 of `mask` is the newest answer. */
export function decodeRecent(mask: number, count: number): boolean[] {
  return Array.from({ length: count }, (_, i) => ((mask >> (count - 1 - i)) & 1) === 1);
}

/** Right answers among the last 8, for the "7 of your last 8" rule. */
export function recentRight(mask: number): number {
  let n = 0;
  for (let m = mask & 255; m; m >>= 1) n += m & 1;
  return n;
}

export type MasteryRule = {
  /** On the road to mastery. */
  label: string;
  /** On the "rules passed" pills, with the learner's real numbers. */
  passed: string;
  /** Said when it's the only rule left. */
  lastStep: string;
  have: number;
  need: number;
  met: boolean;
};

/** The four mastery rules and how far the word has got with each. */
export function masteryRules(w: WordProgress): MasteryRule[] {
  const right = recentRight(w.recentResults);
  return [
    { label: 'Strength 90 or more', passed: `Strength ${w.strength}`, lastStep: 'get its strength to 90', have: w.strength, need: MasteryTargets.strength },
    { label: 'Right on 3 different days', passed: `${w.daysCorrect} days`, lastStep: 'get it right on one more day', have: w.daysCorrect, need: MasteryTargets.days },
    { label: 'Typed or built it twice', passed: `Typed ${w.hardCorrect}×`, lastStep: 'type or build it once more', have: w.hardCorrect, need: MasteryTargets.hard },
    { label: '7 of your last 8 right', passed: `${right} of 8`, lastStep: 'get a few more right in a row', have: right, need: MasteryTargets.recent },
  ].map((r) => ({ ...r, met: r.have >= r.need }));
}

/** The line under a word's progress ring on My words. */
export function stageSubLabel(w: Pick<WordProgress, 'stage' | 'strength'>): string {
  if (w.stage === 'new') return 'not tested yet';
  if (w.stage === 'rusty') return 'review me';
  if (w.stage === 'strong' && w.strength >= MasteryTargets.strength) return 'almost mastered';
  return `${w.strength} / 100`;
}

/** What a screen reader says for a ring or meter: "Strong, strength 76 of 100". */
export function stageA11y(w: Pick<WordProgress, 'stage' | 'strength'>): string {
  const name = StageInfo[w.stage].name;
  return w.stage === 'new' ? `${name}, not tested yet` : `${name}, strength ${w.strength} of 100`;
}

/** The nudge under the road to mastery. */
export function masteryTip(rules: MasteryRule[]): string {
  const left = rules.filter((r) => !r.met);
  if (left.length === 1) return `One step left: ${left[0].lastStep} to master it!`;
  if (left.length === 0) return 'Answer it once more to master it!';
  return 'Keep practising, and come back tomorrow. A right answer on a new day counts extra.';
}

const DayMs = 24 * 60 * 60 * 1000;

/** "Next review tomorrow", "Next review in 3 days", or "Ready to review" once it's due. */
export function reviewCaption(nextReviewAt: Date | null, now = Date.now()): string | null {
  if (!nextReviewAt) return null;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const due = new Date(nextReviewAt);
  due.setHours(0, 0, 0, 0);
  const days = Math.round((due.getTime() - today.getTime()) / DayMs);
  if (nextReviewAt.getTime() <= now || days <= 0) return 'Ready to review';
  if (days === 1) return 'Next review tomorrow';
  if (days >= 14) return `Next review in ${Math.round(days / 7)} weeks`;
  return `Next review in ${days} days`;
}
