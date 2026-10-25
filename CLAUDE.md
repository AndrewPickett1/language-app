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

There is no app test runner. `npm run test:db` runs the database tests in `supabase/tests/` against an in-process Postgres (PGlite).

## Environment

`src/utils/supabase.ts` reads `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from `.env`. The Supabase client persists sessions in AsyncStorage.

## Architecture

**Routing and auth gating.** `src/app/_layout.tsx` is the only navigator: one `Stack` with `headerShown: false`. It holds the splash screen until fonts and the saved Supabase session have loaded, then uses `Stack.Protected` guards to show either `login` or the signed-in screens. Signing in or out flips the guard, so screens don't navigate to or from login themselves. A new screen must be registered inside the right `Stack.Protected` block. Screens draw their own headers with `Screen` and `ScreenHeader` from `src/components/screen.tsx`. Use `goBack(fallback)` there instead of `router.back()` so deep links and web reloads still work.

**State.** Everything app-wide lives in React context providers in `src/state/`, nested in the root layout in this order: Auth → Profile → Language → MyWords → Streak → Lotto → Game → WordFilters. Each exposes a `useX()` hook that throws outside its provider. They use React 19 idioms (`use(Context)`, `<Context value>`). Only the auth session is persisted. `MyWords` (`src/state/my-words.tsx`) reads the learner's words from Supabase (`user_words` joined to `words`) and backs the My words list, Filters, card and Study screens (and the home "to review" count). The home Study tile opens the Study hub (`exercises`), which lists the exercises. Flashcards (`study`), Matching (`match`) and Explore (`explore`) are built, and the other exercises show a "Soon" badge. Explore lists places to learn words for. Only Kitchen (`kitchen`, an illustrated scene) opens a screen so far. Flashcards and Matching both count toward mastery through `recordAnswer`, and finishing either keeps the streak (through `claimBonus`, see Streak below). Lotto pulls draw from the `words` table for the selected language (`fetchDeck` in `src/utils/word-rows.ts`), and Study uses the same deck for wrong answers. The streak and Lotto pulls live on the server (see below). Game progress, claimed streak rewards, profile settings, language and filters are in-memory and reset on reload. The leaderboard is sample data apart from the learner's own row. The home Learn tile opens the level map (`level-map`), which draws sample units and modules from `src/data/level-map.ts` and isn't wired to the `modules` table yet. The leaderboard is reached from Profile.

**Lotto pulls (`src/state/lotto.tsx`).** The server owns pull counts and recharging. The client can read `lotto_state` but never write it: `fetchLottoState()` and `spendLottoPull()` in `src/utils/lotto.ts` call the `get_lotto_state` and `spend_lotto_pull` RPCs (never call `increase_max_lotto_pulls` from the client). State is always set from the RPC response, never counted locally. `clockOffsetMs` (server minus device clock) drives `useLottoCountdown()`, which calls `refresh()` once when it hits zero. Its progress dial assumes `RechargeMs` (3h), which the server doesn't report, so keep it in step with the server's interval. Pulls refresh on sign-in, app foreground, and when Home or Lotto gains focus. Finishing Flashcards or Matching calls `claimBonus(source)`, which hits the `claim_exercise_pull` RPC. That wraps `grant_lotto_pull` (never call it from the client) and grants one pull per finished exercise, with no daily limit. When the tray is already full it returns `full` and grants nothing. When a pull is granted the screen shows `PullEarnedPopup` once the streak popup has closed. A local "pull ready" notification (`src/utils/lotto-notification.ts`, fixed id) is kept at the next recharge, and permission is asked after a pull, not on launch.

**Game loop (`src/state/game.tsx`).** `pull()` is async: it fetches the language's deck from Supabase and draws a weighted-random word using `RarityInfo[r].weight`, preferring uncollected words, then spends the pull on the server, then inserts a new word into `user_words`. A failed deck fetch costs nothing, but a failed word save after the spend does. `spend_lotto_pull` returns a `word_id` that is always null for now, so the client still picks the word. A word counts as mastered after 3 correct Study answers, and it leaves the "to review" count then.

**Streak (`src/state/streak.tsx`).** The server owns the daily streak, kept on the learner's `user_streaks` row (`current_streak`, `best_streak`, `timezone`, `last_active_date`, and `recent_days`, a 7-bit mask of the last 7 days). The client can only read it, through the `get_streak_summary` RPC (`src/utils/streak.ts`), which returns the current and best streak, the learner's local `today`, and the last 7 days, oldest first, as `done`, `missed` or `pending`. A day is the learner's local day, from the timezone the app sends with `set_timezone` on sign-in and app foreground. The client never works out "today" or sends a date. What counts is decided on the server: an action counts when its RPC calls `record_activity(uid)`, and only the first one each local day changes anything. Today that's `spend_lotto_pull` (after a successful spend) and `claim_exercise_pull` (finished Flashcards or Matching). To add a trigger, call `perform public.record_activity(uid);` from that action's RPC in a new migration, add a reason and message to `StreakMessages`, and call `refresh(reason)` after the RPC returns. Never call `record_activity*`, `streak_summary_for` or `user_local_date` from the client. Reset is lazy: a missed day reads as 0 with the best kept, without a write. The streak reloads on sign-in, app foreground and Home focus, and with a reason after a spend (`'lotto'`) or a `claimBonus` (`'study'`). When a reload with a reason finds today newly `done`, `streakPopup` is set to that reason. Lotto renders `StreakPopup` (`src/components/streak-popup.tsx`) once the word card closes, and Flashcards and Matching render it before `PullEarnedPopup`. The migrations live in `supabase/migrations/`, and `npm run test:db` runs `supabase/tests/streaks.test.mjs` against PGlite.

**Content data (`src/data/`).** Static TypeScript modules: `words.ts` (the deck and starter ids), `rarity.ts` (order, colours, stars, pull weights), `languages.ts` (with the TTS locale used by `expo-speech`), `leaderboard.ts`, `level-map.ts` (sample units, module statuses and their positions on the map).

**Theming.** `src/theme/tokens.ts` mirrors the Lingo Lotto design system artifact (https://claude.ai/artifact/G9rR6Gd6tPuNTwdQSZxx6d), so keep token names in sync with it. The app is light-only (`userInterfaceStyle: "light"`). `usePalette()` returns a fixed merge of `Themes.light`, `Bright` and `Fixed`. Get colours from `usePalette()` and spacing from `Space` rather than hardcoding them. `Bright`/`Fixed` colours are for physical objects (cards, capsules, stickers), and text on them uses `onBright`. Render text with `Txt` (`src/components/text.tsx`) and a `Type` variant from `src/theme/fonts.ts` (Fredoka and Nunito).

**Imports.** Use the `@/*` path alias, which points to `src/*` (`@/assets/*` points to `assets/*`).
