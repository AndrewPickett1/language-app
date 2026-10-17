/** What a streak reward looks like on the rewards timeline. */
export type RewardKind = 'pulls' | 'freeze' | 'capsule' | 'hat' | 'badge' | 'golden';

export type StreakReward = {
  /** The streak length that unlocks it. Also its id. */
  day: number;
  kind: RewardKind;
  title: string;
  desc: string;
  /** Badge text on a `pulls` reward, e.g. "+3". */
  amount?: string;
  /** Shell colour of a `capsule` reward (its rarity's colour). */
  cap?: string;
};

/** Streak milestones, in day order. */
export const StreakRewards: StreakReward[] = [
  { day: 3, kind: 'pulls', amount: '+1', title: 'Bonus pull', desc: 'One extra capsule pull, on the house.' },
  { day: 5, kind: 'freeze', title: 'Streak freeze', desc: 'Miss a day without losing your streak. Used automatically.' },
  { day: 7, kind: 'pulls', amount: '+3', title: '3 bonus pulls', desc: 'A full week! Three extra capsule pulls.' },
  { day: 10, kind: 'capsule', cap: '#2ec4f0', title: 'Rare capsule', desc: 'A guaranteed Rare word or better on your next pull.' },
  { day: 15, kind: 'hat', title: 'Party hat', desc: 'A party hat for Lotto to wear on your home screen.' },
  { day: 21, kind: 'freeze', title: '2 streak freezes', desc: 'Two freezes to protect your streak on busy days.' },
  { day: 30, kind: 'capsule', cap: '#a57bff', title: 'Super Rare capsule', desc: 'A guaranteed Super Rare word or better.' },
  { day: 50, kind: 'badge', title: '50-day badge', desc: 'Shows next to your name on the leaderboard.' },
  { day: 75, kind: 'pulls', amount: '+10', title: '10 bonus pulls', desc: 'Ten extra capsule pulls to grow your binder.' },
  { day: 100, kind: 'capsule', cap: '#ff8a24', title: 'Ultra Rare capsule', desc: 'A guaranteed Ultra Rare word. The rarest pull there is.' },
  { day: 150, kind: 'golden', title: 'Golden Lotto', desc: 'Lotto turns gold. Everyone on the leaderboard will see it.' },
  { day: 200, kind: 'pulls', amount: '+20', title: '20 bonus pulls', desc: 'Twenty extra capsule pulls.' },
  { day: 365, kind: 'badge', title: 'One-year badge', desc: 'A full year of learning. Legendary.' },
];
