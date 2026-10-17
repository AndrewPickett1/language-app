import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { CloseIcon, ChevronIcon } from '@/components/icons';
import { RoundButton } from '@/components/sticker';
import { Txt } from '@/components/text';
import { Space } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';

type ScreenProps = {
  children: ReactNode;
  /** Defaults to `surface`. */
  background?: string;
  style?: StyleProp<ViewStyle>;
  /** Drop 'bottom' for screens whose content runs under the home indicator. */
  edges?: Edge[];
};

/** A full-height screen with phone gutters (`space-4`) inside the safe area. */
export function Screen({ children, background, style, edges }: ScreenProps) {
  const p = usePalette();
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: background ?? p.surface }}>
      <View style={[{ flex: 1, paddingHorizontal: Space[4], paddingTop: Space[2], paddingBottom: Space[4], gap: Space[4] }, style]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

/** Go back, or to `fallback` when there's nothing to go back to (deep links, web reloads). */
export function goBack(fallback: Href = '/') {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}

type HeaderProps = {
  title?: string;
  backLabel: string;
  /** "close" for sessions you quit (Study), "back" otherwise. */
  kind?: 'back' | 'close';
  fallback?: Href;
  /** Replaces the centred title. */
  center?: ReactNode;
  /** Right-hand slot, e.g. a second round button. */
  trailing?: ReactNode;
};

export function ScreenHeader({ title, backLabel, kind = 'back', fallback, center, trailing }: HeaderProps) {
  const p = usePalette();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space[3] }}>
      <RoundButton accessibilityLabel={backLabel} onPress={() => goBack(fallback)}>
        {kind === 'close' ? <CloseIcon color={p.ink} /> : <ChevronIcon color={p.ink} />}
      </RoundButton>
      {center ?? (
        <Txt variant="title" accessibilityRole="header" style={{ flex: 1, textAlign: 'center', fontSize: 30, lineHeight: 34 }}>
          {title}
        </Txt>
      )}
      {trailing ?? (center ? null : <View style={{ width: 48 }} />)}
    </View>
  );
}
