import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Alert, Modal, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { Easing, FadeIn, ZoomIn, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { Capsule } from '@/components/art/capsule';
import { GachaMachine, type MachinePhase } from '@/components/gacha-machine';
import { ClockIcon, CloseIcon } from '@/components/icons';
import { Screen, ScreenHeader } from '@/components/screen';
import { RoundButton } from '@/components/sticker';
import { StreakPopup } from '@/components/streak-popup';
import { Txt } from '@/components/text';
import { WordCard } from '@/components/word-card';
import { RarityInfo } from '@/data/rarity';
import { MaxPulls, RefillMs, useGame, type PullResult } from '@/state/game';
import { useStreak } from '@/state/streak';
import { Font } from '@/theme/fonts';
import { Bounce, Radius, Space, Stroke } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

export default function LottoScreen() {
  const p = usePalette();
  const game = useGame();
  const streak = useStreak();
  const [phase, setPhase] = useState<MachinePhase>('idle');
  const [prize, setPrize] = useState<PullResult | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const { refill } = game;
  useEffect(() => {
    const tick = setInterval(() => {
      setNow(Date.now());
      refill();
    }, 1000);
    const pending = timers.current;
    return () => {
      clearInterval(tick);
      pending.forEach(clearTimeout);
    };
  }, [refill]);

  const canPull = game.pulls > 0 && phase === 'idle';

  const onPull = async () => {
    if (phase !== 'idle') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    // Spin while the word is fetched, so the machine reacts to the tap straight away.
    setPrize(null);
    setPhase('spin');
    const started = Date.now();
    let result: PullResult | null;
    try {
      result = await game.pull();
    } catch (e) {
      setPhase('idle');
      Alert.alert("Couldn't pull a word", e instanceof Error ? e.message : 'Try again.');
      return;
    }
    if (!result) {
      setPhase('idle');
      return;
    }
    setPrize(result);
    const wait = Math.max(0, 1250 - (Date.now() - started));
    timers.current.push(
      setTimeout(() => setPhase('drop'), wait),
      setTimeout(() => setPhase('reveal'), wait + 800)
    );
  };

  const remaining = Math.max(0, (game.nextPullAt ?? now) - now);
  const secs = Math.ceil(remaining / 1000);
  const countdown = `${pad2(Math.floor(secs / 3600))}:${pad2(Math.floor((secs % 3600) / 60))}:${pad2(secs % 60)}`;
  const prizeColor = prize ? RarityInfo[prize.word.rarity].color : p.sky;

  return (
    <View style={{ flex: 1 }}>
      <Screen background={p.pinkSoft} style={{ gap: 14 }}>
        <ScreenHeader backLabel="Back to home" title="Lotto" />

        <GachaMachine phase={phase} canPull={canPull} onPull={onPull} prizeColor={prizeColor} />

        {game.pulls > 0 ? (
          <View
            accessible
            accessibilityLabel={`${game.pulls} of ${MaxPulls} pulls left`}
            style={{ height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space[3], paddingHorizontal: Space[4], backgroundColor: p.surfaceRaised, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {Array.from({ length: MaxPulls }, (_, i) =>
                i < game.pulls ? (
                  <Capsule key={i} color={p.pink} line={p.line} size={28} shine={false} stroke={5.5} />
                ) : (
                  <View key={i} style={{ width: 28, height: 28, borderColor: p.inkMuted, borderWidth: Stroke[2], borderStyle: 'dashed', borderRadius: Radius.pill }} />
                )
              )}
            </View>
            <Txt variant="label" style={{ fontFamily: Font.body900, fontSize: 15, lineHeight: 20 }}>
              {game.pulls === 1 ? '1 pull left' : `${game.pulls} pulls left`}
            </Txt>
          </View>
        ) : (
          <View
            accessible
            accessibilityRole="timer"
            accessibilityLabel={`Next pull in ${countdown}`}
            style={{ height: 64, flexDirection: 'row', alignItems: 'center', gap: Space[3], paddingHorizontal: 14, backgroundColor: p.sunshineSoft, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.md }}>
            <ClockIcon color={p.line} fill={p.white} />
            <View style={{ flex: 1, gap: Space[1] }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Txt variant="label" style={{ fontFamily: Font.body900 }}>
                  Next pull in
                </Txt>
                <Txt style={{ fontFamily: Font.display700, fontSize: 24, lineHeight: 26, fontVariant: ['tabular-nums'] }}>{countdown}</Txt>
              </View>
              <View style={{ height: 12, padding: 2, backgroundColor: p.white, borderColor: p.line, borderWidth: Stroke[1], borderRadius: Radius.pill }}>
                <View style={{ height: '100%', width: `${Math.round((1 - remaining / RefillMs) * 100)}%`, minWidth: 6, backgroundColor: p.tangerine, borderRadius: Radius.pill }} />
              </View>
            </View>
          </View>
        )}
      </Screen>

      {phase === 'reveal' && prize && (
        <Reveal prize={prize} onClose={() => setPhase('idle')} />
      )}
      {/* The first pull of the day grows the streak; celebrate once the word card is closed. */}
      {streak.streakPopup && phase === 'idle' && <StreakPopup reason={streak.streakPopup} streak={streak.streak} onClose={streak.closeStreakPopup} />}
    </View>
  );
}

type RevealProps = { prize: PullResult; onClose: () => void };

/** How far (as a share of the screen width) or how fast (px/s) a drag has to go to swipe the card away. */
const SwipeDistance = 0.3;
const SwipeVelocity = 900;

/**
 * The pulled word's card pops up over the machine. It's already been saved to the binder by `pull()`,
 * so there's nothing to confirm: the card is closed with its close button or swiped away in any direction.
 * A real Modal, not an overlay View: it's its own native window, so closing it can't leave
 * stray pixels of the card's shadow and rounded corners behind on the Lotto screen.
 */
function Reveal({ prize, onClose }: RevealProps) {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { word, isNew } = prize;
  const dx = useSharedValue(0);
  const dy = useSharedValue(0);
  const leaving = useSharedValue(false);

  const pan = Gesture.Pan()
    // A short dead zone so taps on the buttons inside the card still land.
    .minDistance(12)
    .onUpdate((e) => {
      if (leaving.get()) return;
      dx.set(e.translationX);
      dy.set(e.translationY);
    })
    .onEnd((e) => {
      if (leaving.get()) return;
      const far = Math.hypot(e.translationX, e.translationY) > width * SwipeDistance;
      const flung = Math.hypot(e.velocityX, e.velocityY) > SwipeVelocity;
      if (!far && !flung) {
        dx.set(withSpring(0, { damping: 16, stiffness: 220 }));
        dy.set(withSpring(0, { damping: 16, stiffness: 220 }));
        return;
      }
      // Throw the card off screen along the drag (or fling) direction, then close.
      leaving.set(true);
      const vx = flung ? e.velocityX : e.translationX;
      const vy = flung ? e.velocityY : e.translationY;
      const scale = (width * 1.5) / Math.max(1, Math.hypot(vx, vy));
      const out = { duration: 220, easing: Easing.in(Easing.quad) };
      dx.set(withTiming(e.translationX + vx * scale, out));
      dy.set(
        withTiming(e.translationY + vy * scale, out, (finished) => {
          if (finished) scheduleOnRN(onClose);
        })
      );
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dx.get() }, { translateY: dy.get() }, { rotate: `${(dx.get() / width) * 20}deg` }],
  }));
  // The backdrop fades as the card is dragged away.
  const fadeStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, 1 - Math.hypot(dx.get(), dy.get()) / (width * 1.2)),
  }));

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      {/* A Modal is its own native root on Android, so gestures inside it need their own root view. */}
      {/* The drag styles sit on wrapper views, so they don't fight the entering animations over opacity and transform. */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* Only the backdrop fades; the card stays fully opaque until it's off screen and the modal closes. */}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, fadeStyle]}>
          <Animated.View entering={FadeIn.duration(200)} style={{ flex: 1, backgroundColor: 'rgba(42, 27, 74, 0.72)' }} />
        </Animated.View>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            gap: Space[4],
            paddingTop: insets.top + Space[4],
            paddingHorizontal: Space[4],
            paddingBottom: insets.bottom + Space[4],
          }}>
          <GestureDetector gesture={pan}>
            <Animated.View style={[{ flexShrink: 1, width: '100%', maxWidth: 420, alignSelf: 'center' }, cardStyle]}>
              <Animated.View
                entering={ZoomIn.duration(400).easing(Easing.bezier(...Bounce).factory())}
                accessibilityViewIsModal
                accessibilityLabel={isNew ? `New word: ${word.word}` : `${word.word}, already in your binder`}
                accessibilityHint="Swipe the card away to close it"
                style={{ flexShrink: 1 }}>
                <WordCard
                  word={word}
                  artHeight={196}
                  style={{ flexShrink: 1 }}
                  leading={
                    <RoundButton accessibilityLabel="Close" fill={p.paper} size={44} lift={3} onPress={onClose}>
                      <CloseIcon color={p.onBright} size={16} />
                    </RoundButton>
                  }
                />
              </Animated.View>
            </Animated.View>
          </GestureDetector>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
