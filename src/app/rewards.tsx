import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RewardArt } from '@/components/art/reward-art';
import { CheckIcon, ChevronIcon, FlameIcon, LockIcon } from '@/components/icons';
import { Screen, ScreenHeader } from '@/components/screen';
import { Panel, PillButton } from '@/components/sticker';
import { Txt } from '@/components/text';
import { StreakRewards, type StreakReward } from '@/data/streak-rewards';
import { useStreak } from '@/state/streak';
import { Font } from '@/theme/fonts';
import { Bounce, Radius, Space, Stroke, shadowPop, type Palette } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';

/** Timeline geometry: one column per reward, with a gutter at each end. */
const Col = 120;
const Pad = 16;
const TrackHeight = 298;
const CardTop = 20;
const CardHeight = 168;
/** Vertical centre of the day nodes and the line through them. */
const LineY = CardTop + CardHeight + 4 + 14 + 16;

type Status = 'claimed' | 'ready' | 'locked';

/** Where `day` sits on the timeline: on a node, or between the two it falls between. */
function xOf(day: number) {
  const i = StreakRewards.findIndex((r) => r.day >= day);
  if (i < 0) return Pad + (StreakRewards.length - 1) * Col + Col / 2;
  if (i === 0) return Pad + Col / 2;
  const a = StreakRewards[i - 1];
  const b = StreakRewards[i];
  return Pad + (i - 1) * Col + Col / 2 + ((day - a.day) / (b.day - a.day)) * Col;
}

export default function RewardsScreen() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { streak, claimedRewards, claimReward } = useStreak();
  const [picked, setPicked] = useState<number | null>(null);
  const [justClaimed, setJustClaimed] = useState<number | null>(null);
  const scrolled = useRef(false);
  const timeline = useRef<ScrollView>(null);

  const status = (r: StreakReward): Status =>
    r.day > streak ? 'locked' : claimedRewards.includes(r.day) ? 'claimed' : 'ready';

  const nextIndex = StreakRewards.findIndex((r) => r.day > streak);
  const next = StreakRewards[nextIndex] ?? StreakRewards[StreakRewards.length - 1];
  const prevDay = nextIndex > 0 ? StreakRewards[nextIndex - 1].day : 0;
  const toGo = next.day - streak;
  const nextPct = Math.max(0, Math.min(100, Math.round(((streak - prevDay) / (next.day - prevDay)) * 100)));

  const firstReady = StreakRewards.find((r) => status(r) === 'ready');
  const selected = StreakRewards.find((r) => r.day === (picked ?? firstReady?.day ?? next.day)) ?? next;
  const selectedStatus = status(selected);

  const first = Pad + Col / 2;
  const last = Pad + (StreakRewards.length - 1) * Col + Col / 2;
  const youX = xOf(streak);

  // Start the timeline at the last reward the streak has reached.
  const scrollToCurrent = () => {
    if (scrolled.current) return;
    scrolled.current = true;
    const reached = Math.max(0, StreakRewards.filter((r) => r.day <= streak).length - 1);
    timeline.current?.scrollTo({ x: Math.max(0, Pad + reached * Col + Col / 2 - 120), animated: false });
  };

  const claim = () => {
    claimReward(selected.day);
    setJustClaimed(selected.day);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  return (
    <Screen edges={['top', 'left', 'right']} style={{ paddingBottom: 0, gap: 14 }}>
      <ScreenHeader
        backLabel="Back to home"
        center={
          <Txt accessibilityRole="header" style={{ flex: 1, textAlign: 'center', fontFamily: Font.display700, fontSize: 26, lineHeight: 30 }}>
            Streak rewards
          </Txt>
        }
        trailing={<View style={{ width: 48 }} />}
      />

      <ScrollView
        style={{ marginHorizontal: -Space[4] }}
        contentContainerStyle={{ flexGrow: 1, gap: 14, paddingHorizontal: Space[4], paddingBottom: insets.bottom + Space[4] }}>
        <Panel fill={p.tangerine} style={{ flexDirection: 'row', alignItems: 'center', gap: Space[3], padding: 14 }}>
          <FlameIcon line={p.line} size={58} />
          <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: Space[2] }}>
              <Txt color={p.onBright} style={{ fontFamily: Font.display700, fontSize: 26, lineHeight: 30 }}>
                {streak} {streak === 1 ? 'day' : 'days'}
              </Txt>
              <Txt color={p.onBright} style={{ fontFamily: Font.body900, fontSize: 13, lineHeight: 17 }}>
                {toGo > 0 ? `${toGo} ${toGo === 1 ? 'day' : 'days'} to go` : 'All unlocked!'}
              </Txt>
            </View>
            <View
              accessibilityRole="progressbar"
              accessibilityLabel="Progress to next reward"
              accessibilityValue={{ min: prevDay, max: next.day, now: streak }}
              style={{ height: 18, padding: 3, backgroundColor: p.paper, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.pill }}>
              <View style={{ height: '100%', width: `${nextPct}%`, minWidth: 8, backgroundColor: p.sunshine, borderRadius: Radius.pill }} />
            </View>
            <Txt color={p.onBright} style={{ fontFamily: Font.body800, fontSize: 13, lineHeight: 17 }}>
              Next: {next.title.toLowerCase()} at day {next.day}
            </Txt>
          </View>
        </Panel>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 }}>
          <Txt variant="caption" color={p.inkMuted} style={{ fontFamily: Font.body900 }}>
            Your timeline
          </Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space[1] }}>
            <Txt color={p.inkMuted} style={{ fontFamily: Font.body800, fontSize: 13, lineHeight: 17 }}>
              Swipe for more
            </Txt>
            <ChevronIcon color={p.inkMuted} size={14} direction="right" />
          </View>
        </View>

        <ScrollView
          ref={timeline}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={Col}
          decelerationRate="fast"
          onLayout={scrollToCurrent}
          accessibilityRole="list"
          accessibilityLabel="Streak reward milestones"
          style={{ flexGrow: 0, marginTop: -6, marginHorizontal: -Space[4] }}>
          <View style={{ width: Pad * 2 + StreakRewards.length * Col, height: TrackHeight }}>
            <View
              style={{
                position: 'absolute',
                left: first,
                top: LineY - 8,
                width: last - first + 6,
                height: 16,
                backgroundColor: p.stoneSoft,
                borderColor: p.line,
                borderWidth: Stroke[2],
                borderRadius: Radius.pill,
              }}
            />
            <View
              style={{
                position: 'absolute',
                left: first + 3,
                top: LineY - 5,
                width: Math.max(0, Math.min(last, youX) - first),
                height: 10,
                backgroundColor: p.tangerine,
                borderRadius: Radius.pill,
              }}
            />

            <View style={{ position: 'absolute', left: youX + 2 - Col / 2, top: LineY + 22, width: Col, alignItems: 'center' }}>
              <View
                style={{
                  width: 0,
                  height: 0,
                  borderLeftWidth: 8,
                  borderRightWidth: 8,
                  borderBottomWidth: 10,
                  borderLeftColor: 'transparent',
                  borderRightColor: 'transparent',
                  borderBottomColor: p.ink,
                }}
              />
              <View style={{ marginTop: -1, paddingVertical: 3, paddingHorizontal: 10, backgroundColor: p.ink, borderRadius: Radius.pill }}>
                <Txt color={p.surface} style={{ fontFamily: Font.body900, fontSize: 12, lineHeight: 16, letterSpacing: 0.5 }}>
                  YOU · DAY {streak}
                </Txt>
              </View>
            </View>

            <View style={{ position: 'absolute', left: Pad, top: CardTop, flexDirection: 'row' }}>
              {StreakRewards.map((r) => (
                <RewardColumn
                  key={r.day}
                  reward={r}
                  status={status(r)}
                  isNext={r.day === next.day && status(r) === 'locked'}
                  streak={streak}
                  selected={r.day === selected.day}
                  justClaimed={justClaimed === r.day}
                  onPick={() => setPicked(r.day)}
                />
              ))}
            </View>
          </View>
        </ScrollView>

        <Panel fill={p.white} style={{ flexGrow: 1, justifyContent: 'center', gap: 6, padding: 14 }}>
          <View accessibilityLiveRegion="polite" style={{ gap: 6 }}>
            <View
              style={{
                alignSelf: 'flex-start',
                paddingVertical: 2,
                paddingHorizontal: 10,
                backgroundColor: tagFill(p, selectedStatus, selected.day === next.day, true),
                borderColor: p.line,
                borderWidth: Stroke[1],
                borderRadius: Radius.pill,
              }}>
              <Txt color={p.onBright} style={{ fontFamily: Font.body900, fontSize: 11, lineHeight: 14, letterSpacing: 0.66 }}>
                DAY {selected.day} · {tagText(selectedStatus, selected.day === next.day, selected.day - streak, selected.day)}
              </Txt>
            </View>
            <Txt color={p.onBright} style={{ fontFamily: Font.display700, fontSize: 24, lineHeight: 28 }}>
              {selected.title}
            </Txt>
            <Txt color={p.onBrightMuted} style={{ fontFamily: Font.body700, fontSize: 15, lineHeight: 20 }}>
              {selected.desc}
            </Txt>
          </View>

          {selectedStatus === 'ready' && <PillButton label="Claim reward" fill={p.pink} onPress={claim} style={{ marginTop: 6, minHeight: 50 }} />}
          {selectedStatus === 'claimed' && (
            <View
              style={{
                marginTop: 6,
                height: 50,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: Space[2],
                backgroundColor: p.leafSoft,
                borderColor: p.line,
                borderWidth: Stroke[2],
                borderRadius: Radius.pill,
              }}>
              <CheckIcon color={p.onBright} />
              <Txt variant="button" color={p.onBright}>
                Claimed
              </Txt>
            </View>
          )}
          {selectedStatus === 'locked' && (
            <View
              style={{
                marginTop: 6,
                height: 50,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: p.stoneSoft,
                borderColor: p.inkMuted,
                borderWidth: Stroke[2],
                borderStyle: 'dashed',
                borderRadius: Radius.pill,
              }}>
              <Txt color={p.onBrightMuted} style={{ fontFamily: Font.body900, fontSize: 15, lineHeight: 20 }}>
                Reach a {selected.day}-day streak to unlock
              </Txt>
            </View>
          )}
        </Panel>
      </ScrollView>
    </Screen>
  );
}

function tagText(status: Status, isNext: boolean, daysLeft: number, day: number) {
  if (status === 'claimed') return 'CLAIMED';
  if (status === 'ready') return 'CLAIM!';
  if (isNext) return `${daysLeft} ${daysLeft === 1 ? 'DAY' : 'DAYS'} LEFT`;
  return `DAY ${day}`;
}

/** `soft`: the selected-reward panel, where a plain white tag would vanish into the white panel. */
function tagFill(p: Palette, status: Status, isNext: boolean, soft = false) {
  if (status === 'claimed') return p.leafSoft;
  if (status === 'locked' && isNext) return p.tangerineSoft;
  return soft ? p.sunshineSoft : p.white;
}

type ColumnProps = {
  reward: StreakReward;
  status: Status;
  isNext: boolean;
  streak: number;
  selected: boolean;
  justClaimed: boolean;
  onPick: () => void;
};

function RewardColumn({ reward: r, status, isNext, streak, selected, justClaimed, onPick }: ColumnProps) {
  const p = usePalette();
  const bob = useSharedValue(0);
  const pop = useSharedValue(1);
  const ring = useSharedValue(0);

  // Ready rewards bob until claimed.
  useEffect(() => {
    bob.set(status === 'ready' ? withRepeat(withTiming(-5, { duration: 650, easing: Easing.inOut(Easing.ease) }), -1, true) : withTiming(0, { duration: 150 }));
  }, [bob, status]);

  useEffect(() => {
    if (justClaimed) pop.set(withSequence(withTiming(1.25, { duration: 190 }), withTiming(1, { duration: 290, easing: Easing.bezier(...Bounce) })));
  }, [pop, justClaimed]);

  // The next milestone's node pulses.
  useEffect(() => {
    ring.set(isNext ? withRepeat(withTiming(1, { duration: 1400, easing: Easing.out(Easing.ease) }), -1, false) : 0);
  }, [ring, isNext]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.get() }, { scale: pop.get() }, { rotate: `${interpolate(pop.get(), [1, 1.25], [0, -6])}deg` }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ring.get(), [0, 1], [0.55, 0]),
    transform: [{ scale: interpolate(ring.get(), [0, 1], [1, 1.75]) }],
  }));

  const locked = status === 'locked';
  const fill = status === 'ready' ? p.sunshine : locked && !isNext ? p.stoneSoft : p.white;
  const daysLeft = r.day - streak;
  const state = status === 'claimed' ? 'claimed' : status === 'ready' ? 'ready to claim' : 'locked';

  return (
    <View style={{ width: Col, alignItems: 'center' }}>
      <Animated.View style={cardStyle}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Day ${r.day}: ${r.title}, ${state}`}
          accessibilityState={{ selected }}
          onPress={onPick}
          style={{
            width: 108,
            height: CardHeight,
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: Space[1],
            paddingVertical: 10,
            paddingHorizontal: Space[2],
            backgroundColor: fill,
            borderColor: isNext ? p.tangerine : p.line,
            borderWidth: Stroke[2],
            borderStyle: isNext ? 'dashed' : 'solid',
            borderRadius: 22,
            boxShadow: selected ? shadowPop(p.line, 6) : locked ? undefined : shadowPop(p.line, 3),
            transform: [{ translateY: selected ? -4 : 0 }],
          }}>
          {status !== 'ready' && (
            <View
              style={{
                position: 'absolute',
                top: -10,
                right: -8,
                width: 28,
                height: 28,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: status === 'claimed' ? p.leaf : p.white,
                borderColor: p.line,
                borderWidth: Stroke[2],
                borderRadius: Radius.pill,
              }}>
              {status === 'claimed' ? <CheckIcon color={p.onBright} size={14} /> : <LockIcon color={p.onBright} fill={p.locked} />}
            </View>
          )}
          <View style={{ width: 68, height: 68, alignItems: 'center', justifyContent: 'center', opacity: locked && !isNext ? 0.45 : 1 }}>
            <RewardArt reward={r} />
          </View>
          <Txt color={p.onBright} style={{ textAlign: 'center', fontFamily: Font.display600, fontSize: 15, lineHeight: 18 }}>
            {r.title}
          </Txt>
          <View
            style={{
              paddingVertical: 2,
              paddingHorizontal: 9,
              backgroundColor: tagFill(p, status, isNext),
              borderColor: p.line,
              borderWidth: Stroke[1],
              borderRadius: Radius.pill,
            }}>
            <Txt numberOfLines={1} color={p.onBright} style={{ fontFamily: Font.body900, fontSize: 11, lineHeight: 14, letterSpacing: 0.44 }}>
              {tagText(status, isNext, daysLeft, r.day)}
            </Txt>
          </View>
        </Pressable>
      </Animated.View>

      <View style={{ width: 3, height: 14, marginTop: 4, backgroundColor: p.line, borderRadius: 2 }} />
      <View style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
        {isNext && (
          <Animated.View
            style={[{ position: 'absolute', width: 32, height: 32, borderRadius: Radius.pill, backgroundColor: p.tangerine }, ringStyle]}
          />
        )}
        <View
          style={{
            width: 32,
            height: 32,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: status === 'claimed' ? p.leaf : status === 'ready' ? p.sunshine : p.white,
            borderColor: p.line,
            borderWidth: Stroke[2],
            borderRadius: Radius.pill,
          }}>
          <Txt color={p.onBright} style={{ fontFamily: Font.display700, fontSize: 12, lineHeight: 14 }}>
            {r.day}
          </Txt>
        </View>
      </View>
    </View>
  );
}
