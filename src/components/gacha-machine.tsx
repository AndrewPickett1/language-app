import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { RarityInfo, type Rarity } from '@/data/rarity';
import { Font } from '@/theme/fonts';
import { Bounce, Bright, Fixed } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';

/** The machine is drawn in a 360×560 box and scaled to fit. */
const VW = 360;
const VH = 560;
const Pivot = { x: 318, y: 440 };
const KnobUp = 300;
const KnobTravel = 220;

export type MachinePhase = 'idle' | 'spin' | 'drop' | 'reveal';

/**
 * How far a guaranteed pull has charged the machine. `armed`: not started, the balls look as usual.
 * `flood`: the balls are turning the guaranteed rarity's colour. `charged`: every ball has, and it can be pulled.
 */
export type ChargeStep = 'armed' | 'flood' | 'charged';

const Balls: [number, number, number, string][] = [
  [110, 270, 20, Bright.sky], [160, 278, -15, Bright.leaf], [212, 270, 35, Bright.pink],
  [70, 222, -30, Bright.leaf], [120, 228, 10, Bright.tangerine], [172, 226, -40, Bright.sky],
  [222, 220, 25, Bright.sky], [264, 214, -10, Bright.leaf], [66, 172, 45, Bright.grape],
  [116, 178, -20, Bright.sky], [166, 174, 15, Bright.leaf], [214, 170, -35, Bright.pink],
  [258, 164, 30, Bright.sunshine], [100, 124, -25, Bright.sky], [150, 130, 40, Bright.tangerine],
  [200, 122, -5, Bright.grape], [240, 116, 20, Bright.sky],
];

/** The globe's inside, which clips the balls. */
const Globe = { x: 165, y: 170, r: 138 };
/** The flood spreads out from here, 6ms per unit of distance. */
const FloodOrigin = { x: 165, y: 200 };
const floodDelay = (x: number, y: number) => Math.round(Math.hypot(x - FloodOrigin.x, y - FloodOrigin.y) * 6);
/** How long a guaranteed pull's flood takes, from the first ball to the last ball's pop settling. */
export const FloodMs = Math.max(...Balls.map(([x, y]) => floodDelay(x, y))) + 460;

const BigSparkle = 'M0,-16 l4,12 12,4 -12,4 -4,12 -4,-12 -12,-4 12,-4z';
const SmallSparkle = 'M0,-12 l3,9 9,3 -9,3 -3,9 -3,-9 -9,-3 9,-3z';

type Props = {
  phase: MachinePhase;
  canPull: boolean;
  /** Called once the handle has been pulled all the way down. */
  onPull: () => void;
  prizeColor: string;
  /** The rarity the next pull is guaranteed to be. The machine floods with its colour as `charge` moves on. */
  guarantee?: Rarity | null;
  charge?: ChargeStep;
};

/**
 * The gachapon machine (the Lotto boards in the Lingo Lotto Pages design artifact). With a guarantee it
 * plays the "Guaranteed pull" boards: every ball pops into the rarity's colour in a ripple, two rings
 * spread from the middle, then the globe glows, sparkles twinkle and the slot reads GUARANTEED.
 */
export function GachaMachine({ phase, canPull, onPull, prizeColor, guarantee = null, charge = 'armed' }: Props) {
  const p = usePalette();
  const reduce = useReducedMotion();
  const tier = guarantee && charge !== 'armed' ? RarityInfo[guarantee].color : null;
  const charged = !!tier && charge === 'charged';
  const [box, setBox] = useState({ w: 0, h: 0 });
  const s = Math.min(box.w / VW, box.h / VH) || 0;

  const pull = useSharedValue(0);
  const startPull = useSharedValue(0);
  const wobble = useSharedValue(0);
  const drop = useSharedValue(0);

  useEffect(() => {
    if (phase === 'spin') {
      pull.set(withTiming(0, { duration: 450, easing: Easing.out(Easing.cubic) }));
      wobble.set(withSequence(
        ...[-3, 2.5, -2, 2, -2.5, 1.5, -1.5, 1, -0.5, 0].map((deg) => withTiming(deg, { duration: 110 }))
      ));
    }
    if (phase === 'drop') {
      drop.set(0);
      drop.set(withTiming(1, { duration: 550, easing: Easing.bezier(...Bounce) }));
    }
    if (phase === 'idle') drop.set(0);
  }, [phase, pull, wobble, drop]);

  const machineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (VH * s) / 2 }, { rotate: `${wobble.get()}deg` }, { translateY: (-VH * s) / 2 }],
  }));

  const knobY = (v: number) => {
    'worklet';
    return KnobUp + KnobTravel * v;
  };

  const barStyle = useAnimatedStyle(() => {
    const y = knobY(pull.get());
    const top = Math.min(y, Pivot.y);
    return { top: (top - 9) * s, height: (Math.abs(y - Pivot.y) + 18) * s };
  });

  const knobStyle = useAnimatedStyle(() => {
    const r = 24 + 8 * Math.sin(Math.PI * pull.get());
    return {
      left: (Pivot.x - r) * s,
      top: (knobY(pull.get()) - r) * s,
      width: r * 2 * s,
      height: r * 2 * s,
    };
  });

  const prizeStyle = useAnimatedStyle(() => ({
    opacity: drop.get() > 0 ? 1 : 0,
    transform: [{ translateY: (drop.get() - 1) * 80 * s }],
  }));

  const pan = Gesture.Pan()
    .enabled(canPull)
    .onBegin(() => {
      startPull.set(pull.get());
    })
    .onUpdate((e) => {
      pull.set(Math.max(0, Math.min(1, startPull.get() + e.translationY / (190 * s))));
    })
    .onEnd(() => {
      if (pull.get() > 0.8) {
        pull.set(withTiming(1, { duration: 80 }));
        scheduleOnRN(onPull);
      } else {
        pull.set(withTiming(0, { duration: 260, easing: Easing.out(Easing.cubic) }));
      }
    });

  const tap = Gesture.Tap()
    .enabled(canPull)
    .onEnd(() => {
      pull.set(withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }, (finished) => {
        if (finished) scheduleOnRN(onPull);
      }));
    });

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {s > 0 && (
        <Animated.View style={[{ width: VW * s, height: VH * s }, machineStyle]}>
          {/* Layers, back to front: the halo, the guarantee's glow, the globe, its balls, then the rest of the machine. */}
          <Svg width={VW * s} height={VH * s} viewBox={`0 0 ${VW} ${VH}`} style={{ position: 'absolute' }}>
            <Circle cx={165} cy={176} r={166} fill={p.sunshineSoft} />
          </Svg>
          {tier && <GlowRing color={tier} reduce={reduce} s={s} />}
          <Svg width={VW * s} height={VH * s} viewBox={`0 0 ${VW} ${VH}`} style={{ position: 'absolute' }}>
            <Rect x={135} y={14} width={60} height={26} rx={13} fill={Bright.pink} stroke={p.line} strokeWidth={4} />
            <Circle cx={165} cy={12} r={9} fill={Bright.sunshine} stroke={p.line} strokeWidth={3.5} />
            <Circle cx={165} cy={170} r={140} fill="#dff6ff" />
          </Svg>
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: (Globe.x - Globe.r) * s,
              top: (Globe.y - Globe.r) * s,
              width: Globe.r * 2 * s,
              height: Globe.r * 2 * s,
              borderRadius: Globe.r * s,
              overflow: 'hidden',
            }}>
            {Balls.map(([x, y, rot, color]) => (
              <MachineBall key={`${x}-${y}`} x={x} y={y} rot={rot} color={color} tier={tier} reduce={reduce} line={p.line} s={s} />
            ))}
            {tier && charge === 'flood' && !reduce && (
              <>
                <FloodRing color={tier} width={7} delay={0} s={s} />
                <FloodRing color="#ffffff" width={3} delay={120} s={s} />
              </>
            )}
          </View>
          <Svg width={VW * s} height={VH * s} viewBox={`0 0 ${VW} ${VH}`} style={{ position: 'absolute' }}>
            <Path d="M62,118 A112,112 0 0 1 120,58" fill="none" stroke="#ffffff" strokeWidth={13} strokeLinecap="round" />
            <Circle cx={140} cy={50} r={6} fill="#ffffff" />
            <Circle cx={165} cy={170} r={140} fill="none" stroke={p.line} strokeWidth={5} />

            <Rect x={60} y={292} width={210} height={34} rx={17} fill={Bright.sunshine} stroke={p.line} strokeWidth={4} />
            <Rect x={40} y={318} width={250} height={210} rx={36} fill={Bright.pink} stroke={p.line} strokeWidth={5} />
            <Rect x={78} y={336} width={174} height={36} rx={18} fill={Fixed.paper} stroke={p.line} strokeWidth={3.5} />
            <SvgText x={165} y={360} textAnchor="middle" fontFamily={Font.display700} fontSize={18} letterSpacing={1} fill={Fixed.onBright}>
              LINGO LOTTO
            </SvgText>
            <Rect x={62} y={390} width={92} height={110} rx={24} fill={tier ?? Fixed.paper} stroke={p.line} strokeWidth={3.5} />
            <Rect x={98} y={406} width={20} height={46} rx={10} fill={Fixed.onBright} />
            <SvgText x={108} y={482} textAnchor="middle" fontFamily={Font.body900} fontSize={tier ? 11 : 13} letterSpacing={tier ? 0.5 : 1} fill={Fixed.onBright}>
              {tier ? 'GUARANTEED' : '1 PULL'}
            </SvgText>
            <Rect x={170} y={390} width={102} height={110} rx={28} fill={Fixed.onBright} />
            <Rect x={66} y={522} width={58} height={22} rx={11} fill={p.line} />
            <Rect x={206} y={522} width={58} height={22} rx={11} fill={p.line} />

            <Rect x={290} y={300} width={56} height={236} rx={28} fill={Fixed.paper} opacity={0.55} stroke={p.line} strokeWidth={3} strokeDasharray="2 10" strokeLinecap="round" />
            <Rect x={288} y={418} width={48} height={44} rx={22} fill={Bright.sunshine} stroke={p.line} strokeWidth={4} />
          </Svg>
          {tier && (
            <>
              <Sparkle x={36} y={70} d={BigSparkle} fill={Bright.sunshine} delay={50} on={charged && !reduce} line={p.line} s={s} />
              <Sparkle x={298} y={52} d={SmallSparkle} fill={Fixed.paper} delay={300} on={charged && !reduce} line={p.line} s={s} />
              <Sparkle x={312} y={236} d={BigSparkle} fill={tier} delay={500} on={charged && !reduce} line={p.line} s={s} />
              <Sparkle x={22} y={262} d={SmallSparkle} fill={Bright.sunshine} delay={700} on={charged && !reduce} line={p.line} s={s} />
            </>
          )}

          {/* The prize drops into the chute, behind the chute's lip. */}
          <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: (221 - 27) * s, top: (448 - 27) * s }, prizeStyle]}>
            <Svg width={54 * s} height={54 * s} viewBox="-27 -27 54 54">
              <Path d="M-27,0 A27,27 0 0 0 27,0 Z" fill={Fixed.paper} />
              <Path d="M-27,0 A27,27 0 0 1 27,0 Z" fill={prizeColor} />
              <Rect x={-16} y={-20} width={13} height={6} rx={3} fill="#ffffff" transform="rotate(-30 -9.5 -17)" />
              <Line x1={-27} y1={0} x2={27} y2={0} stroke={Fixed.onBright} strokeWidth={3.5} />
              <Circle r={26} fill="none" stroke={Fixed.paper} strokeWidth={2} />
            </Svg>
          </Animated.View>
          <Svg pointerEvents="none" width={VW * s} height={VH * s} viewBox={`0 0 ${VW} ${VH}`} style={{ position: 'absolute' }}>
            <Rect x={176} y={466} width={90} height={26} rx={13} fill={Bright.sunshine} stroke={p.line} strokeWidth={3.5} />
          </Svg>

          {/* Handle */}
          <Animated.View
            pointerEvents="none"
            style={[{ position: 'absolute', left: (Pivot.x - 9) * s, width: 18 * s, borderRadius: 9 * s, backgroundColor: p.line, padding: 4.5 * s }, barStyle]}>
            <View style={{ flex: 1, borderRadius: 5 * s, backgroundColor: Fixed.paper }} />
          </Animated.View>
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: (Pivot.x - 11) * s,
              top: (Pivot.y - 11) * s,
              width: 22 * s,
              height: 22 * s,
              borderRadius: 11 * s,
              backgroundColor: Bright.sunshine,
              borderColor: p.line,
              borderWidth: 4 * s,
            }}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                borderRadius: 999,
                backgroundColor: canPull ? Bright.cherry : Bright.locked,
                borderColor: p.line,
                borderWidth: 4.5 * s,
              },
              knobStyle,
            ]}>
            <View
              style={{
                position: 'absolute',
                left: '18%',
                top: '16%',
                width: 12 * s,
                height: 7 * s,
                borderRadius: 4 * s,
                backgroundColor: '#ffffff',
                transform: [{ rotate: '-35deg' }],
              }}
            />
          </Animated.View>

          <GestureDetector gesture={Gesture.Exclusive(pan, tap)}>
            <View
              accessible
              accessibilityRole="button"
              accessibilityLabel="Handle"
              accessibilityHint={
                canPull
                  ? guarantee
                    ? `Slide down to pull a guaranteed ${RarityInfo[guarantee].name} capsule`
                    : 'Slide down to pull a capsule'
                  : guarantee && !charged
                    ? 'Charging'
                    : 'Out of pulls'
              }
              accessibilityState={{ disabled: !canPull }}
              onAccessibilityTap={() => {
                if (canPull) onPull();
              }}
              style={{ position: 'absolute', left: 280 * s, top: 270 * s, width: 90 * s, height: 290 * s }}
            />
          </GestureDetector>
        </Animated.View>
      )}
    </View>
  );
}

type BallProps = { x: number; y: number; rot: number; color: string; tier: string | null; reduce: boolean; line: string; s: number };

/**
 * One capsule in the globe. When `tier` is set it pops (scale and a little twist) as the flood reaches it,
 * and switches to the tier's colour just after. Reduced motion switches it straight away.
 */
function MachineBall({ x, y, rot, color, tier, reduce, line, s }: BallProps) {
  const scale = useSharedValue(1);
  const turn = useSharedValue(0);
  const flood = useSharedValue(0);
  const delay = floodDelay(x, y);
  const on = tier !== null;

  useEffect(() => {
    if (!on) {
      cancelAnimation(scale);
      cancelAnimation(turn);
      cancelAnimation(flood);
      scale.set(1);
      turn.set(0);
      flood.set(0);
      return;
    }
    if (reduce) {
      flood.set(1);
      return;
    }
    const step = (ms: number) => ({ duration: ms, easing: Easing.inOut(Easing.quad) });
    scale.set(withDelay(delay, withSequence(withTiming(1.3, step(147)), withTiming(0.9, step(126)), withTiming(1, step(147)))));
    turn.set(withDelay(delay, withSequence(withTiming(-12, step(147)), withTiming(6, step(126)), withTiming(0, step(147)))));
    flood.set(withDelay(delay + 120, withTiming(1, { duration: 0 })));
  }, [on, reduce, delay, scale, turn, flood]);

  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }, { rotate: `${turn.get()}deg` }] }));
  const floodStyle = useAnimatedStyle(() => ({ opacity: flood.get() }));

  return (
    <Animated.View
      style={[{ position: 'absolute', left: (x - 27 - (Globe.x - Globe.r)) * s, top: (y - 27 - (Globe.y - Globe.r)) * s, width: 54 * s, height: 54 * s }, popStyle]}>
      <BallArt color={color} rot={rot} line={line} s={s} />
      {tier && (
        <Animated.View style={[{ position: 'absolute', top: 0, left: 0 }, floodStyle]}>
          <BallArt color={tier} rot={rot} line={line} s={s} />
        </Animated.View>
      )}
    </Animated.View>
  );
}

function BallArt({ color, rot, line, s }: { color: string; rot: number; line: string; s: number }) {
  return (
    <Svg width={54 * s} height={54 * s} viewBox="-27 -27 54 54">
      <G transform={`rotate(${rot})`}>
        <Path d="M-25,0 A25,25 0 0 1 25,0 Z" fill={color} />
        <Path d="M-25,0 A25,25 0 0 0 25,0 Z" fill={Fixed.paper} />
        <Line x1={-25} y1={0} x2={25} y2={0} stroke={line} strokeWidth={3} />
        <Circle r={25} fill="none" stroke={line} strokeWidth={3.5} />
      </G>
    </Svg>
  );
}

/** A ring that spreads from the flood's origin and fades, inside the globe. */
function FloodRing({ color, width, delay, s }: { color: string; width: number; delay: number; s: number }) {
  const v = useSharedValue(0);

  useEffect(() => {
    v.set(withDelay(delay, withTiming(1, { duration: 800, easing: Easing.bezier(0.2, 0.7, 0.3, 1) })));
    return () => cancelAnimation(v);
  }, [v, delay]);

  const style = useAnimatedStyle(() => ({ opacity: 1 - v.get(), transform: [{ scale: 0.2 + 7.4 * v.get() }] }));
  const size = 54 * s;
  const left = (FloodOrigin.x - (Globe.x - Globe.r)) * s - size / 2;
  const top = (FloodOrigin.y - (Globe.y - Globe.r)) * s - size / 2;

  return (
    <Animated.View style={[{ position: 'absolute', left, top, width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="-27 -27 54 54">
        <Circle r={20} fill="none" stroke={color} strokeWidth={width} />
      </Svg>
    </Animated.View>
  );
}

/** The guarantee's glow around the globe, pulsing gently. Steady with reduced motion. */
function GlowRing({ color, reduce, s }: { color: string; reduce: boolean; s: number }) {
  const v = useSharedValue(reduce ? 1 : 0.4);

  useEffect(() => {
    if (reduce) return;
    v.set(withRepeat(withSequence(withTiming(1, { duration: 800 }), withTiming(0.4, { duration: 800 })), -1, false));
    return () => cancelAnimation(v);
  }, [v, reduce]);

  const style = useAnimatedStyle(() => ({ opacity: v.get() }));
  const r = 156;

  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: (Globe.x - r) * s, top: (Globe.y - r) * s }, style]}>
      <Svg width={r * 2 * s} height={r * 2 * s} viewBox={`${-r} ${-r} ${r * 2} ${r * 2}`}>
        <Circle r={148} fill="none" stroke={color} strokeWidth={14} />
      </Svg>
    </Animated.View>
  );
}

type SparkleProps = { x: number; y: number; d: string; fill: string; delay: number; on: boolean; line: string; s: number };

/** A star that twinkles three times once the machine is charged. */
function Sparkle({ x, y, d, fill, delay, on, line, s }: SparkleProps) {
  const v = useSharedValue(0);

  useEffect(() => {
    if (!on) return;
    const half = { duration: 550, easing: Easing.inOut(Easing.quad) };
    v.set(withDelay(delay, withRepeat(withSequence(withTiming(1, half), withTiming(0, half)), 3, false)));
    return () => {
      cancelAnimation(v);
      v.set(0);
    };
  }, [v, on, delay]);

  const style = useAnimatedStyle(() => ({ opacity: v.get(), transform: [{ scale: v.get() }, { rotate: `${45 * v.get()}deg` }] }));
  const size = 36 * s;

  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: x * s - size / 2, top: y * s - size / 2, width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="-18 -18 36 36">
        <Path d={d} fill={fill} stroke={line} strokeWidth={2.5} strokeLinejoin="round" />
      </Svg>
    </Animated.View>
  );
}
