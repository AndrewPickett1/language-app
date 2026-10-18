import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BathroomIcon, BeachIcon, BedroomIcon, ExploreIcon, FridgeIcon, HouseIcon, KitchenIcon } from '@/components/icons';
import { Screen, ScreenHeader } from '@/components/screen';
import { Panel, Sticker } from '@/components/sticker';
import { Txt } from '@/components/text';
import { Font } from '@/theme/fonts';
import { Space, Stroke } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';

type Place = {
  title: string;
  /** The place's name in the target language. */
  local: string;
  fill: string;
  art: ReactNode;
  /** Places without a screen yet don't open anything. */
  href?: Href;
};

/** Explore: pick a place and learn the words for what you'd find there. */
export default function ExploreScreen() {
  const p = usePalette();
  const insets = useSafeAreaInsets();

  const places: Place[] = [
    { title: 'Kitchen', local: 'La cocina', fill: p.tangerine, art: <KitchenIcon line={p.line} />, href: '/kitchen' },
    { title: 'Refrigerator', local: 'El refrigerador', fill: p.leafSoft, art: <FridgeIcon line={p.line} /> },
    { title: 'Bedroom', local: 'El dormitorio', fill: p.grape, art: <BedroomIcon line={p.line} /> },
    { title: 'Bathroom', local: 'El baño', fill: p.sky, art: <BathroomIcon line={p.line} /> },
    { title: 'Home', local: 'La casa', fill: p.pink, art: <HouseIcon line={p.line} /> },
    { title: 'Beach', local: 'La playa', fill: p.sunshine, art: <BeachIcon line={p.line} /> },
  ];
  const rows = [places.slice(0, 2), places.slice(2, 4), places.slice(4, 6)];

  return (
    <Screen edges={['top', 'left', 'right']} style={{ paddingBottom: 0, gap: 14 }}>
      <ScreenHeader title="Explore" backLabel="Back to study" fallback="/exercises" />

      <ScrollView
        style={{ marginHorizontal: -Space[4] }}
        contentContainerStyle={{ gap: 14, paddingHorizontal: Space[4], paddingTop: 2, paddingBottom: insets.bottom + Space[8] }}
        showsVerticalScrollIndicator={false}>
        <Panel fill={p.grape} style={{ flexDirection: 'row', alignItems: 'center', gap: Space[3], paddingVertical: 14, paddingHorizontal: Space[4] }}>
          <View style={{ flex: 1, minWidth: 0, gap: Space[1] }}>
            <Txt color={p.onBright} style={{ fontFamily: Font.display700, fontSize: 22, lineHeight: 26 }}>
              Pick a place
            </Txt>
            <Txt color={p.onBright} style={{ fontFamily: Font.body800, fontSize: 14, lineHeight: 19 }}>
              Learn the words for everything you&apos;d find there.
            </Txt>
          </View>
          <View aria-hidden>
            <ExploreIcon line={p.line} width={64} />
          </View>
        </Panel>

        <Txt variant="caption" color={p.inkMuted} style={{ paddingHorizontal: Space[1], paddingTop: Space[1], fontFamily: Font.body900 }}>
          Choose a place
        </Txt>

        <View style={{ gap: Space[3], paddingBottom: Space[1] }}>
          {rows.map((row) => (
            <View key={row[0].title} style={{ height: 176, flexDirection: 'row', gap: Space[3] }}>
              {row.map((place) => (
                <PlaceTile key={place.title} place={place} />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

function PlaceTile({ place: { title, local, fill, art, href } }: { place: Place }) {
  const p = usePalette();
  return (
    <Sticker
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${local}`}
      fill={fill}
      radius={26}
      borderWidth={Stroke[3]}
      onPress={() => href && router.push(href)}
      style={{ flex: 1, paddingTop: Space[3], paddingHorizontal: 14, paddingBottom: 14, gap: 1 }}>
      <View aria-hidden style={{ flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {art}
      </View>
      <Txt numberOfLines={1} color={p.onBright} style={{ fontFamily: Font.display600, fontSize: 19, lineHeight: 23 }}>
        {title}
      </Txt>
      <Txt numberOfLines={1} color={p.onBright} style={{ fontFamily: Font.body800, fontSize: 13, lineHeight: 17 }}>
        {local}
      </Txt>
    </Sticker>
  );
}
