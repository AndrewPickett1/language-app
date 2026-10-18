import { Image } from 'expo-image';
import { View } from 'react-native';

import { Screen, ScreenHeader } from '@/components/screen';
import { Space } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';

/** The Kitchen place from Explore: an illustrated kitchen scene. */
export default function KitchenScreen() {
  const p = usePalette();
  return (
    <Screen background={p.pinkSoft}>
      <ScreenHeader title="Kitchen" backLabel="Back to explore" fallback="/explore" />

      <View style={{ flex: 1, minHeight: 0, marginHorizontal: -Space[4], justifyContent: 'center' }}>
        <Image
          source={require('@/assets/images/kitchen.svg')}
          alt="Illustrated kitchen with a fridge, stove, sink, table and everyday kitchen items"
          contentFit="contain"
          style={{ width: '100%', maxHeight: '100%', aspectRatio: 996 / 970 }}
        />
      </View>
    </Screen>
  );
}
