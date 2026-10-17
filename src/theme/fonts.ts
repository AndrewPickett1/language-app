import {
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
} from '@expo-google-fonts/fredoka';
import {
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';
import type { TextStyle } from 'react-native';

export const FontAssets = {
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
};

/** One family per weight, so Android never fakes a bold. */
export const Font = {
  display500: 'Fredoka_500Medium',
  display600: 'Fredoka_600SemiBold',
  display700: 'Fredoka_700Bold',
  body600: 'Nunito_600SemiBold',
  body700: 'Nunito_700Bold',
  body800: 'Nunito_800ExtraBold',
  body900: 'Nunito_900Black',
} as const;

/** Text styles from the design system's type scale. */
export const Type = {
  displayXl: { fontFamily: Font.display700, fontSize: 56, lineHeight: 56 },
  displayLg: { fontFamily: Font.display700, fontSize: 40, lineHeight: 44 },
  title: { fontFamily: Font.display600, fontSize: 28, lineHeight: 32 },
  cardWord: { fontFamily: Font.display600, fontSize: 30, lineHeight: 34 },
  button: { fontFamily: Font.display600, fontSize: 18, lineHeight: 22 },
  bodyLg: { fontFamily: Font.body700, fontSize: 18, lineHeight: 26 },
  body: { fontFamily: Font.body600, fontSize: 16, lineHeight: 24 },
  label: { fontFamily: Font.body800, fontSize: 14, lineHeight: 18 },
  caption: {
    fontFamily: Font.body800,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.72,
    textTransform: 'uppercase',
  },
} satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof Type;
