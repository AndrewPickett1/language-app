/**
 * Leaderboard boards and sample players. There's no leaderboard backend yet, so everyone but
 * the learner is sample data; the learner's row uses their real initials, streak and binder.
 */

export type BoardKey = 'all' | 'week' | 'friends';

export const Boards: Record<BoardKey, { label: string; subtitle: string }> = {
  all: { label: 'All time', subtitle: 'Total words collected' },
  week: { label: 'This week', subtitle: 'Words collected · resets Sunday' },
  friends: { label: 'Friends', subtitle: 'You and the people you follow' },
};

export const BoardOrder: BoardKey[] = ['all', 'week', 'friends'];

type Player = {
  name: string;
  initials: string;
  streak: number;
  /** Avatar fill. A physical sticker, so it doesn't change with the theme. */
  avatar: string;
  allTime: number;
  thisWeek: number;
  friend: boolean;
};

const SamplePlayers: Player[] = [
  { name: 'Mia', initials: 'MI', streak: 41, avatar: '#2ec4f0', allTime: 1204, thisWeek: 148, friend: false },
  { name: 'Kenji', initials: 'KE', streak: 33, avatar: '#3dd68c', allTime: 987, thisWeek: 131, friend: true },
  { name: 'Sofía', initials: 'SO', streak: 28, avatar: '#ff4f9a', allTime: 910, thisWeek: 120, friend: false },
  { name: 'Leo', initials: 'LE', streak: 19, avatar: '#ffcb2e', allTime: 862, thisWeek: 104, friend: true },
  { name: 'Priya', initials: 'PR', streak: 22, avatar: '#ff8a24', allTime: 701, thisWeek: 97, friend: false },
  { name: 'Omar', initials: 'OM', streak: 9, avatar: '#a57bff', allTime: 655, thisWeek: 91, friend: false },
  { name: 'Lena', initials: 'LN', streak: 7, avatar: '#ffd3e6', allTime: 540, thisWeek: 72, friend: true },
  { name: 'Tomás', initials: 'TO', streak: 15, avatar: '#cdf7e1', allTime: 498, thisWeek: 65, friend: false },
  { name: 'Ana', initials: 'AN', streak: 4, avatar: '#fff0b8', allTime: 377, thisWeek: 51, friend: true },
];

/** We don't track words per week yet, so the learner's weekly count is a stand-in. */
const SampleWeekForMe = 86;

export type Me = { initials: string; streak: number; collected: number };

export type Ranked = { rank: number; name: string; initials: string; streak: number; avatar: string; score: number; me: boolean };

export function rankBoard(board: BoardKey, me: Me): Ranked[] {
  const you: Player = {
    name: 'You',
    initials: me.initials,
    streak: me.streak,
    avatar: '#c9f1ff',
    allTime: me.collected,
    thisWeek: SampleWeekForMe,
    friend: true,
  };
  const players = [...SamplePlayers, you].filter((pl) => board !== 'friends' || pl.friend);
  const score = (pl: Player) => (board === 'all' ? pl.allTime : pl.thisWeek);
  return players
    .sort((a, b) => score(b) - score(a))
    .map((pl, i) => ({ rank: i + 1, name: pl.name, initials: pl.initials, streak: pl.streak, avatar: pl.avatar, score: score(pl), me: pl === you }));
}
