import { Text, type TextProps } from 'react-native';

import { Type, type TypeVariant } from '@/theme/fonts';
import { usePalette } from '@/theme/use-palette';

type Props = TextProps & {
  variant?: TypeVariant;
  /** Defaults to `ink`. Pass `onBright` for text on bright fills. */
  color?: string;
};

export function Txt({ variant = 'body', color, style, ...rest }: Props) {
  const p = usePalette();
  return <Text style={[Type[variant], { color: color ?? p.ink }, style]} {...rest} />;
}
