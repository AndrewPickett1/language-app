import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { Screen, ScreenHeader } from '@/components/screen';
import { Txt } from '@/components/text';
import { BoardOrder, Boards, rankBoard, type BoardKey, type Ranked } from '@/data/leaderboard';
import { useGame } from '@/state/game';
import { useStreak } from '@/state/streak';
import { useProfile } from '@/state/profile';
import { Font } from '@/theme/fonts';
import { Radius, Space, Stroke, shadowPop } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';

/** Podium rows are physical medals, so their colours are fixed across themes. */
const Medals: Record<number, { fill: string; medal: string; ribbon: string }> = {
  1: { fill: '#ffcb2e', medal: '#fff0b8', ribbon: '#ff4f9a' },
  2: { fill: '#c9f1ff', medal: '#ffffff', ribbon: '#2ec4f0' },
  3: { fill: '#ffd9b8', medal: '#ff8a24', ribbon: '#a57bff' },
};

export default function LeaderboardScreen() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const game = useGame();
  const { streak } = useStreak();
  const { initials } = useProfile();
  const [board, setBoard] = useState<BoardKey>('all');

  const rows = rankBoard(board, { initials, streak, collected: game.collected.length });

  return (
    <Screen edges={['top', 'left', 'right']} style={{ paddingBottom: 0, gap: 14 }}>
      <ScreenHeader
        backLabel="Back to home"
        center={
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Txt accessibilityRole="header" style={{ fontFamily: Font.display700, fontSize: 26, lineHeight: 30 }}>
              Leaderboard
            </Txt>
            <Txt color={p.inkMuted} style={{ fontFamily: Font.body800, fontSize: 13, lineHeight: 17 }}>
              {Boards[board].subtitle}
            </Txt>
          </View>
        }
        trailing={<View style={{ width: 48 }} />}
      />

      <View
        accessibilityRole="tablist"
        accessibilityLabel="Leaderboard range"
        style={{ flexDirection: 'row', gap: Space[1], padding: Space[1], backgroundColor: p.surfaceRaised, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.pill }}>
        {BoardOrder.map((key) => {
          const on = key === board;
          return (
            <Pressable
              key={key}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => setBoard(key)}
              style={{
                flex: 1,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: on ? p.sunshine : 'transparent',
                borderColor: on ? p.line : 'transparent',
                borderWidth: Stroke[2],
                borderRadius: Radius.pill,
              }}>
              <Txt color={on ? p.onBright : p.ink} style={{ fontFamily: Font.display600, fontSize: 16, lineHeight: 20 }}>
                {Boards[key].label}
              </Txt>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        style={{ marginHorizontal: -Space[4] }}
        contentContainerStyle={{ gap: 10, paddingHorizontal: Space[4], paddingTop: Space[1], paddingBottom: insets.bottom + Space[8] }}>
        {rows.map((r) => (
          <Row key={r.name} row={r} />
        ))}
      </ScrollView>
    </Screen>
  );
}

function Row({ row }: { row: Ranked }) {
  const p = usePalette();
  const medal = Medals[row.rank];
  const fill = medal ? medal.fill : row.me ? p.pinkSoft : p.surfaceRaised;
  // Text sits on a bright medal fill, or on a themed surface.
  const text = medal ? p.onBright : p.ink;
  const muted = medal ? p.onBrightMuted : p.inkMuted;
  const avatarSize = medal ? 46 : 40;
  const words = `${row.score} ${row.score === 1 ? 'word' : 'words'}`;

  return (
    <View
      accessible
      accessibilityLabel={`Rank ${row.rank}, ${row.me ? 'you' : row.name}, ${words}, ${row.streak}-day streak`}
      style={{
        minHeight: medal ? 72 : 60,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Space[3],
        paddingVertical: Space[2],
        paddingLeft: 10,
        paddingRight: 14,
        backgroundColor: fill,
        borderColor: medal || row.me ? p.line : p.surfaceSunken,
        borderWidth: Stroke[2],
        borderRadius: 22,
        boxShadow: medal ? shadowPop(p.line) : undefined,
      }}>
      {medal ? (
        <Medal rank={row.rank} color={medal.medal} ribbon={medal.ribbon} />
      ) : (
        <Txt color={p.inkMuted} style={{ width: 38, textAlign: 'center', fontFamily: Font.display700, fontSize: 20, lineHeight: 24 }}>
          {row.rank}
        </Txt>
      )}

      <View
        style={{
          width: avatarSize,
          height: avatarSize,
          marginTop: row.rank === 1 ? 8 : 0,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: row.avatar,
          borderColor: p.line,
          borderWidth: Stroke[2],
          borderRadius: Radius.pill,
        }}>
        <Txt color={p.onBright} style={{ fontFamily: Font.display700, fontSize: 16, lineHeight: 20 }}>
          {row.initials}
        </Txt>
        {row.rank === 1 && (
          <Svg width={24} height={17} viewBox="0 0 40 28" style={{ position: 'absolute', top: -15 }}>
            <Path d="M4 24 L6 7 L14 15 L20 3 L26 15 L34 7 L36 24 Z" fill="#ffcb2e" stroke={p.line} strokeWidth={3.5} strokeLinejoin="round" />
            <Circle cx={20} cy={17} r={2.6} fill="#ff4f9a" />
          </Svg>
        )}
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt
          numberOfLines={1}
          color={text}
          style={{ fontFamily: medal ? Font.display600 : Font.body900, fontSize: medal ? 19 : 16, lineHeight: 22 }}>
          {row.name}
        </Txt>
        <Txt color={muted} style={{ fontFamily: Font.body800, fontSize: 12, lineHeight: 16 }}>
          {row.streak}-day streak
        </Txt>
      </View>

      <View
        style={{
          paddingHorizontal: 10,
          paddingVertical: 2,
          backgroundColor: medal ? p.white : p.sunshineSoft,
          borderColor: p.line,
          borderWidth: Stroke[1],
          borderRadius: Radius.pill,
        }}>
        <Txt color={medal ? p.onBright : p.ink} style={{ fontFamily: Font.body900, fontSize: 13, lineHeight: 18 }}>
          {words}
        </Txt>
      </View>
    </View>
  );
}

function Medal({ rank, color, ribbon }: { rank: number; color: string; ribbon: string }) {
  const p = usePalette();
  return (
    <View style={{ width: 38, height: 44, alignItems: 'center' }}>
      <Svg width={30} height={20} viewBox="0 0 30 20" style={{ position: 'absolute', bottom: 0 }}>
        <Path d="M4 0 L12 0 L15 9 L18 0 L26 0 L20 18 L15 14 L10 18 Z" fill={ribbon} stroke={p.line} strokeWidth={2.5} strokeLinejoin="round" />
      </Svg>
      <View
        style={{
          width: 34,
          height: 34,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: color,
          borderColor: p.line,
          borderWidth: Stroke[2],
          borderRadius: Radius.pill,
        }}>
        <Txt color={p.onBright} style={{ fontFamily: Font.display700, fontSize: 18, lineHeight: 22 }}>
          {rank}
        </Txt>
      </View>
    </View>
  );
}
