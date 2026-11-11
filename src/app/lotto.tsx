import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Alert, Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeIn,
  ZoomIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { Capsule } from '@/components/art/capsule';
import { FloodMs, GachaMachine, type ChargeStep, type MachinePhase } from '@/components/gacha-machine';
import { CloseIcon, RechargeClockIcon } from '@/components/icons';
import { CardShine, RareBackdrop, RareBanner, RareCardEntrance, RareStage, useRareReveal } from '@/components/rare-reveal';
import { Screen, ScreenHeader } from '@/components/screen';
import { RoundButton } from '@/components/sticker';
import { StreakPopup } from '@/components/streak-popup';
import { Txt } from '@/components/text';
import { WordCard } from '@/components/word-card';
import { RarityInfo, starString, type Rarity } from '@/data/rarity';
import { useGame, type PullResult } from '@/state/game';
import { useLotto, useLottoCountdown } from '@/state/lotto';
import { useStreak } from '@/state/streak';
import { Font } from '@/theme/fonts';
import { Bounce, Radius, Space, Stroke } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';

/** How long the machine waits after the screen opens before a guaranteed pull starts charging, as in the design. */
const ChargeDelayMs = 700;

export default function LottoScreen() {
  const p = usePalette();
  const game = useGame();
  const streak = useStreak();
  const [phase, setPhase] = useState<MachinePhase>('idle');
  const [prize, setPrize] = useState<PullResult | null>(null);
  const lotto = useLotto();
  const countdown = useLottoCountdown();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  // `phase` only changes on the next render, so a second tap in the same frame is stopped here.
  const busy = useRef(false);
  const reduce = useReducedMotion();
  // Bumped whenever the screen gains focus or a card closes, so a guaranteed pull charges up again each time.
  const [run, setRun] = useState(0);
  const [charge, setCharge] = useState<{ key: string; step: ChargeStep } | null>(null);
  // The spend clears the guarantee straight away, so the one being pulled is held until the card closes.
  const [pulling, setPulling] = useState<Rarity | null>(null);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const { refresh } = lotto;
  useFocusEffect(
    useCallback(() => {
      void refresh();
      setRun((r) => r + 1);
    }, [refresh])
  );

  // A guaranteed pull charges the machine first: after a moment every ball floods with the rarity's colour,
  // and only then can the handle be pulled. Reduced motion skips straight to charged.
  const chargeKey = lotto.guarantee ? `${lotto.guarantee}:${run}` : null;
  useEffect(() => {
    if (!chargeKey || !lotto.guarantee) return;
    const name = RarityInfo[lotto.guarantee].name;
    const timers = [
      setTimeout(() => setCharge({ key: chargeKey, step: 'flood' }), reduce ? 0 : ChargeDelayMs),
      setTimeout(
        () => {
          setCharge({ key: chargeKey, step: 'charged' });
          AccessibilityInfo.announceForAccessibility(`Every capsule is now ${name}. Pull the handle.`);
        },
        reduce ? 0 : ChargeDelayMs + FloodMs
      ),
    ];
    return () => timers.forEach(clearTimeout);
  }, [chargeKey, lotto.guarantee, reduce]);

  const guarantee = phase === 'idle' ? lotto.guarantee : pulling;
  const chargeStep: ChargeStep = phase !== 'idle' ? 'charged' : charge && charge.key === chargeKey ? charge.step : 'armed';
  const charging = !!guarantee && chargeStep !== 'charged';

  const canPull = lotto.currentPulls > 0 && !lotto.spending && phase === 'idle' && !charging;

  const onPull = async () => {
    if (phase !== 'idle' || busy.current) return;
    busy.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    // Spin while the word is fetched, so the machine reacts to the tap straight away.
    setPrize(null);
    setPulling(lotto.guarantee);
    setPhase('spin');
    const started = Date.now();
    let result: PullResult | null;
    try {
      result = await game.pull();
    } catch (e) {
      setPhase('idle');
      Alert.alert("Couldn't pull a word", e instanceof Error ? e.message : 'Try again.');
      return;
    } finally {
      busy.current = false;
    }
    // Out of pulls (maybe spent on another device): the countdown shows instead.
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

  const prizeColor = prize ? RarityInfo[prize.word.rarity].color : p.sky;
  const flooded = guarantee && chargeStep !== 'armed' ? guarantee : null;
  const status = phase === 'reveal' ? 'Pulled' : phase !== 'idle' ? 'Here it comes…' : charging ? 'Charging…' : 'Pull!';

  const closeReveal = () => {
    setPhase('idle');
    setRun((r) => r + 1);
  };

  return (
    <View style={{ flex: 1 }}>
      <Screen background={flooded ? p[RarityInfo[flooded].soft] : p.pinkSoft} style={{ gap: 14 }}>
        <ScreenHeader backLabel="Back to home" title="Lotto" />

        <GachaMachine phase={phase} canPull={canPull} onPull={onPull} prizeColor={prizeColor} guarantee={guarantee} charge={chargeStep} />

        {guarantee && (lotto.currentPulls > 0 || phase !== 'idle') ? (
          <GuaranteedTicket rarity={guarantee} lit={!!flooded} status={status} />
        ) : lotto.loading || (lotto.currentPulls === 0 && !countdown) ? (
          <View style={{ height: 64, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Space[4], backgroundColor: p.surfaceRaised, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.md }}>
            <Txt variant="label" color={p.inkMuted} style={{ fontFamily: Font.body900 }}>
              {lotto.loading ? 'Checking your pulls…' : "Couldn't check your pulls"}
            </Txt>
          </View>
        ) : (
          <View
            accessible
            accessibilityRole={countdown ? 'timer' : undefined}
            accessibilityLabel={`${lotto.currentPulls} of ${lotto.maxPulls} pulls available${countdown ? `. Next pull in ${countdown.label}` : ', fully charged'}`}
            style={{ height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingLeft: Space[4], paddingRight: Space[3], backgroundColor: lotto.currentPulls > 0 ? p.surfaceRaised : p.sunshineSoft, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {Array.from({ length: lotto.maxPulls }, (_, i) =>
                i < lotto.currentPulls ? (
                  <Capsule key={i} color={p.pink} line={p.line} size={28} shine={false} stroke={5.5} />
                ) : (
                  <View key={i} style={{ width: 28, height: 28, borderColor: p.inkMuted, borderWidth: Stroke[2], borderStyle: 'dashed', borderRadius: Radius.pill }} />
                )
              )}
            </View>
            {countdown && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: Space[1], paddingLeft: 6, paddingRight: 11, backgroundColor: p.white, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.pill }}>
                <RechargeClockIcon color={p.line} fill={p.tangerine} track={p.sunshineSoft} face={p.white} progress={countdown.progress} />
                <Txt style={{ fontFamily: Font.display700, fontSize: 18, lineHeight: 22, fontVariant: ['tabular-nums'] }}>{countdown.label}</Txt>
              </View>
            )}
          </View>
        )}
      </Screen>

      {phase === 'reveal' && prize && (
        <Reveal prize={prize} onClose={closeReveal} />
      )}
      {/* The first pull of the day grows the streak; celebrate once the word card is closed. */}
      {streak.streakPopup && phase === 'idle' && <StreakPopup reason={streak.streakPopup} streak={streak.streak} onClose={streak.closeStreakPopup} />}
    </View>
  );
}

type TicketProps = { rarity: Rarity; lit: boolean; status: string };

/**
 * Stands in for the pulls bar while the next pull is guaranteed: a ticket naming the rarity, with a status chip.
 * It lights up in the rarity's colour, with a little wobble, once the machine starts charging.
 */
function GuaranteedTicket({ rarity, lit, status }: TicketProps) {
  const p = usePalette();
  const info = RarityInfo[rarity];
  const wobble = useSharedValue(0);

  useEffect(() => {
    if (!lit) return;
    const step = { duration: 200, easing: Easing.out(Easing.quad) };
    wobble.set(withSequence(withTiming(1, step), withTiming(0, { ...step, duration: 300 })));
  }, [lit, wobble]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: 1 + 0.06 * wobble.get() }, { rotate: `${-1.5 * wobble.get()}deg` }] }));

  return (
    <Animated.View
      accessible
      accessibilityLabel={`Guaranteed ${info.name} pull. ${status}`}
      style={[
        {
          height: 64,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingLeft: 14,
          paddingRight: 10,
          backgroundColor: lit ? info.color : p.surfaceRaised,
          borderColor: p.line,
          borderWidth: Stroke[2],
          borderRadius: Radius.md,
        },
        style,
      ]}>
      <TicketIcon line={p.line} paper={p.paper} star={p.sunshine} />
      <View style={{ gap: 1, flexShrink: 1 }}>
        <Txt color={p.onBright} style={{ fontFamily: Font.body900, fontSize: 12, lineHeight: 16, letterSpacing: 0.7 }}>
          {starString(rarity)} GUARANTEED
        </Txt>
        <Txt color={p.onBright} style={{ fontFamily: Font.display700, fontSize: 20, lineHeight: 24 }}>
          {info.name} pull
        </Txt>
      </View>
      <View style={{ marginLeft: 'auto', paddingVertical: 5, paddingHorizontal: 12, backgroundColor: p.white, borderColor: p.line, borderWidth: 2, borderRadius: Radius.pill }}>
        <Txt color={p.onBright} style={{ fontFamily: Font.body800, fontSize: 14, lineHeight: 18 }}>
          {status}
        </Txt>
      </View>
    </Animated.View>
  );
}

function TicketIcon({ line, paper, star }: { line: string; paper: string; star: string }) {
  return (
    <Svg width={34} height={34} viewBox="0 0 34 34">
      <Path
        d="M5,9 h24 a3,3 0 0 1 3,3 v2 a3,3 0 0 0 0,6 v2 a3,3 0 0 1 -3,3 h-24 a3,3 0 0 1 -3,-3 v-2 a3,3 0 0 0 0,-6 v-2 a3,3 0 0 1 3,-3z"
        fill={paper}
        stroke={line}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <Path d="M17,12.5 l1.4,3 3.2,.4 -2.4,2.2 .6,3.2 -2.8,-1.6 -2.8,1.6 .6,-3.2 -2.4,-2.2 3.2,-.4z" fill={star} stroke={line} strokeWidth={1.6} strokeLinejoin="round" />
    </Svg>
  );
}

type RevealProps = { prize: PullResult; onClose: () => void };

/** How far (as a share of the screen width) or how fast (px/s) a drag has to go to swipe the card away. */
const SwipeDistance = 0.3;
const SwipeVelocity = 900;

/**
 * The pulled word's card pops up over the machine. It's already been saved to the binder by `pull()`,
 * so there's nothing to confirm: the card is closed with its close button or swiped away in any direction.
 * Super and Ultra Rare words play the rare reveal first, and the card can't be swiped until it's done.
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
  // Super and Ultra Rare play the rare reveal before the card shows.
  const reveal = useRareReveal(word.rarity);

  const pan = Gesture.Pan()
    .enabled(reveal.done)
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

  const card = (
    <WordCard
      word={word}
      artHeight={196}
      style={{ flexShrink: 1 }}
      artOverlay={reveal.rare && reveal.done && !reveal.reduce && <CardShine loop={reveal.ultra} />}
      leading={
        <RoundButton accessibilityLabel="Close" fill={p.paper} size={44} lift={3} onPress={onClose}>
          <CloseIcon color={p.onBright} size={16} />
        </RoundButton>
      }
    />
  );

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      {/* A Modal is its own native root on Android, so gestures inside it need their own root view. */}
      {/* The drag styles sit on wrapper views, so they don't fight the entering animations over opacity and transform. */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* Only the backdrop fades; the card stays fully opaque until it's off screen and the modal closes. */}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, fadeStyle]}>
          <Animated.View entering={FadeIn.duration(200)} style={{ flex: 1, backgroundColor: reveal.rare ? RareBackdrop : 'rgba(42, 27, 74, 0.72)' }} />
          {reveal.rare && <RareStage rarity={word.rarity} step={reveal.step} reduce={reveal.reduce} />}
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
          {reveal.rare && (
            <Animated.View pointerEvents="none" style={[{ marginHorizontal: -Space[4] }, fadeStyle]}>
              <RareBanner rarity={word.rarity} step={reveal.step} />
            </Animated.View>
          )}
          <GestureDetector gesture={pan}>
            <Animated.View style={[{ flexShrink: 1, width: '100%', maxWidth: 420, alignSelf: 'center' }, cardStyle]}>
              <Animated.View
                entering={reveal.rare ? undefined : ZoomIn.duration(400).easing(Easing.bezier(...Bounce).factory())}
                accessibilityViewIsModal
                accessibilityLabel={isNew ? `New word: ${word.word}` : `${word.word}, already in your binder`}
                accessibilityHint="Swipe the card away to close it"
                style={{ flexShrink: 1 }}>
                {reveal.rare ? (
                  <RareCardEntrance ultra={reveal.ultra} reduce={reveal.reduce} shown={reveal.done}>
                    {card}
                  </RareCardEntrance>
                ) : (
                  card
                )}
              </Animated.View>
            </Animated.View>
          </GestureDetector>
        </View>
        {/* Tap anywhere to skip straight to the card. */}
        {!reveal.done && <Pressable accessibilityRole="button" accessibilityLabel="Skip animation" onPress={reveal.skip} style={StyleSheet.absoluteFill} />}
      </GestureHandlerRootView>
    </Modal>
  );
}
