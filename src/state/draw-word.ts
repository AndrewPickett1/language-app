import { RarityInfo } from '@/data/rarity';
import type { Word } from '@/data/words';

export type PullResult = { word: Word; isNew: boolean };

/**
 * Draws the word that pops out of a capsule. Rarer words are less likely,
 * using `RarityInfo[r].weight`, and uncollected words are preferred until
 * the learner has the whole deck.
 */
export function drawWord(collected: string[], deck: Word[]): PullResult {
  const fresh = deck.filter((w) => !collected.includes(w.id));
  const pool = fresh.length > 0 ? fresh : deck;
  const word = pickWeighted(pool);
  return { word, isNew: !collected.includes(word.id) };
}

function pickWeighted(pool: Word[]): Word {
  const total = pool.reduce((sum, w) => sum + RarityInfo[w.rarity].weight, 0);
  let roll = Math.random() * total;
  for (const w of pool) {
    roll -= RarityInfo[w.rarity].weight;
    if (roll <= 0) return w;
  }
  return pool[pool.length - 1];
}
