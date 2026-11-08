import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Path, Pattern, Rect } from 'react-native-svg';

import { LottoMascot, type MascotPose } from '@/components/art/lotto-mascot';
import { Panel } from '@/components/sticker';
import { Txt } from '@/components/text';
import { Font } from '@/theme/fonts';
import { Radius, Stroke } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';

/** Pieces the Pronouns and Verbs slide lessons share. */

export const Fr = 'fr-FR';

export const Big: TextStyle = { fontFamily: Font.display600, fontSize: 30, lineHeight: 34 };
export const Sub: TextStyle = { fontFamily: Font.body800, fontSize: 17, lineHeight: 24 };
export const Gap = { gap: 14 } as const;

/** A bold word in Lotto's line. */
export function B({ children }: { children: ReactNode }) {
  return <Txt style={{ fontFamily: Font.body900, fontSize: 18 }}>{children}</Txt>;
}

/** Text on a white card or a bright fill. */
export function T({ style, children, french = false }: { style?: StyleProp<TextStyle>; children: ReactNode; french?: boolean }) {
  const p = usePalette();
  return (
    <Txt color={p.onBright} accessibilityLanguage={french ? Fr : undefined} style={style}>
      {children}
    </Txt>
  );
}

export function Card({ children, style, radius = 28 }: { children: ReactNode; style?: StyleProp<ViewStyle>; radius?: number }) {
  const p = usePalette();
  return (
    <Panel fill={p.white} radius={radius} borderWidth={Stroke[2]} style={style}>
      {children}
    </Panel>
  );
}

/** The dashed yellow note under a slide. */
export function Tip({ children }: { children: ReactNode }) {
  const p = usePalette();
  return (
    <View style={{ paddingVertical: 10, paddingHorizontal: 14, backgroundColor: p.sunshineSoft, borderColor: p.line, borderWidth: Stroke[2], borderStyle: 'dashed', borderRadius: 20 }}>
      <T style={{ fontFamily: Font.body800, fontSize: 15, lineHeight: 21 }}>{children}</T>
    </View>
  );
}

/** A French word in the running text, on a highlight (grape unless given). */
export function FrWord({ children, fill }: { children: string; fill?: string }) {
  const p = usePalette();
  return (
    <Txt accessibilityLanguage={Fr} style={{ fontFamily: Font.display600, backgroundColor: fill ?? p.grapeSoft }}>
      {` ${children} `}
    </Txt>
  );
}

/** A yellow pill holding an English pronoun. */
export function PronounPill({ text, width = 84, height = 52 }: { text: string; width?: number; height?: number }) {
  const p = usePalette();
  return (
    <View style={{ width, height, alignItems: 'center', justifyContent: 'center', backgroundColor: p.sunshine, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.pill }}>
      <T style={{ fontFamily: Font.display600, fontSize: 26, lineHeight: 30 }}>{text}</T>
    </View>
  );
}

/** The changing part of a word, boxed in pink. */
export function Ending({ children, size }: { children: string; size: number }) {
  const p = usePalette();
  return (
    <View style={{ paddingHorizontal: 5, marginLeft: 2, backgroundColor: p.pinkSoft, borderColor: p.pink, borderWidth: Stroke[2], borderRadius: 10 }}>
      <T style={{ fontFamily: Font.display600, fontSize: size, lineHeight: size * 1.2 }}>{children}</T>
    </View>
  );
}

/**
 * A full-screen slide: Lotto bobbing on the dotted yellow panel under a big speech bubble, with an optional
 * chip at the top and something under Lotto.
 */
export function MascotScene({ bubble, pose, chip, children }: { bubble: ReactNode; pose: MascotPose; chip?: string; children?: ReactNode }) {
  const p = usePalette();
  const bob = useSharedValue(0);
  const bobStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bob.get() }] }));
  useEffect(() => {
    const ease = { duration: 1200, easing: Easing.inOut(Easing.quad) };
    bob.set(withRepeat(withSequence(withTiming(-7, ease), withTiming(0, ease)), -1));
  }, [bob]);

  return (
    <View
      style={{
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingTop: 20,
        paddingBottom: 18,
        paddingHorizontal: 16,
        backgroundColor: p.sunshineSoft,
        borderColor: p.line,
        borderWidth: Stroke[2],
        borderRadius: 32,
        overflow: 'hidden',
      }}>
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern id="dots" width={22} height={22} patternUnits="userSpaceOnUse">
            <Circle cx={11} cy={11} r={3} fill={p.sunshine} opacity={0.35} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#dots)" />
      </Svg>

      {chip && (
        <View style={{ position: 'absolute', top: 18, alignSelf: 'center', paddingVertical: 4, paddingHorizontal: 12, backgroundColor: p.white, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.pill }}>
          <T style={{ fontFamily: Font.body900, fontSize: 12, lineHeight: 16, letterSpacing: 0.72 }}>{chip}</T>
        </View>
      )}

      <Animated.View entering={FadeIn.duration(250)} style={{ alignSelf: 'stretch' }}>
        <Panel fill={p.white} radius={32} style={{ gap: 6, paddingTop: 20, paddingBottom: 18, paddingHorizontal: 20 }}>
          {bubble}
          <Svg width={34} height={30} viewBox="0 0 34 30" style={{ position: 'absolute', left: '50%', bottom: -27, marginLeft: -6 }}>
            <Path d="M2,0 L30,0 L8,27 Z" fill={p.white} stroke={p.line} strokeWidth={4} strokeLinejoin="round" />
            <Path d="M0,1 L34,1" stroke={p.white} strokeWidth={5} />
          </Svg>
        </Panel>
      </Animated.View>

      <Animated.View style={[{ marginTop: 34 }, bobStyle]}>
        <LottoMascot line={p.line} width={170} pose={pose} />
      </Animated.View>

      {children}
    </View>
  );
}
