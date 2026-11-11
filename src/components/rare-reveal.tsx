import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Path, Rect, Text as SvgText } from 'react-native-svg';

import { LottoMascot } from '@/components/art/lotto-mascot';
import { RarityInfo, type Rarity } from '@/data/rarity';
import { Font } from '@/theme/fonts';
import { Bounce, Bright, Fixed, Themes } from '@/theme/tokens';

/**
 * The rare pull reveal (the "Lotto — rare pull reveal" board in the Lingo Lotto Pages design artifact).
 * It plays instead of the normal card pop for Super Rare and Ultra Rare: the screen dims, the capsule drops
 * and shakes harder as rays build, then bursts open with a flash and confetti. The rarity name slams in,
 * the stars pop one by one, and the card flips in with a shine. Ultra adds a fake-out (the capsule starts grape,
 * then flashes tangerine with a gold ring), double rays, more confetti, a looping shine, sparkles and Lotto cheering.
 */

type Tier = {
  /** When each step starts, in ms after `StartMs`: drop, shake, hard shake, burst, banner, card. */
  times: number[];
  ultra: boolean;
};

const Tiers: Partial<Record<Rarity, Tier>> = {
  superRare: { times: [0, 650, 1350, 1900, 2250, 2800], ultra: false },
  ultraRare: { times: [0, 650, 1400, 2500, 2850, 3450], ultra: true },
};

const StartMs = 250;
/** The card is showing and the animation is over. */
export const RevealDone = 6;

/** The dark stage behind the rare reveal. */
export const RareBackdrop = Themes.dark.surface;
const Line = Themes.dark.line;

const StarPath = 'M12 2.8l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 16.8l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z';
const SparklePath = 'M12 1.5l2.6 7.9 7.9 2.6-7.9 2.6L12 22.5l-2.6-7.9L1.5 12l7.9-2.6z';

/**
 * Steps the rare reveal along its timeline. Other rarities, and reduced motion, start on the last step.
 * `skip` jumps straight to the card.
 */
export function useRareReveal(rarity: Rarity) {
  const tier = Tiers[rarity];
  const reduce = useReducedMotion();
  const animate = !!tier && !reduce;
  const [step, setStep] = useState(animate ? 0 : RevealDone);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!animate || !tier) return;
    const pending = tier.times.map((ms, i) => setTimeout(() => setStep(i + 1), StartMs + ms));
    timers.current = pending;
    return () => pending.forEach(clearTimeout);
  }, [animate, tier]);

  useEffect(() => {
    if (step === 3 && tier?.ultra) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (step === 4) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  }, [step, tier]);

  const skip = () => {
    timers.current.forEach(clearTimeout);
    setStep(RevealDone);
  };

  return { rare: !!tier, ultra: !!tier?.ultra, reduce, step, done: step >= RevealDone, skip };
}

type StageProps = { rarity: Rarity; step: number; reduce: boolean };

/** Everything behind the card: rays, the charging sparkles, the capsule, the flash and the confetti. */
export function RareStage({ rarity, step, reduce }: StageProps) {
  const ultra = !!Tiers[rarity]?.ultra;
  const color = RarityInfo[rarity].color;
  const rays = step >= 4 ? (ultra ? 0.5 : 0.4) : step === 3 ? 0.22 : step === 2 ? 0.12 : 0;

  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
      <Rays size={820} count={16} spread={9} color={color} duration={14000} opacity={rays} spin={!reduce} />
      {ultra && <Rays size={640} count={12} spread={4} color={Bright.sunshine} duration={20000} reverse opacity={rays} spin={!reduce} />}
      {(step === 2 || step === 3) && ChargeSparkles.map((s) => <Sparkle key={`${s.x},${s.y}`} {...s} fill={Bright.sunshine} />)}
      {ultra && step === 3 && <Ping />}
      {step >= 1 && step < RevealDone && <BurstCapsule step={step} color={ultra && step < 3 ? Bright.grape : color} />}
      {step >= 4 && <Flash />}
      {step >= 4 && <Confetti ultra={ultra} />}
    </View>
  );
}

type RaysProps = { size: number; count: number; spread: number; color: string; duration: number; reverse?: boolean; opacity: number; spin: boolean };

/** A disc of wedges that slowly turns, standing in for the design's conic gradient. */
function Rays({ size, count, spread, color, duration, reverse, opacity, spin }: RaysProps) {
  const turn = useSharedValue(0);
  const fade = useSharedValue(0);

  useEffect(() => {
    if (!spin) return;
    turn.set(withRepeat(withTiming(reverse ? -360 : 360, { duration, easing: Easing.linear }), -1, false));
    return () => cancelAnimation(turn);
  }, [turn, spin, reverse, duration]);

  useEffect(() => {
    fade.set(withTiming(opacity, { duration: 500, easing: Easing.out(Easing.quad) }));
  }, [fade, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: fade.get(), transform: [{ rotate: `${turn.get()}deg` }] }));

  const r = size / 2;
  const point = (deg: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return `${r + r * Math.cos(a)},${r + r * Math.sin(a)}`;
  };
  const d = Array.from({ length: count }, (_, i) => {
    const from = (i * 360) / count;
    return `M${r},${r} L${point(from)} A${r},${r} 0 0 1 ${point(from + spread)} Z`;
  }).join(' ');

  return (
    <Animated.View style={[{ position: 'absolute', width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Path d={d} fill={color} />
      </Svg>
    </Animated.View>
  );
}

/** Sparkles that twinkle round the capsule while it charges, as offsets from its centre. */
const ChargeSparkles = [
  { x: -114, y: -69, size: 22, delay: 0 },
  { x: 115, y: -76, size: 28, delay: 0.3 },
  { x: -90, y: 83, size: 26, delay: 0.6 },
  { x: 103, y: 70, size: 20, delay: 0.15 },
  { x: -6, y: -121, size: 18, delay: 0.45 },
  { x: 2, y: 131, size: 22, delay: 0.75 },
];

type SparkleProps = { size: number; delay: number; fill: string; x?: number; y?: number; style?: object };

function Sparkle({ size, delay, fill, x = 0, y = 0, style }: SparkleProps) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.set(withDelay(delay * 1000, withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }), -1, false)));
    return () => cancelAnimation(t);
  }, [t, delay]);

  const animated = useAnimatedStyle(() => {
    // Up and back down once per loop.
    const k = 1 - Math.abs(t.get() * 2 - 1);
    return {
      opacity: 0.2 + 0.8 * k,
      transform: [{ translateX: x }, { translateY: y }, { scale: 0.3 + 0.7 * k }, { rotate: `${45 * k}deg` }],
    };
  });

  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size }, style, animated]}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d={SparklePath} fill={fill} stroke={Line} strokeWidth={1.8} strokeLinejoin="round" />
      </Svg>
    </Animated.View>
  );
}

/** The gold ring that rings out twice when an Ultra capsule shows its true colour. */
function Ping() {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withRepeat(withTiming(1, { duration: 550, easing: Easing.out(Easing.quad) }), 2, false));
  }, [t]);
  const style = useAnimatedStyle(() => ({ opacity: 1 - t.get(), transform: [{ scale: 0.5 + 1.4 * t.get() }] }));
  return <Animated.View style={[{ position: 'absolute', width: 200, height: 200, borderWidth: 8, borderColor: Bright.sunshine, borderRadius: 999 }, style]} />;
}

const CapsuleSize = 170;

/** The capsule drops in, shakes (harder from step 3), then splits at step 4: the top flies up, the bottom falls away. */
function BurstCapsule({ step, color }: { step: number; color: string }) {
  const drop = useSharedValue(-520);
  const shake = useSharedValue(0);
  const hard = useSharedValue(0);
  const top = useSharedValue(0);
  const bottom = useSharedValue(0);

  useEffect(() => {
    if (step === 1) {
      drop.set(withSequence(
        withTiming(14, { duration: 410, easing: Easing.in(Easing.quad) }),
        withTiming(-8, { duration: 95, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 95, easing: Easing.in(Easing.quad) })
      ));
    }
    if (step === 2 || step === 3) {
      drop.set(0);
      hard.set(step === 3 ? 1 : 0);
      shake.set(0);
      shake.set(withRepeat(withTiming(1, { duration: step === 3 ? 200 : 380, easing: Easing.linear }), -1, false));
    }
    if (step >= 4) {
      cancelAnimation(shake);
      shake.set(0);
      top.set(withTiming(1, { duration: 700, easing: Easing.bezier(0.2, 0.7, 0.4, 1) }));
      bottom.set(withTiming(1, { duration: 700, easing: Easing.bezier(0.5, 0, 0.8, 0.6) }));
    }
  }, [step, drop, shake, hard, top, bottom]);

  const bodyStyle = useAnimatedStyle(() => {
    const t = shake.get();
    if (hard.get()) {
      return {
        transform: [
          { translateY: drop.get() + interpolate(t, [0, 0.2, 0.4, 0.6, 0.8, 1], [0, 2, -4, 4, -2, 0]) },
          { translateX: interpolate(t, [0, 0.2, 0.4, 0.6, 0.8, 1], [0, -6, 6, -4, 4, 0]) },
          { rotate: `${interpolate(t, [0, 0.2, 0.4, 0.6, 0.8, 1], [0, -12, 10, -9, 8, 0])}deg` },
        ],
      };
    }
    return { transform: [{ translateY: drop.get() }, { rotate: `${interpolate(t, [0, 0.25, 0.75, 1], [0, -7, 7, 0])}deg` }] };
  });
  const topStyle = useAnimatedStyle(() => ({
    opacity: 1 - top.get(),
    transform: [{ translateX: 140 * top.get() }, { translateY: -460 * top.get() }, { rotate: `${240 * top.get()}deg` }],
  }));
  const bottomStyle = useAnimatedStyle(() => ({
    opacity: 1 - bottom.get(),
    transform: [{ translateX: -90 * bottom.get() }, { translateY: 520 * bottom.get() }, { rotate: `${-150 * bottom.get()}deg` }],
  }));

  const half = CapsuleSize / 2;
  return (
    <Animated.View style={[{ position: 'absolute', width: CapsuleSize, height: CapsuleSize }, bodyStyle]}>
      <Animated.View style={[{ position: 'absolute', top: half, width: CapsuleSize, height: half }, bottomStyle]}>
        <Svg width={CapsuleSize} height={half} viewBox="-62 0 124 62" style={{ overflow: 'visible' }}>
          <Path d="M-56,0 A56,56 0 0 0 56,0 Z" fill={Fixed.paper} stroke={Line} strokeWidth={5} strokeLinejoin="round" />
        </Svg>
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', top: 0, width: CapsuleSize, height: half }, topStyle]}>
        <Svg width={CapsuleSize} height={half} viewBox="-62 -62 124 62" style={{ overflow: 'visible' }}>
          <Path d="M-56,0 A56,56 0 0 1 56,0 Z" fill={color} stroke={Line} strokeWidth={5} strokeLinejoin="round" />
          <Rect x={-36} y={-40} width={26} height={11} rx={5.5} fill={Fixed.white} transform="rotate(-32 -23 -34.5)" />
          <Path
            d="M0,-20 l3.6,7.4 8.1,1.2 -5.9,5.7 1.4,8.1 -7.2,-3.8 -7.2,3.8 1.4,-8.1 -5.9,-5.7 8.1,-1.2z"
            fill={Bright.sunshine}
            stroke={Line}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

/** A burst of paper-coloured light from the capsule. */
function Flash() {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withTiming(1, { duration: 650, easing: Easing.linear }));
  }, [t]);
  const style = useAnimatedStyle(() => {
    const k = t.get();
    return { opacity: interpolate(k, [0, 0.65, 1], [1, 1, 0]), transform: [{ scale: 1 - (1 - k) * (1 - k) }] };
  });
  return <Animated.View style={[{ position: 'absolute', width: 900, height: 900, borderRadius: 450, backgroundColor: Fixed.paper }, style]} />;
}

type Piece = { size: number; dx: number; dy: number; rot: number; t: number; delay: number; fill: string; kind: 0 | 1 | 2 };

function confettiPieces(ultra: boolean): Piece[] {
  const n = ultra ? 28 : 18;
  const fills = ultra
    ? [Bright.sunshine, Bright.tangerine, Bright.pink, Fixed.paper, Bright.sky, Bright.leaf]
    : [Bright.sunshine, Bright.grape, Fixed.paper, Bright.pink];
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + (i % 3) * 0.17;
    const d = (ultra ? 190 : 150) + ((i * 37) % 70);
    return {
      size: 12 + ((i * 7) % 12),
      dx: Math.round(Math.cos(a) * d),
      dy: Math.round(Math.sin(a) * d * 1.15),
      rot: (i % 2 ? 1 : -1) * (180 + ((i * 29) % 240)),
      t: (ultra ? 1.3 : 1.0) + (i % 4) * 0.08,
      delay: (i % 5) * 0.02,
      fill: fills[i % fills.length],
      kind: (i % 3) as Piece['kind'],
    };
  });
}

/** Stars, dots and pills flung out from the capsule. One clock drives every piece. */
function Confetti({ ultra }: { ultra: boolean }) {
  const clock = useSharedValue(0);
  const pieces = confettiPieces(ultra);
  useEffect(() => {
    clock.set(withTiming(2000, { duration: 2000, easing: Easing.linear }));
  }, [clock]);
  return pieces.map((piece, i) => <ConfettiPiece key={i} piece={piece} clock={clock} />);
}

function ConfettiPiece({ piece, clock }: { piece: Piece; clock: SharedValue<number> }) {
  const { size, dx, dy, rot, t, delay, fill, kind } = piece;
  const style = useAnimatedStyle(() => {
    const k = interpolate(clock.get() - delay * 1000, [0, t * 1000], [0, 1], Extrapolation.CLAMP);
    const e = 1 - (1 - k) * (1 - k) * (1 - k);
    return {
      opacity: interpolate(k, [0, 0.8, 1], [1, 1, 0]),
      transform: [{ translateX: dx * e }, { translateY: dy * e }, { scale: 0.3 + 0.7 * e }, { rotate: `${rot * e}deg` }],
    };
  });
  return (
    <Animated.View style={[{ position: 'absolute', width: size, height: size, justifyContent: 'center' }, style]}>
      {kind === 0 ? (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d={StarPath} fill={fill} stroke={Line} strokeWidth={2} strokeLinejoin="round" />
        </Svg>
      ) : (
        <View style={{ height: kind === 1 ? size : size * 0.45, borderRadius: 999, backgroundColor: fill, borderWidth: 2.5, borderColor: Line }} />
      )}
    </Animated.View>
  );
}

/** "SUPER RARE!" slams in from big, then the rarity's stars pop in one by one. Hidden (but laid out) until step 5. */
export function RareBanner({ rarity, step }: { rarity: Rarity; step: number }) {
  const { width } = useWindowDimensions();
  const info = RarityInfo[rarity];
  const slam = useSharedValue(0);
  const shown = step >= 5;

  useEffect(() => {
    if (shown) slam.set(withTiming(1, { duration: 500, easing: Easing.linear }));
  }, [shown, slam]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(slam.get(), [0, 0.55], [0, 1], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(slam.get(), [0, 0.55, 0.78, 1], [2.6, 0.9, 1.06, 1]) }],
  }));

  const label = `${info.name.toUpperCase()}!`;
  // Fredoka caps run about 0.6em wide, so shrink to fit narrow phones.
  const fontSize = Math.min(52, (width - 32) / (label.length * 0.6));
  const height = Math.round(fontSize * 1.12) + 8;
  const textProps = { x: width / 2, y: fontSize * 0.92 + 3, fontSize, fontFamily: Font.display700, textAnchor: 'middle' as const };

  return (
    <View
      accessible={shown}
      accessibilityLabel={`${info.name}, ${info.stars} stars`}
      importantForAccessibility={shown ? 'yes' : 'no-hide-descendants'}
      style={{ alignItems: 'center', gap: 8 }}>
      <Animated.View style={style}>
        <Svg width={width} height={height}>
          <SvgText {...textProps} y={textProps.y + 5} fill={Line} stroke={Line} strokeWidth={6} strokeLinejoin="round">
            {label}
          </SvgText>
          <SvgText {...textProps} fill={Line} stroke={Line} strokeWidth={6} strokeLinejoin="round">
            {label}
          </SvgText>
          <SvgText {...textProps} fill={info.color}>
            {label}
          </SvgText>
        </Svg>
      </Animated.View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {Array.from({ length: info.stars }, (_, i) => (
          <BannerStar key={i} delay={150 + i * 100} shown={shown} />
        ))}
      </View>
    </View>
  );
}

function BannerStar({ delay, shown }: { delay: number; shown: boolean }) {
  const t = useSharedValue(0);
  useEffect(() => {
    if (shown) t.set(withDelay(delay, withTiming(1, { duration: 420, easing: Easing.linear })));
  }, [shown, t, delay]);
  const style = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(t.get(), [0, 0.7, 1], [0, 1.35, 1]) },
      { rotate: `${interpolate(t.get(), [0, 0.7, 1], [-120, 12, 0])}deg` },
    ],
  }));
  return (
    <Animated.View style={style}>
      <Svg width={32} height={32} viewBox="0 0 24 24">
        <Path d={StarPath} fill={Bright.sunshine} stroke={Line} strokeWidth={2} strokeLinejoin="round" />
      </Svg>
    </Animated.View>
  );
}

/** Sparkles round the edge of an Ultra card, as positions on its wrapper. */
const CardSparkles = [
  { size: 26, delay: 0, style: { left: '-3%', top: '3%' } },
  { size: 22, delay: 0.5, style: { right: '-2%', top: '-2%' } },
  { size: 20, delay: 0.9, style: { left: '-4%', top: '48%' } },
  { size: 28, delay: 0.25, style: { right: '-4%', top: '42%' } },
  { size: 22, delay: 0.7, style: { left: '6%', bottom: '-3%' } },
  { size: 18, delay: 1.1, style: { left: '48%', top: '-4%' } },
];

type CardEntranceProps = { ultra: boolean; reduce: boolean; shown: boolean; children: ReactNode };

/**
 * Flips the card in from edge-on once it's `shown` (it keeps its place in the layout before that).
 * An Ultra card gets sparkles round its edge and Lotto cheering at its side.
 */
export function RareCardEntrance({ ultra, reduce, shown, children }: CardEntranceProps) {
  const flip = useSharedValue(shown ? 1 : 0);

  useEffect(() => {
    if (shown) flip.set(reduce ? 1 : withTiming(1, { duration: 500, easing: Easing.bezier(...Bounce) }));
  }, [shown, reduce, flip]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: 40 * (1 - flip.get()) }, { scaleX: flip.get() }],
  }));

  return (
    <Animated.View
      importantForAccessibility={shown ? 'auto' : 'no-hide-descendants'}
      accessibilityElementsHidden={!shown}
      style={[{ flexShrink: 1 }, style]}>
      {children}
      {shown && ultra && !reduce && CardSparkles.map((s) => <Sparkle key={s.delay} {...s} fill={Fixed.paper} />)}
      {shown && ultra && <CheeringLotto reduce={reduce} />}
    </Animated.View>
  );
}

/** Lotto pops up at the side of the art window and bobs there. */
function CheeringLotto({ reduce }: { reduce: boolean }) {
  const peek = useSharedValue(reduce ? 1 : 0);
  const bob = useSharedValue(0);

  useEffect(() => {
    if (reduce) return;
    peek.set(withDelay(350, withTiming(1, { duration: 500, easing: Easing.bezier(...Bounce) })));
    bob.set(withRepeat(withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }), -1, true));
    return () => cancelAnimation(bob);
  }, [reduce, peek, bob]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(peek.get(), [0, 0.7], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: 60 * (1 - peek.get()) - 6 * bob.get() }, { rotate: `${20 * (1 - peek.get())}deg` }],
  }));

  // Below the card's header row, so it never covers the close button or the set number.
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', right: -14, top: 80 }, style]}>
      <LottoMascot line={Line} width={76} pose="cheer" />
    </Animated.View>
  );
}

/** A band of light that sweeps across the card's art: once for Super Rare, on a loop for Ultra Rare. */
export function CardShine({ loop }: { loop: boolean }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.set(withDelay(300, withRepeat(withTiming(1, { duration: 2600, easing: Easing.linear }), loop ? -1 : 1, false)));
    return () => cancelAnimation(t);
  }, [t, loop]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(t.get(), [0, 0.45], [-140, 460], Extrapolation.CLAMP) },
      { rotate: '20deg' },
    ],
  }));

  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: -60, bottom: -60, width: 44, backgroundColor: 'rgba(255, 255, 255, 0.6)' }, style]} />;
}
