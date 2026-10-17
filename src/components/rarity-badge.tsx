import { View } from 'react-native';

import { Txt } from '@/components/text';
import { RarityInfo, starString, type Rarity } from '@/data/rarity';
import { Radius, Stroke } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';

/** Stars + rarity word on a pill. `fill` defaults to the rarity colour. */
export function RarityBadge({ rarity, fill }: { rarity: Rarity; fill?: string }) {
  const p = usePalette();
  const info = RarityInfo[rarity];
  return (
    <View
      accessibilityLabel={`${info.name}, ${info.stars} star${info.stars === 1 ? '' : 's'}`}
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        gap: 6,
        paddingHorizontal: 11,
        paddingVertical: 3,
        backgroundColor: fill ?? info.color,
        borderColor: p.line,
        borderWidth: Stroke[1],
        borderRadius: Radius.pill,
      }}>
      <Txt variant="caption" color={p.onBright}>
        {starString(rarity)}
      </Txt>
      <Txt variant="caption" color={p.onBright}>
        {info.name}
      </Txt>
    </View>
  );
}
