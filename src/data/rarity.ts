import { Bright, Themes } from '@/theme/tokens';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'superRare' | 'ultraRare';

export const RarityOrder: Rarity[] = ['ultraRare', 'superRare', 'rare', 'uncommon', 'common'];

type RarityMeta = {
  name: string;
  stars: number;
  color: string;
  /** Soft tint key for panels behind a card of this rarity. */
  soft: keyof (typeof Themes)['light'];
  /** Relative chance of coming out of a capsule. */
  weight: number;
};

/** Rarity is always colour + stars + word. Grey → green → blue → purple → orange. */
export const RarityInfo: Record<Rarity, RarityMeta> = {
  common: { name: 'Common', stars: 1, color: Bright.stone, soft: 'stoneSoft', weight: 45 },
  uncommon: { name: 'Uncommon', stars: 2, color: Bright.leaf, soft: 'leafSoft', weight: 28 },
  rare: { name: 'Rare', stars: 3, color: Bright.sky, soft: 'skySoft', weight: 15 },
  superRare: { name: 'Super Rare', stars: 4, color: Bright.grape, soft: 'grapeSoft', weight: 9 },
  ultraRare: { name: 'Ultra Rare', stars: 5, color: Bright.tangerine, soft: 'tangerineSoft', weight: 3 },
};

export function starString(rarity: Rarity) {
  return '★'.repeat(RarityInfo[rarity].stars);
}
