/**
 * Lingo Lotto design tokens, mirrored from the Lingo Lotto design system
 * (https://claude.ai/artifact/G9rR6Gd6tPuNTwdQSZxx6d). Keep names in sync with it.
 */

/** Bright fills. Same in both themes; text on them is always `onBright`. */
export const Bright = {
  pink: '#ff4f9a',
  sunshine: '#ffcb2e',
  tangerine: '#ff8a24',
  leaf: '#3dd68c',
  sky: '#2ec4f0',
  grape: '#a57bff',
  stone: '#b3adc0',
  cherry: '#ff5a5a',
  locked: '#cfc4e3',
} as const;

/** Physical objects (cards, capsules) don't change with the theme. */
export const Fixed = {
  paper: '#fff6e5',
  onBright: '#2a1b4a',
  onBrightMuted: '#5e4e80',
  white: '#ffffff',
} as const;

export const Themes = {
  light: {
    surface: '#fff6e5',
    surfaceRaised: '#ffffff',
    surfaceSunken: '#ffe9c2',
    ink: '#2a1b4a',
    inkMuted: '#6b5a8a',
    line: '#2a1b4a',
    focus: '#7a3ff0',
    pinkSoft: '#ffd3e6',
    sunshineSoft: '#fff0b8',
    leafSoft: '#cdf7e1',
    skySoft: '#c9f1ff',
    grapeSoft: '#e8dcff',
    tangerineSoft: '#ffdcbc',
    stoneSoft: '#e8e5ee',
  },
  dark: {
    surface: '#1e1438',
    surfaceRaised: '#2b1f4d',
    surfaceSunken: '#160e2b',
    ink: '#fff6e5',
    inkMuted: '#b9a9d9',
    line: '#0e0820',
    focus: '#a57bff',
    pinkSoft: '#5a2350',
    sunshineSoft: '#5a4518',
    leafSoft: '#174a38',
    skySoft: '#17435a',
    grapeSoft: '#3a2a6e',
    tangerineSoft: '#5a3418',
    stoneSoft: '#3a3546',
  },
} as const;

export type ThemeName = keyof typeof Themes;
export type Palette = (typeof Themes)[ThemeName] & typeof Bright & typeof Fixed;

export const Space = { 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32, 12: 48 } as const;

export const Radius = { sm: 12, md: 20, lg: 28, pill: 999 } as const;

export const Stroke = { 1: 2, 2: 3, 3: 4 } as const;

/** `shadow-pop`: the only shadow. A hard, unblurred offset in the line colour. */
export function shadowPop(line: string, offset = 4) {
  return `0px ${offset}px 0px ${line}`;
}

/** Overshoot curve for things that grow. */
export const Bounce = [0.34, 1.56, 0.64, 1] as const;
