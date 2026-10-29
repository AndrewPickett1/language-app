import { useEffect, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { SlideInDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LottoMascot } from '@/components/art/lotto-mascot';
import { CheckIcon, CloseIcon } from '@/components/icons';
import { PillButton, Sticker } from '@/components/sticker';
import { Txt } from '@/components/text';
import { Font } from '@/theme/fonts';
import { Radius, Space, Stroke } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';

/** What the sheet at the bottom says after an answer. */
export type Feedback = { right: boolean; title: string; text: string; cta?: string };

/** Lotto with a pink speech bubble: the prompt at the top of a lesson step. */
export function MascotPrompt({ text, pose = 'wave' }: { text: string; pose?: 'cheer' | 'wave' | 'think' | 'oops' }) {
  const p = usePalette();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: Space[2] }}>
      <LottoMascot line={p.line} width={60} pose={pose} />
      <View
        style={{
          flex: 1,
          paddingVertical: 10,
          paddingHorizontal: 14,
          backgroundColor: p.pinkSoft,
          borderColor: p.line,
          borderWidth: Stroke[2],
          borderRadius: 20,
          borderBottomLeftRadius: 6,
        }}>
        <Txt variant="bodyLg" style={{ fontFamily: Font.body800 }}>
          {text}
        </Txt>
      </View>
    </View>
  );
}

export type TileState = 'idle' | 'selected' | 'right' | 'wrong' | 'faded';

type AnswerTileProps = {
  label: string;
  state: TileState;
  disabled: boolean;
  onPress: () => void;
  /** French answers use the display face; English ones use Nunito. */
  french?: boolean;
  height?: number;
  style?: StyleProp<ViewStyle>;
  leading?: ReactNode;
};

/** An answer tile: pink while selected, green when right, cherry with a wobble when wrong. */
export function AnswerTile({ label, state, disabled, onPress, french = false, height = 64, style, leading }: AnswerTileProps) {
  const p = usePalette();
  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.get() }] }));
  const fill = { idle: p.white, selected: p.pinkSoft, right: p.leaf, wrong: p.cherry, faded: p.white }[state];

  useEffect(() => {
    if (state !== 'wrong') return;
    shake.set(withSequence(withTiming(-6, { duration: 50 }), withRepeat(withTiming(6, { duration: 100 }), 3, true), withTiming(0, { duration: 50 })));
  }, [state, shake]);

  return (
    <Animated.View style={[{ opacity: state === 'faded' ? 0.5 : 1 }, shakeStyle, style]}>
      <Sticker
        accessibilityRole="radio"
        accessibilityState={{ checked: state === 'selected', disabled }}
        fill={fill}
        radius={20}
        borderWidth={state === 'selected' ? Stroke[3] : Stroke[2]}
        disabled={disabled}
        onPress={onPress}
        style={{ height, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Space[2], paddingHorizontal: Space[3] }}>
        {leading}
        {state === 'right' && <CheckIcon color={p.onBright} size={20} />}
        {state === 'wrong' && <CloseIcon color={p.onBright} size={18} />}
        <Txt
          color={p.onBright}
          numberOfLines={1}
          adjustsFontSizeToFit
          style={french ? { fontFamily: Font.display600, fontSize: 21, lineHeight: 25 } : { fontFamily: Font.body800, fontSize: 18, lineHeight: 22 }}>
          {label}
        </Txt>
      </Sticker>
    </Animated.View>
  );
}

/** Select-then-Check: greyed out until something is picked, so there's time to change your mind. */
export function CheckButton({ enabled, onPress }: { enabled: boolean; onPress: () => void }) {
  const p = usePalette();
  return <PillButton label="Check" fill={enabled ? p.pink : p.locked} disabled={!enabled} onPress={onPress} style={{ minHeight: 56 }} />;
}

/** The sheet that slides up after an answer. Never red: a wrong answer gets sunshine. */
export function FeedbackSheet({ feedback, onNext }: { feedback: Feedback; onNext: () => void }) {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { right } = feedback;
  return (
    <Animated.View
      entering={SlideInDown.duration(360)}
      accessibilityLiveRegion="polite"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        gap: 14,
        paddingTop: 20,
        paddingHorizontal: Space[4],
        paddingBottom: insets.bottom + Space[4],
        backgroundColor: right ? p.leafSoft : p.sunshineSoft,
        borderColor: p.line,
        borderTopWidth: Stroke[3],
        borderTopLeftRadius: Radius.lg,
        borderTopRightRadius: Radius.lg,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space[3] }}>
        <View
          style={{
            width: 48,
            height: 48,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: right ? p.leaf : p.sunshine,
            borderColor: p.line,
            borderWidth: Stroke[2],
            borderRadius: Radius.pill,
          }}>
          {right ? <CheckIcon color={p.onBright} size={24} /> : <LottoMascot line={p.line} width={34} pose="oops" />}
        </View>
        <View style={{ flex: 1 }}>
          <Txt style={{ fontFamily: Font.display700, fontSize: 26, lineHeight: 30 }}>{feedback.title}</Txt>
          <Txt variant="body" style={{ fontFamily: Font.body800 }}>
            {feedback.text}
          </Txt>
        </View>
      </View>
      <PillButton label={feedback.cta ?? (right ? 'Keep going' : 'Got it')} fill={right ? p.leaf : p.sunshine} onPress={onNext} />
    </Animated.View>
  );
}

/** A small round audio button. */
export function RoundAudio({
  label,
  fill,
  size,
  onPress,
  children,
}: {
  label: string;
  fill: string;
  size: number;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <Sticker
      accessibilityRole="button"
      accessibilityLabel={label}
      fill={fill}
      lift={3}
      onPress={onPress}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </Sticker>
  );
}
