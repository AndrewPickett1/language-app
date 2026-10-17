# Lingo Lotto

A gachapon language-learning game: every word you learn pops out of a capsule as a collectible card.

Built with Expo Router. The look follows the Lingo Lotto design system; its tokens are mirrored in `src/theme/tokens.ts`.

## Screens

- `src/app/index.tsx`: Home (streak, daily pull, My words, Study)
- `src/app/lotto.tsx`: the capsule machine. Drag or tap the handle to pull.
- `src/app/words.tsx`: your collection
- `src/app/card/[id].tsx`: a word card
- `src/app/study.tsx`: a 10-question quiz

## Run

```bash
npm install
npx expo start
```
