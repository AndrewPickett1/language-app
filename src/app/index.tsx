import { router, useFocusEffect } from 'expo-router';
import { useCallback, type ReactNode } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LottoMascot } from '@/components/art/lotto-mascot';
import { BestStreakIcon, CapsulesIcon, CardsIcon, FlameIcon, LearnIcon, StarPoints, StudyIcon } from '@/components/icons';
import { LanguageButton } from '@/components/language-button';
import { Sticker } from '@/components/sticker';
import { StreakDays } from '@/components/streak-days';
import { Txt } from '@/components/text';
import { currentUnit, unitProgress } from '@/data/level-map';
import { useGame } from '@/state/game';
import { useLotto, useLottoCountdown } from '@/state/lotto';
import { useMyWords } from '@/state/my-words';
import { useProfile } from '@/state/profile';
import { useStreak } from '@/state/streak';
import { useLevelMap } from '@/utils/modules';
import { Font } from '@/theme/fonts';
import { Radius, Space, Stroke, shadowPop } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';

const TileGap = 14;

export default function HomeScreen() {
  const p = usePalette();
  const game = useGame();
  const { refresh: refreshStreak } = useStreak();
  const myWords = useMyWords();
  const { refresh: refreshLotto } = useLotto();
  const { width } = useWindowDimensions();
  // Tiles are square where there's room; on short phones they give up height before the streak card does.
  const tileSize = (width - Space[4] * 2 - TileGap) / 2;
  const { units } = useLevelMap();
  const unit = units && currentUnit(units);
  const progress = unit && unitProgress(unit);

  useFocusEffect(
    useCallback(() => {
      void refreshLotto();
      void refreshStreak();
    }, [refreshLotto, refreshStreak])
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: p.surface }}>
      <View style={{ flex: 1, paddingHorizontal: Space[4], paddingTop: Space[2], paddingBottom: Space[4], gap: 18 }}>
        <Header />
        <StreakCard />

        <View style={{ flexShrink: 1, gap: TileGap, paddingBottom: Space[1] }}>
          <View style={{ height: tileSize, minHeight: 132, flexShrink: 1, flexDirection: 'row', gap: TileGap }}>
            <LottoTile />
            <Tile
              title="My words"
              detail={`${myWords.words.length} collected`}
              fill={p.sky}
              icon={<CardsIcon line={p.line} />}
              onPress={() => router.push('/words')}
            />
          </View>
          <View style={{ height: tileSize, minHeight: 132, flexShrink: 1, flexDirection: 'row', gap: TileGap }}>
            <Tile
              title="Study"
              detail={game.reviewCount === 0 ? 'All caught up' : `${game.reviewCount} to review`}
              fill={p.leaf}
              icon={<StudyIcon line={p.line} />}
              onPress={() => router.push('/exercises')}
            />
            <Tile
              title="Learn"
              detail={!units ? 'Loading…' : unit && progress ? `Level ${unit.number} · ${progress.done} of ${progress.total}` : 'Coming soon'}
              fill={p.tangerine}
              icon={<LearnIcon line={p.line} />}
              onPress={() => router.push('/level-map')}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function Header() {
  const p = usePalette();
  const { initials } = useProfile();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space[3] }}>
      <Txt accessibilityRole="header" style={{ fontFamily: Font.display700, fontSize: 28, lineHeight: 32 }}>
        Lingo Lotto
      </Txt>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <LanguageButton />
        <Sticker
          accessibilityRole="button"
          accessibilityLabel="Your profile"
          fill={p.grape}
          onPress={() => router.push('/profile')}
          style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
          <Txt variant="button" color={p.onBright} style={{ fontFamily: Font.display700 }}>
            {initials}
          </Txt>
        </Sticker>
      </View>
    </View>
  );
}

function StreakCard() {
  const p = usePalette();
  const { streak, best, playedToday, lost, days } = useStreak();
  const atBest = streak > 0 && streak >= best;

  return (
    <Sticker
      accessibilityRole="button"
      accessibilityLabel={`${streak} day streak${atBest ? ', your best yet' : `, best ${best} days`}${playedToday ? ', kept today' : ''}`}
      accessibilityHint="Opens streak rewards"
      fill={p.tangerine}
      radius={Radius.lg}
      borderWidth={Stroke[3]}
      onPress={() => router.push('/rewards')}
      style={{ flexGrow: 1, flexShrink: 0, justifyContent: 'center', gap: 22, padding: Space[4], paddingLeft: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space[1] }}>
            <FlameIcon line={p.line} size={80} />
            <Txt color={p.onBright} style={{ fontFamily: Font.display700, fontSize: 100, lineHeight: 100, letterSpacing: -3 }}>
              {streak}
            </Txt>
            {atBest && <BestBadge />}
          </View>
          <Txt color={p.onBright} style={{ paddingLeft: 6, fontFamily: Font.display600, fontSize: 26, lineHeight: 30 }}>
            day streak!
          </Txt>
          {!atBest && (
            <View
              style={{
                alignSelf: 'flex-start',
                marginTop: Space[2],
                marginLeft: Space[1],
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingVertical: Space[1],
                paddingLeft: 6,
                paddingRight: Space[3],
                backgroundColor: p.paper,
                borderColor: p.line,
                borderWidth: Stroke[2],
                borderRadius: Radius.pill,
              }}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: p.sunshine,
                  borderColor: p.line,
                  borderWidth: Stroke[1],
                  borderRadius: Radius.pill,
                }}>
                <BestStreakIcon color={p.line} fill={p.paper} size={14} />
              </View>
              <Txt color={p.onBright} style={{ fontFamily: Font.body900, fontSize: 14, lineHeight: 18 }}>
                Best {best} days
              </Txt>
            </View>
          )}
        </View>
        <LottoMascot line={p.line} width={112} pose={lost ? 'oops' : 'cheer'} />
      </View>

      {lost && (
        <Txt color={p.onBright} style={{ marginTop: -Space[2], fontFamily: Font.body800, fontSize: 15, lineHeight: 20 }}>
          Oops, Lotto dropped your streak! Finish an exercise to start a new one.
        </Txt>
      )}

      <View
        style={{
          paddingVertical: 10,
          paddingHorizontal: Space[2],
          backgroundColor: p.paper,
          borderColor: p.line,
          borderWidth: Stroke[2],
          borderRadius: Radius.md,
        }}>
        <StreakDays days={days} />
      </View>
    </Sticker>
  );
}

/** Sits beside the streak number while it's the learner's best. */
function BestBadge() {
  const p = usePalette();
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        marginTop: Space[1],
        marginLeft: -6,
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: p.sunshine,
        borderColor: p.line,
        borderWidth: Stroke[2],
        borderRadius: Radius.pill,
        boxShadow: shadowPop(p.line, 2),
        transform: [{ rotate: '12deg' }],
      }}>
      <BestStreakIcon color={p.line} fill={p.paper} />
      <Svg width={10} height={10} viewBox="0 0 24 24" style={{ position: 'absolute', top: -6, right: -7 }}>
        <Polygon points={StarPoints} fill={p.paper} stroke={p.line} strokeWidth={3} strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

/** Its own component so the countdown's once-a-second tick only re-renders this tile. */
function LottoTile() {
  const p = usePalette();
  const { currentPulls } = useLotto();
  const countdown = useLottoCountdown();
  return (
    <Tile
      title="Lotto"
      detail={currentPulls > 0 ? 'Pull a capsule' : countdown ? `Ready in ${countdown.label}` : 'Recharging'}
      badge={currentPulls}
      fill={p.pink}
      icon={<CapsulesIcon line={p.line} />}
      onPress={() => router.push('/lotto')}
    />
  );
}

type TileProps = {
  title: string;
  detail: string;
  fill: string;
  icon: ReactNode;
  onPress: () => void;
  /** A count in the corner, shown when above 0. */
  badge?: number;
};

function Tile({ title, detail, fill, icon, onPress, badge = 0 }: TileProps) {
  const p = usePalette();
  return (
    <Sticker
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${detail}${badge > 0 ? `, ${badge} ready` : ''}`}
      fill={fill}
      radius={Radius.lg}
      borderWidth={Stroke[3]}
      onPress={onPress}
      style={{ flex: 1, paddingTop: Space[3], paddingHorizontal: 14, paddingBottom: 14, gap: 2 }}>
      <View style={{ flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center', paddingBottom: 6 }}>
        <View style={{ width: '100%', height: '100%', maxWidth: 84, maxHeight: 84 }}>{icon}</View>
      </View>
      <Txt numberOfLines={1} color={p.onBright} style={{ fontFamily: Font.display600, fontSize: 20, lineHeight: 24 }}>
        {title}
      </Txt>
      <Txt numberOfLines={1} color={p.onBright} style={{ fontFamily: Font.body800, fontSize: 13, lineHeight: 17 }}>
        {detail}
      </Txt>
      {badge > 0 && (
        <View
          style={{
            position: 'absolute',
            top: Space[2],
            right: Space[2],
            minWidth: 30,
            height: 30,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: Space[2],
            backgroundColor: p.sunshine,
            borderColor: p.line,
            borderWidth: Stroke[2],
            borderRadius: Radius.pill,
            boxShadow: shadowPop(p.line, 2),
          }}>
          <Txt color={p.onBright} style={{ fontFamily: Font.body900, fontSize: 14, lineHeight: 18 }}>
            {badge}
          </Txt>
        </View>
      )}
    </Sticker>
  );
}
