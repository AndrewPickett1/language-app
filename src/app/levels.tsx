import { router } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StarIcon } from '@/components/icons';
import { LevelHeader } from '@/components/level-header';
import { Sticker } from '@/components/sticker';
import { Txt } from '@/components/text';
import { openUnits, unitProgress, unitStars, type MapUnit } from '@/data/level-map';
import { useLanguage } from '@/state/language';
import { Font } from '@/theme/fonts';
import { Radius, Space, Stroke } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';
import { useLevelMap } from '@/utils/modules';

/** All levels: the ones the learner has opened, newest first. Tapping one shows its map. */
export default function LevelsScreen() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const { units, error } = useLevelMap();
  const open = units ? openUnits(units).reverse() : [];

  return (
    <View style={{ flex: 1, backgroundColor: p.surface }}>
      <LevelHeader title="Levels" backLabel="Back to level map" fallback="/level-map" />
      {!units ? (
        <ActivityIndicator color={p.ink} style={{ padding: Space[6] }} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 20, paddingHorizontal: Space[4], paddingBottom: insets.bottom + Space[8], gap: 14 }}>
          <Txt color={p.inkMuted} style={{ marginHorizontal: Space[1], fontFamily: Font.body700, fontSize: 15, lineHeight: 20 }}>
            {error ?? (open.length === 0 ? `There are no ${language.name} levels yet.` : open.length === 1 ? '1 level unlocked' : `${open.length} levels unlocked`)}
          </Txt>
          {open.map((unit) => (
            <LevelRow key={unit.number} unit={unit} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function LevelRow({ unit }: { unit: MapUnit }) {
  const p = usePalette();
  const { done, total } = unitProgress(unit);
  const { stars, max } = unitStars(unit);
  const status = unit.completed ? 'complete' : 'in progress';
  const color = unit.completed ? p.leaf : p.pink;

  return (
    <Sticker
      accessibilityRole="button"
      accessibilityLabel={`Level ${unit.number}, ${status}, ${done} of ${total} modules, ${stars} of ${max} stars`}
      fill={p.surfaceRaised}
      radius={Radius.md}
      onPress={() => router.dismissTo({ pathname: '/level-map', params: { level: String(unit.number) } })}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingLeft: Space[3], paddingRight: 14 }}>
      <View
        style={{
          width: 60,
          height: 60,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: p.paper,
          borderColor: p.line,
          borderWidth: Stroke[3],
          borderRadius: Radius.pill,
          overflow: 'hidden',
        }}>
        <View style={[StyleSheet.absoluteFill, { bottom: '50%', backgroundColor: color, borderBottomWidth: Stroke[2], borderColor: p.line }]} />
        <View
          style={{
            position: 'absolute',
            left: '17%',
            top: '14%',
            width: '26%',
            height: '11%',
            borderRadius: Radius.pill,
            backgroundColor: p.white,
            transform: [{ rotate: '-32deg' }],
          }}
        />
        <View
          style={{
            minWidth: 26,
            paddingHorizontal: 6,
            backgroundColor: p.paper,
            borderColor: p.line,
            borderWidth: Stroke[1],
            borderRadius: Radius.pill,
          }}>
          <Txt color={p.onBright} style={{ fontFamily: Font.display600, fontSize: 17, lineHeight: 22, textAlign: 'center' }}>
            {unit.number}
          </Txt>
        </View>
      </View>

      <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space[2] }}>
          <Txt numberOfLines={1} style={{ flexShrink: 1, fontFamily: Font.display600, fontSize: 20, lineHeight: 24 }}>
            Level {unit.number}
          </Txt>
          <View
            style={{
              paddingHorizontal: Space[2],
              paddingVertical: 1,
              backgroundColor: unit.completed ? p.leafSoft : p.pinkSoft,
              borderColor: p.line,
              borderWidth: Stroke[1],
              borderRadius: Radius.pill,
            }}>
            <Txt style={{ fontFamily: Font.body800, fontSize: 11, lineHeight: 14, letterSpacing: 0.4, textTransform: 'uppercase' }}>
              {unit.completed ? 'Complete' : 'In progress'}
            </Txt>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space[2] }}>
          <View
            style={{
              flex: 1,
              height: 10,
              backgroundColor: p.surface,
              borderColor: p.line,
              borderWidth: Stroke[1],
              borderRadius: Radius.pill,
              overflow: 'hidden',
            }}>
            <View style={{ height: '100%', width: `${total ? Math.round((done / total) * 100) : 0}%`, backgroundColor: color }} />
          </View>
          <Txt style={{ fontFamily: Font.body800, fontSize: 13, lineHeight: 16 }}>
            {done} / {total}
          </Txt>
        </View>
      </View>

      <View style={{ alignItems: 'center', gap: 2 }}>
        <StarIcon color={p.line} fill={p.sunshine} size={22} />
        <Txt style={{ fontFamily: Font.body800, fontSize: 12, lineHeight: 14 }}>
          {stars}/{max}
        </Txt>
      </View>
    </Sticker>
  );
}
