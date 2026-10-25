import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  ZoomIn,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { LottoMascot } from '@/components/art/lotto-mascot';
import { CloseIcon, FlameIcon, StarIcon } from '@/components/icons';
import { Panel, PillButton, RoundButton } from '@/components/sticker';
import { StreakDays } from '@/components/streak-days';
import { Txt } from '@/components/text';
import { StreakMessages, useStreak, type StreakReason } from '@/state/streak';
import { Font } from '@/theme/fonts';
import { Bounce, Radius, Space, Stroke } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';

/** When the count ticks up from yesterday's streak to today's. */
const BumpMs = 450;
/** Lets the screen behind settle (and any modal before it finish closing) before this one opens. */
const OpenDelayMs = 300;

type Props = { reason: StreakReason; streak: number; onClose: () => void };

/** Celebrates the first finished exercise of the day: the streak ticks up and today's dot fills in. */
export function StreakPopup({ reason, streak, onClose }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setOpen(true), OpenDelayMs);
    return () => clearTimeout(t);
  }, []);

  return (
    <Modal visible={open} transparent animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(200)} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(42, 27, 74, 0.6)' }]}>
        <Pressable accessible={false} importantForAccessibility="no" onPress={onClose} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <View pointerEvents="box-none" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Space[6] }}>
        <Animated.View entering={ZoomIn.duration(420).easing(Easing.bezier(...Bounce).factory())} accessibilityViewIsModal style={{ width: 300, maxWidth: '100%' }}>
          <StreakCard reason={reason} streak={streak} onClose={onClose} />
        </Animated.View>
      </View>
    </Modal>
  );
}

function StreakCard({ reason, streak, onClose }: Props) {
  const p = usePalette();
  const { days } = useStreak();
  const [bumped, setBumped] = useState(false);
  const wobble = useSharedValue(-4);
  const bump = useSharedValue(1);
  const rise = useSharedValue(0);

  useEffect(() => {
    wobble.set(withRepeat(withTiming(4, { duration: 700, easing: Easing.inOut(Easing.ease) }), -1, true));
    const t = setTimeout(() => {
      setBumped(true);
      bump.set(withSequence(withTiming(1.35, { duration: 170 }), withTiming(1, { duration: 250, easing: Easing.bezier(...Bounce) })));
      rise.set(withTiming(1, { duration: 1000, easing: Easing.out(Easing.quad) }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }, BumpMs);
    return () => clearTimeout(t);
  }, [wobble, bump, rise]);

  const flameStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${wobble.get()}deg` }, { scale: interpolate(Math.abs(wobble.get()), [0, 4], [1.06, 1]) }] }));
  const bumpStyle = useAnimatedStyle(() => ({ transform: [{ scale: bump.get() }] }));
  const plusStyle = useAnimatedStyle(() => ({
    opacity: interpolate(rise.get(), [0, 0.3, 1], [0, 1, 0]),
    transform: [{ translateY: interpolate(rise.get(), [0, 1], [8, -26]) }],
  }));

  return (
    <Panel fill={p.white} lift={6} style={{ alignItems: 'center', gap: Space[3], paddingTop: 18, paddingHorizontal: 18, paddingBottom: 20 }}>
      <RoundButton accessibilityLabel="Close" fill={p.paper} size={36} lift={3} onPress={onClose} style={{ position: 'absolute', top: Space[3], right: Space[3], zIndex: 1 }}>
        <CloseIcon color={p.onBright} size={14} />
      </RoundButton>

      <View style={{ width: 108, height: 108, alignItems: 'center', justifyContent: 'center', marginTop: Space[1] }}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: p.tangerine, borderColor: p.line, borderWidth: Stroke[3], borderRadius: Radius.pill }]} />
        <Animated.View style={[{ transformOrigin: '50% 90%' }, flameStyle]}>
          <FlameIcon line={p.line} size={76} />
        </Animated.View>
        <View style={{ position: 'absolute', left: -8, top: 10 }}>
          <StarIcon color={p.line} fill={p.sunshine} size={18} />
        </View>
        <View style={{ position: 'absolute', left: -58, bottom: -12 }}>
          <LottoMascot line={p.line} width={56} pose="cheer" />
        </View>
        <View style={{ position: 'absolute', right: 2, bottom: 6 }}>
          <StarIcon color={p.line} fill={p.paper} size={13} />
        </View>
        {bumped && (
          <Animated.View
            style={[
              { position: 'absolute', top: -6, right: -6, paddingVertical: 2, paddingHorizontal: 9, backgroundColor: p.leaf, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.pill },
              plusStyle,
            ]}>
            <Txt color={p.onBright} style={{ fontFamily: Font.display700, fontSize: 18, lineHeight: 22 }}>
              +1
            </Txt>
          </Animated.View>
        )}
      </View>

      <View style={{ alignItems: 'center' }}>
        <View accessible accessibilityRole="header" accessibilityLabel={`${streak} day streak!`} style={{ flexDirection: 'row', alignItems: 'baseline', gap: Space[2] }}>
          <Animated.View style={bumpStyle}>
            <Txt color={p.onBright} style={{ fontFamily: Font.display700, fontSize: 56, lineHeight: 58, letterSpacing: -1 }}>
              {bumped ? streak : streak - 1}
            </Txt>
          </Animated.View>
          <Txt color={p.onBright} style={{ fontFamily: Font.display700, fontSize: 24, lineHeight: 28 }}>
            day streak!
          </Txt>
        </View>
        <Txt color={p.onBright} style={{ marginTop: Space[1], textAlign: 'center', fontFamily: Font.body800, fontSize: 16, lineHeight: 22 }}>
          {StreakMessages[reason]}
        </Txt>
      </View>

      <View style={{ alignSelf: 'stretch', paddingVertical: Space[2], paddingHorizontal: 6, backgroundColor: p.paper, borderColor: p.line, borderWidth: Stroke[2], borderRadius: 18 }}>
        {/* Today shows as still to do until the count ticks up, then pops in as done. */}
        <StreakDays days={bumped ? days : days.map((d, i) => (i === days.length - 1 ? { ...d, status: 'pending' } : d))} size={26} popToday={bumped} />
      </View>

      <PillButton label="Keep going" fill={p.pink} onPress={onClose} style={{ alignSelf: 'stretch' }} />
    </Panel>
  );
}
