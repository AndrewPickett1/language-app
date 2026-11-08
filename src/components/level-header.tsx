import type { Href } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronIcon } from '@/components/icons';
import { goBack } from '@/components/screen';
import { Panel, RoundButton } from '@/components/sticker';
import { Txt } from '@/components/text';
import { Font } from '@/theme/fonts';
import { Radius, Space, Stroke } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';

type LevelHeaderProps = {
  title: string;
  backLabel: string;
  fallback: Href;
  /** Right-hand round button. Empty space keeps the title centred without one. */
  trailing?: ReactNode;
};

/** The white bar over the level map and the Levels list: back, a pink title pill, and an optional button. */
export function LevelHeader({ title, backLabel, fallback, trailing }: LevelHeaderProps) {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        paddingTop: insets.top + Space[2],
        paddingBottom: Space[3],
        paddingHorizontal: Space[4],
        flexDirection: 'row',
        alignItems: 'center',
        gap: Space[2],
        backgroundColor: p.surfaceRaised,
        borderBottomWidth: Stroke[2],
        borderColor: p.line,
      }}>
      <RoundButton accessibilityLabel={backLabel} size={44} fill={p.paper} onPress={() => goBack(fallback)}>
        <ChevronIcon color={p.ink} />
      </RoundButton>
      <Panel fill={p.pink} radius={Radius.pill} borderWidth={Stroke[2]} style={{ flex: 1, height: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Txt
          accessibilityRole="header"
          numberOfLines={1}
          color={p.onBright}
          style={{ fontFamily: Font.display600, fontSize: 20, lineHeight: 24, letterSpacing: 0.8, textTransform: 'uppercase' }}>
          {title}
        </Txt>
      </Panel>
      {trailing ?? <View style={{ width: 44 }} />}
    </View>
  );
}
