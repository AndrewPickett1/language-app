import { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Bounce, Radius, Stroke } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';

const Travel = 22;

type Props = {
  value: boolean;
  onValueChange: (on: boolean) => void;
  accessibilityLabel: string;
};

/** A chunky on/off switch whose knob bounces across. */
export function Switch({ value, onValueChange, accessibilityLabel }: Props) {
  const p = usePalette();
  const x = useSharedValue(value ? Travel : 0);

  useEffect(() => {
    x.set(withTiming(value ? Travel : 0, { duration: 220, easing: Easing.bezier(...Bounce) }));
  }, [value, x]);

  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      hitSlop={8}
      style={{
        width: 54,
        height: 32,
        paddingHorizontal: 3,
        justifyContent: 'center',
        backgroundColor: value ? p.leaf : p.grapeSoft,
        borderColor: p.line,
        borderWidth: Stroke[2],
        borderRadius: Radius.pill,
      }}>
      <Animated.View
        style={[
          { width: 20, height: 20, backgroundColor: p.white, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.pill },
          knob,
        ]}
      />
    </Pressable>
  );
}
