import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  ZoomIn,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Capsule } from '@/components/art/capsule';
import { LottoMascot } from '@/components/art/lotto-mascot';
import { CloseIcon, StarIcon } from '@/components/icons';
import { Panel, PillButton, RoundButton } from '@/components/sticker';
import { Txt } from '@/components/text';
import { Font } from '@/theme/fonts';
import { Bounce, Radius, Space, Stroke } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';
import type { BonusSource } from '@/utils/lotto';

/** The line the pop-up shows for each exercise that earns a bonus pull. */
export const BonusPullMessages: Record<BonusSource, string> = {
  study: 'You finished a study session, so a fresh capsule just rolled in.',
  match: 'You cleared a matching game, so a fresh capsule just rolled in.',
};

/** When the new capsule drops into its slot. */
const ArriveMs = 750;
/** Lets the screen behind settle (and any modal before it finish closing) before this one opens. */
const OpenDelayMs = 300;

type Props = {
  source: BonusSource;
  /** Pulls ready now, including the one just earned. */
  pulls: number;
  maxPulls: number;
  onClose: () => void;
};

/** Celebrates a bonus pull earned by finishing an exercise: Lotto cheers and the new capsule fills its slot. */
export function PullEarnedPopup(props: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setOpen(true), OpenDelayMs);
    return () => clearTimeout(t);
  }, []);

  return (
    <Modal visible={open} transparent animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={props.onClose}>
      <Animated.View entering={FadeIn.duration(200)} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(42, 27, 74, 0.6)' }]}>
        <Pressable accessible={false} importantForAccessibility="no" onPress={props.onClose} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <View pointerEvents="box-none" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Space[6] }}>
        <Animated.View entering={ZoomIn.duration(420).easing(Easing.bezier(...Bounce).factory())} accessibilityViewIsModal style={{ width: 310, maxWidth: '100%' }}>
          <PullEarnedCard {...props} />
        </Animated.View>
      </View>
    </Modal>
  );
}

function PullEarnedCard({ source, pulls, maxPulls, onClose }: Props) {
  const p = usePalette();
  const [arrived, setArrived] = useState(false);
  const jump = useSharedValue(0);
  const twinkle = useSharedValue(0);
  const badge = useSharedValue(0);

  useEffect(() => {
    // One 1.3s hop: up, a small bounce, then rest for the back half.
    jump.set(
      withRepeat(
        withSequence(
          withTiming(-9, { duration: 260, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 195, easing: Easing.in(Easing.quad) }),
          withTiming(0, { duration: 260 }),
          withTiming(0, { duration: 585 })
        ),
        -1
      )
    );
    twinkle.set(withRepeat(withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }), -1, true));
    badge.set(withDelay(650, withTiming(1, { duration: 420, easing: Easing.bezier(...Bounce) })));
    const t = setTimeout(() => {
      setArrived(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }, ArriveMs);
    return () => clearTimeout(t);
  }, [jump, twinkle, badge]);

  const jumpStyle = useAnimatedStyle(() => ({ transform: [{ translateY: jump.get() }] }));
  const twinkleStyle = useAnimatedStyle(() => ({ opacity: interpolate(twinkle.get(), [0, 1], [1, 0.5]), transform: [{ scale: interpolate(twinkle.get(), [0, 1], [1, 0.6]) }] }));
  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badge.get() }, { rotate: `${interpolate(badge.get(), [0, 1], [-20, 8])}deg` }],
  }));

  const have = Math.max(1, Math.min(maxPulls, pulls));
  const full = have >= maxPulls;

  const goPull = () => {
    onClose();
    router.push('/lotto');
  };

  return (
    <Panel fill={p.white} lift={6} style={{ alignItems: 'center', gap: 14, paddingTop: 18, paddingHorizontal: 18, paddingBottom: 20 }}>
      <RoundButton accessibilityLabel="Close" fill={p.paper} size={36} lift={3} onPress={onClose} style={{ position: 'absolute', top: Space[3], right: Space[3], zIndex: 1 }}>
        <CloseIcon color={p.onBright} size={14} />
      </RoundButton>

      <View accessible accessibilityRole="image" accessibilityLabel="Lotto cheering with both arms up" style={{ width: 132, height: 136, alignItems: 'center', justifyContent: 'flex-end', marginTop: 2 }}>
        <View style={{ position: 'absolute', top: 11, left: 9, width: 114, height: 114, backgroundColor: p.sunshineSoft, borderRadius: Radius.pill }} />
        <Animated.View style={[{ marginBottom: 4 }, jumpStyle]}>
          <LottoMascot line={p.line} width={104} />
        </Animated.View>
        <Animated.View style={[{ position: 'absolute', left: 0, top: 54 }, twinkleStyle]}>
          <StarIcon color={p.line} fill={p.sunshine} size={14} />
        </Animated.View>
        <Animated.View style={[{ position: 'absolute', right: 2, top: 66 }, twinkleStyle]}>
          <StarIcon color={p.line} fill={p.paper} size={10} />
        </Animated.View>
        <Animated.View
          style={[
            { position: 'absolute', top: 34, right: -12, paddingVertical: 2, paddingHorizontal: 10, backgroundColor: p.leaf, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.pill },
            badgeStyle,
          ]}>
          <Txt color={p.onBright} style={{ fontFamily: Font.display700, fontSize: 20, lineHeight: 24 }}>
            +1
          </Txt>
        </Animated.View>
      </View>

      <View style={{ alignItems: 'center', gap: 6 }}>
        <View style={{ paddingVertical: 2, paddingHorizontal: 10, backgroundColor: p.sunshineSoft, borderColor: p.line, borderWidth: Stroke[1], borderRadius: Radius.pill }}>
          <Txt color={p.onBright} style={{ fontFamily: Font.body900, fontSize: 12, lineHeight: 16, letterSpacing: 0.72 }}>
            PULL EARNED
          </Txt>
        </View>
        <Txt color={p.onBright} accessibilityRole="header" style={{ textAlign: 'center', fontFamily: Font.display700, fontSize: 34, lineHeight: 38 }}>
          Bonus pull!
        </Txt>
        <Txt color={p.onBright} style={{ textAlign: 'center', fontFamily: Font.body800, fontSize: 16, lineHeight: 22 }}>
          {BonusPullMessages[source]}
        </Txt>
      </View>

      <View
        style={{
          alignSelf: 'stretch',
          alignItems: 'center',
          gap: Space[2],
          paddingTop: 10,
          paddingHorizontal: 10,
          paddingBottom: Space[2],
          backgroundColor: p.paper,
          borderColor: p.line,
          borderWidth: Stroke[2],
          borderRadius: Radius.md,
        }}>
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={`${have} of ${maxPulls} capsule slots filled`}
          style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Space[2] }}>
          {Array.from({ length: maxPulls }, (_, i) => {
            const isNew = i === have - 1;
            if (isNew && arrived) {
              return (
                <Animated.View key={i} entering={ZoomIn.duration(380).easing(Easing.bezier(...Bounce).factory())}>
                  <Capsule color={p.pink} line={p.line} size={34} stroke={5.5} />
                </Animated.View>
              );
            }
            if (i < have - 1) return <Capsule key={i} color={p.pink} line={p.line} size={34} stroke={5.5} />;
            return <View key={i} style={{ width: 34, height: 34, borderColor: p.inkMuted, borderWidth: Stroke[2], borderStyle: 'dashed', borderRadius: Radius.pill }} />;
          })}
        </View>
        <Txt color={p.onBright} style={{ fontFamily: Font.body800, fontSize: 14, lineHeight: 18 }}>
          {have} of {maxPulls} pulls ready
        </Txt>
      </View>

      {full && (
        <View style={{ alignSelf: 'stretch', marginTop: -4, paddingVertical: Space[2], paddingHorizontal: Space[3], backgroundColor: p.sunshineSoft, borderRadius: Radius.sm }}>
          <Txt color={p.onBright} style={{ textAlign: 'center', fontFamily: Font.body800, fontSize: 14, lineHeight: 19 }}>
            Your tray is full — pull one so your next bonus has room.
          </Txt>
        </View>
      )}

      <View style={{ alignSelf: 'stretch', gap: 10, marginTop: 2 }}>
        <PillButton label="Pull a capsule" fill={p.pink} onPress={goPull} />
        <PillButton label="Save it for later" fill={p.paper} onPress={onClose} style={{ minHeight: 46 }} />
      </View>
    </Panel>
  );
}
