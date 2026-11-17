import { useEffect, useId, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { StarIcon } from '@/components/icons';
import { Txt } from '@/components/text';
import { hasMastered, StageInfo, stageA11y, type Stage } from '@/data/mastery';
import { Font } from '@/theme/fonts';
import { Radius, Stroke } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';
import type { WordProgress } from '@/utils/word-progress';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * A foil gradient filling its parent (put it first, inside a frame with a border radius). `moving` slides
 * it slowly back and forth, the holo shimmer of a mastered card; reduced motion keeps it still.
 */
export function Foil({ colors, radius, moving = false }: { colors: string[]; radius: number; moving?: boolean }) {
  const reduce = useReducedMotion();
  const id = `foil-${useId().replace(/:/g, '')}`;
  const [width, setWidth] = useState(0);
  const shift = useSharedValue(0);
  const animate = moving && !reduce;

  useEffect(() => {
    if (!animate) return;
    shift.set(withRepeat(withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.ease) }), -1, true));
    return () => cancelAnimation(shift);
  }, [animate, shift]);

  // A moving foil is three widths wide and slides two of them, like a background-position sweep.
  const span = animate ? width * 3 : width;
  const slide = useAnimatedStyle(() => ({ transform: [{ translateX: -shift.get() * width * 2 }] }), [width]);

  return (
    <View
      pointerEvents="none"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', borderRadius: radius }}>
      {width > 0 && (
        <Animated.View style={[{ position: 'absolute', top: 0, bottom: 0, left: 0, width: span }, slide]}>
          <Svg width="100%" height="100%">
            <Defs>
              <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0.45">
                {colors.map((c, i) => (
                  <Stop key={i} offset={i / (colors.length - 1)} stopColor={c} />
                ))}
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill={`url(#${id})`} />
          </Svg>
        </Animated.View>
      )}
    </View>
  );
}

const RingR = 11;
const RingC = 2 * Math.PI * RingR;

/**
 * A word's progress ring: an arc filled to its strength in the stage colour, full with a star once
 * mastered (and a muted star when rusty), an empty track for a new word. It fills in once on mount.
 */
export function ProgressRing({ stage, strength, size = 30 }: { stage: Stage; strength: number; size?: number }) {
  const p = usePalette();
  const reduce = useReducedMotion();
  const info = StageInfo[stage];
  const share = stage === 'mastered' ? 1 : stage === 'new' ? 0 : strength / 100;
  const fill = useSharedValue(reduce ? share : 0);

  useEffect(() => {
    fill.set(reduce ? share : withTiming(share, { duration: 700, easing: Easing.bezier(0.34, 1.3, 0.64, 1) }));
  }, [fill, share, reduce]);

  const arc = useAnimatedProps(() => ({ strokeDasharray: [Math.max(0, fill.get()) * RingC, RingC] }));

  return (
    <Svg width={size} height={size} viewBox="0 0 30 30">
      <Circle cx={15} cy={15} r={RingR} fill={info.inner} stroke={p.line} strokeWidth={7} />
      <Circle cx={15} cy={15} r={RingR} fill="none" stroke="#f0e6d6" strokeWidth={4} />
      {info.ring && share > 0 && (
        <AnimatedCircle animatedProps={arc} cx={15} cy={15} r={RingR} fill="none" stroke={info.ring} strokeWidth={4} strokeLinecap="round" transform="rotate(-90 15 15)" />
      )}
      {hasMastered(stage) && info.ring && (
        <Path d="M15 9.6l1.6 3.4 3.7.4-2.8 2.5.8 3.7L15 17.7l-3.3 1.9.8-3.7-2.8-2.5 3.7-.4z" fill={info.ring} stroke={p.line} strokeWidth={1.4} strokeLinejoin="round" />
      )}
    </Svg>
  );
}

/** The stage's name on its chip, with a star once mastered. */
export function StageChip({ stage, style }: { stage: Stage; style?: StyleProp<ViewStyle> }) {
  const p = usePalette();
  const info = StageInfo[stage];
  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 1, backgroundColor: info.chip, borderColor: p.line, borderWidth: Stroke[1], borderRadius: Radius.pill },
        style,
      ]}>
      {hasMastered(stage) && <StarIcon color={p.line} fill={p.onBright} size={12} />}
      <Txt color={p.onBright} style={{ fontFamily: Font.body900, fontSize: 13, lineHeight: 18 }}>
        {info.name}
      </Txt>
    </View>
  );
}

/**
 * A bar's fill, `to` percent wide, growing from `from` once on mount (after `delay` ms). Put it in a
 * track; reduced motion shows it at full length straight away.
 */
export function GrowFill({ to, from = 0, color, delay = 0, style }: { to: number; from?: number; color: string; delay?: number; style?: StyleProp<ViewStyle> }) {
  const reduce = useReducedMotion();
  const width = useSharedValue(reduce ? to : from);

  useEffect(() => {
    width.set(reduce ? to : withDelay(delay, withTiming(to, { duration: 600, easing: Easing.bezier(0.34, 1.3, 0.64, 1) })));
  }, [width, to, delay, reduce]);

  const grow = useAnimatedStyle(() => ({ width: `${Math.max(0, Math.min(100, width.get()))}%` }));
  return <Animated.View style={[{ height: '100%', backgroundColor: color, borderRadius: Radius.pill }, style, grow]} />;
}

/** A word's ring with its stage name and sub-label beside it, so colour is never the only signal. */
export function ProgressCell({ progress, sub }: { progress: Pick<WordProgress, 'stage' | 'strength'>; sub: string }) {
  const p = usePalette();
  return (
    <View accessible accessibilityLabel={stageA11y(progress)} style={{ flexDirection: 'row', alignItems: 'center', gap: 7, minWidth: 0 }}>
      <ProgressRing stage={progress.stage} strength={progress.strength} />
      <View style={{ flexShrink: 1, minWidth: 0 }}>
        <Txt numberOfLines={1} style={{ fontFamily: Font.body900, fontSize: 13, lineHeight: 16 }}>
          {StageInfo[progress.stage].name}
        </Txt>
        <Txt numberOfLines={1} color={p.inkMuted} style={{ fontFamily: Font.body800, fontSize: 11, lineHeight: 14 }}>
          {sub}
        </Txt>
      </View>
    </View>
  );
}
