import type { ReactNode } from 'react';
import { Pressable, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { Txt } from '@/components/text';
import { Radius, Stroke, shadowPop } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';

type StickerProps = Omit<PressableProps, 'style' | 'children'> & {
  fill: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  borderWidth?: number;
  /** Height of the hard `shadow-pop` offset. The element drops by this much on press. */
  lift?: number;
};

/** A pressable sticker: flat fill, line outline, hard offset shadow, squashes on press. */
export function Sticker({
  fill,
  children,
  style,
  radius = Radius.pill,
  borderWidth = Stroke[2],
  lift = 4,
  disabled,
  ...rest
}: StickerProps) {
  const p = usePalette();
  return (
    <Pressable
      disabled={disabled}
      {...rest}
      style={({ pressed }) => {
        const down = pressed || !!disabled;
        return [
          {
            backgroundColor: fill,
            borderColor: p.line,
            borderWidth,
            borderRadius: radius,
            boxShadow: shadowPop(p.line, down ? 1 : lift),
            transform: [{ translateY: down ? lift - 1 : 0 }],
          },
          style,
        ];
      }}>
      {children}
    </Pressable>
  );
}

/** A static sticker panel (cards, sections). */
export function Panel({
  fill,
  children,
  style,
  radius = Radius.lg,
  borderWidth = Stroke[3],
  lift = 4,
}: Pick<StickerProps, 'fill' | 'children' | 'style' | 'radius' | 'borderWidth' | 'lift'>) {
  const p = usePalette();
  return (
    <View
      style={[
        {
          backgroundColor: fill,
          borderColor: p.line,
          borderWidth,
          borderRadius: radius,
          boxShadow: lift > 0 ? shadowPop(p.line, lift) : undefined,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

type PillButtonProps = Omit<StickerProps, 'children'> & {
  label: string;
  icon?: ReactNode;
};

/** A pill-shaped button with a Fredoka label. Text is always `onBright`. */
export function PillButton({ label, icon, style, ...rest }: PillButtonProps) {
  const p = usePalette();
  return (
    <Sticker
      accessibilityRole="button"
      style={[
        {
          minHeight: 52,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        },
        style,
      ]}
      {...rest}>
      {icon}
      <Txt variant="button" color={p.onBright}>
        {label}
      </Txt>
    </Sticker>
  );
}

type RoundButtonProps = Omit<StickerProps, 'fill' | 'children'> & {
  accessibilityLabel: string;
  children: ReactNode;
  fill?: string;
  size?: number;
};

/** A circular icon button. Needs an `accessibilityLabel`. */
export function RoundButton({ fill, size = 48, style, children, ...rest }: RoundButtonProps) {
  const p = usePalette();
  return (
    <Sticker
      accessibilityRole="button"
      fill={fill ?? p.surfaceRaised}
      style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}
      {...rest}>
      {children}
    </Sticker>
  );
}
