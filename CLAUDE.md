# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Lingo Lotto is a gachapon language-learning game (Expo SDK 57, Expo Router, React 19, React Compiler on, typed routes on). Every word you learn pops out of a capsule as a collectible card. Only Spanish has a word deck today.

## Commands

The project uses npm (`package-lock.json`), so use `npx`, not `bunx`.

```bash
npx expo start         # dev server (npm run ios / android / web)
npx expo lint          # lint (eslint-config-expo flat config)
npx tsc --noEmit       # typecheck
```

There is no test runner set up.

## Environment

`src/utils/supabase.ts` reads `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from `.env`. The Supabase client persists sessions in AsyncStorage.

## Architecture

**Routing and auth gating.** `src/app/_layout.tsx` is the only navigator: one `Stack` with `headerShown: false`. It holds the splash screen until fonts and the saved Supabase session have loaded, then uses `Stack.Protected` guards to show either `login` or the signed-in screens. Signing in or out flips the guard, so screens don't navigate to or from login themselves. A new screen must be registered inside the right `Stack.Protected` block. Screens draw their own headers with `Screen` and `ScreenHeader` from `src/components/screen.tsx`. Use `goBack(fallback)` there instead of `router.back()` so deep links and web reloads still work.

**State.** Everything app-wide lives in React context providers in `src/state/`, nested in the root layout in this order: Auth → Profile → Language → MyWords → Streak → Game → WordFilters. Each exposes a `useX()` hook that throws outside its provider. They use React 19 idioms (`use(Context)`, `<Context value>`). Only the auth session is persisted. `MyWords` (`src/state/my-words.tsx`) reads the learner's words from Supabase (`user_words` joined to `words`) and backs the My words list, Filters, card and Study screens (and the home "to review" count). The home Study tile opens the Study hub (`exercises`), which lists the exercises. Flashcards (`study`), Matching (`match`) and Explore (`explore`) are built, and the other exercises show a "Soon" badge. Explore lists places to learn words for. Only Kitchen (`kitchen`, an illustrated scene) opens a screen so far. Flashcards and Matching both count toward mastery through `recordAnswer` and keep the streak with `markPlayed('study')`. Lotto pulls draw from the `words` table for the selected language (`fetchDeck` in `src/utils/word-rows.ts`), and Study uses the same deck for wrong answers. The current and best streak are read from the learner's `profiles` row (`current_streak`, `best_streak`) on sign-in but not saved back. Game progress, the rest of the streak state, profile settings, language and filters are in-memory and reset on reload. The leaderboard is sample data apart from the learner's own row.

**Game loop (`src/state/game.tsx`).** Pulls refill one every `RefillMs` (3h) up to `MaxPulls`. `settle()` applies refills lazily from `nextPullAt` when `pull()` or `refill()` runs. There is no timer. `pull()` is async: it fetches the language's deck from Supabase, then draws a weighted-random word using `RarityInfo[r].weight`, preferring uncollected words. A new word is inserted into `user_words` before the pull is spent, so a failed save doesn't use up a pull. A word counts as mastered after 3 correct Study answers, and it leaves the "to review" count then.

**Streak (`src/state/streak.tsx`).** `markPlayed(reason)` keeps the daily streak: the first call on a local calendar day adds one (or restarts at 1 after a missed day) and sets `streakPopup` to the reason. Later calls that day do nothing. Today a pull (inside `pull()`) and a finished Study session count. To add a trigger, add a reason and its message to `StreakMessages` and call `markPlayed`. Each screen that can trigger it renders `StreakPopup` (`src/components/streak-popup.tsx`) at the right moment and closes it with `closeStreakPopup`.

**Content data (`src/data/`).** Static TypeScript modules: `words.ts` (the deck and starter ids), `rarity.ts` (order, colours, stars, pull weights), `languages.ts` (with the TTS locale used by `expo-speech`), `leaderboard.ts`.

**Theming.** `src/theme/tokens.ts` mirrors the Lingo Lotto design system artifact (https://claude.ai/artifact/G9rR6Gd6tPuNTwdQSZxx6d), so keep token names in sync with it. The app is light-only (`userInterfaceStyle: "light"`). `usePalette()` returns a fixed merge of `Themes.light`, `Bright` and `Fixed`. Get colours from `usePalette()` and spacing from `Space` rather than hardcoding them. `Bright`/`Fixed` colours are for physical objects (cards, capsules, stickers), and text on them uses `onBright`. Render text with `Txt` (`src/components/text.tsx`) and a `Type` variant from `src/theme/fonts.ts` (Fredoka and Nunito).

**Imports.** Use the `@/*` path alias, which points to `src/*` (`@/assets/*` points to `assets/*`).
