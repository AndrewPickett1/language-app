import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { LottoMascot } from '@/components/art/lotto-mascot';
import { CheckIcon, ListIcon, LockIcon, StarIcon } from '@/components/icons';
import { LevelHeader } from '@/components/level-header';
import { RoundButton, Sticker } from '@/components/sticker';
import { Txt } from '@/components/text';
import { currentUnit, type MapModule, type MapUnit, type ModuleStatus } from '@/data/level-map';
import { useLanguage } from '@/state/language';
import { Font } from '@/theme/fonts';
import { Radius, Space, Stroke } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';
import { useLevelMap } from '@/utils/modules';

/** Module points are laid out on a canvas this wide, then stretched to fill the screen. */
const Canvas = 390;

type Size = { width: number; height: number };

/** Spreads a unit's module points across the space its map actually got. */
function fitUnit(unit: MapUnit, size: Size): MapUnit {
  const sx = size.width / Canvas;
  const sy = size.height / unit.height;
  return { ...unit, height: size.height, modules: unit.modules.map((m) => ({ ...m, x: m.x * sx, y: m.y * sy })) };
}

const StatusText: Record<ModuleStatus, string> = {
  done: 'complete',
  current: 'up next',
  locked: 'locked',
  reward: 'bonus reward, locked',
};

/**
 * The Learn screen: one level's modules on a winding path, first at the bottom. It opens on the level holding
 * the learner's next module, or the one `level` names (from the Levels list).
 */
export default function LevelMapScreen() {
  const p = usePalette();
  const { level } = useLocalSearchParams<{ level?: string }>();
  const { language } = useLanguage();
  const { units, error } = useLevelMap();
  const unit = units && (units.find((u) => String(u.number) === level) ?? currentUnit(units));

  return (
    <View style={{ flex: 1, backgroundColor: p.surface }}>
      <LevelHeader
        title={unit ? `Level ${unit.number}` : 'Learn'}
        backLabel="Back to home"
        fallback="/"
        trailing={
          <RoundButton accessibilityLabel="All levels" size={44} fill={p.paper} disabled={!unit} onPress={() => router.push('/levels')}>
            <ListIcon color={p.ink} />
          </RoundButton>
        }
      />
      {!units ? (
        <ActivityIndicator color={p.ink} style={{ padding: Space[6] }} />
      ) : !unit ? (
        <Empty
          title={error ? "Couldn't load the map" : 'Coming soon'}
          body={error ?? `There are no ${language.name} lessons yet. Check back soon!`}
        />
      ) : (
        // Keyed so picking another level starts its map fresh, scrolled to its own next module.
        <LevelRoad key={unit.number} unit={unit} />
      )}
    </View>
  );
}

/** A level's road, scrolled so the next module sits mid-screen, or to the start when there isn't one. */
function LevelRoad({ unit }: { unit: MapUnit }) {
  const insets = useSafeAreaInsets();
  const scroll = useRef<ScrollViewInstance>(null);
  const scrolled = useRef(false);
  const [viewport, setViewport] = useState(0);
  const [size, setSize] = useState<Size>();
  // The next module wears the dashed ring.
  const selected = unit.modules.find((m) => m.status === 'current')?.id ?? null;
  const currentY = size ? (fitUnit(unit, size).modules.find((m) => m.status === 'current')?.y ?? null) : undefined;

  useEffect(() => {
    if (scrolled.current || !viewport || currentY === undefined) return;
    scrolled.current = true;
    if (currentY === null) scroll.current?.scrollToEnd({ animated: false });
    else scroll.current?.scrollTo({ y: Math.max(0, currentY - viewport / 2), animated: false });
  }, [viewport, currentY]);

  return (
    <ScrollView
      ref={scroll}
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom }}
      showsVerticalScrollIndicator={false}
      onLayout={(e) => setViewport(e.nativeEvent.layout.height)}>
      <UnitMap
        unit={unit}
        size={size}
        onSize={setSize}
        selected={selected}
        onPick={(id) => router.push({ pathname: '/lesson/[id]', params: { id } })}
      />
    </ScrollView>
  );
}

/** A smooth S-bend from one module down the page to the next. */
function roadThrough(points: MapModule[]) {
  return points
    .map((m, i) => {
      if (i === 0) return `M${m.x} ${m.y}`;
      const prev = points[i - 1];
      const mid = (prev.y + m.y) / 2;
      return `C${prev.x} ${mid} ${m.x} ${mid} ${m.x} ${m.y}`;
    })
    .join(' ');
}

type UnitMapProps = {
  unit: MapUnit;
  /** The space the map got on screen, once measured. */
  size: Size | undefined;
  onSize: (size: Size) => void;
  selected: string | null;
  onPick: (id: string) => void;
};

/** A unit's road, at least its natural height and stretched to fill whatever room is left. */
function UnitMap({ unit, size, onSize, selected, onPick }: UnitMapProps) {
  return (
    <View
      style={{ flexGrow: 1, minHeight: unit.height }}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width !== size?.width || height !== size?.height) onSize({ width, height });
      }}>
      {size && <UnitRoad unit={fitUnit(unit, size)} width={size.width} selected={selected} onPick={onPick} />}
    </View>
  );
}

type UnitRoadProps = { unit: MapUnit; width: number; selected: string | null; onPick: (id: string) => void };

function UnitRoad({ unit, width, selected, onPick }: UnitRoadProps) {
  const p = usePalette();
  const { modules } = unit;
  // The road is green up to the furthest module reached.
  const reach = modules.findLastIndex((m) => m.status === 'done' || m.status === 'current');
  const current = modules.find((m) => m.status === 'current');

  return (
    <View style={StyleSheet.absoluteFill}>
      <Svg width={width} height={unit.height} style={{ position: 'absolute' }}>
        <Path d={roadThrough(modules)} fill="none" stroke={p.line} strokeWidth={20} strokeLinecap="round" />
        <Path d={roadThrough(modules)} fill="none" stroke={p.surfaceSunken} strokeWidth={12} strokeLinecap="round" />
        {reach > 0 && (
          <Path d={roadThrough(modules.slice(0, reach + 1))} fill="none" stroke={p.leaf} strokeWidth={12} strokeLinecap="round" />
        )}
      </Svg>
      {current && <Mascot module={current} width={width} />}
      {modules.map((m) => (
        <ModuleNode key={m.id} module={m} selected={selected === m.id} onPress={() => onPick(m.id)} />
      ))}
    </View>
  );
}

function useBob() {
  const y = useSharedValue(0);
  useEffect(() => {
    y.set(withRepeat(withTiming(-5, { duration: 800, easing: Easing.inOut(Easing.ease) }), -1, true));
  }, [y]);
  return useAnimatedStyle(() => ({ transform: [{ translateY: y.get() }] }));
}

/** Lotto waves beside the next module, on whichever side has room. */
function Mascot({ module: m, width }: { module: MapModule; width: number }) {
  const p = usePalette();
  const bob = useBob();
  const left = m.x >= width / 2 ? m.x - 200 : m.x + 100;
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left, top: m.y - 66 }, bob]}>
      <LottoMascot line={p.line} width={100} pose="wave" />
    </Animated.View>
  );
}

type ModuleNodeProps = { module: MapModule; selected: boolean; onPress: () => void };

/** A capsule on the road: coloured by status, with its name below and stars once done. */
function ModuleNode({ module: m, selected, onPress }: ModuleNodeProps) {
  const p = usePalette();
  const size = m.status === 'current' ? 88 : 72;
  const half = size / 2;
  const top = { done: p.leaf, current: p.pink, locked: p.locked, reward: p.sunshine }[m.status];

  return (
    <>
      {selected && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: m.x - half - 10,
            top: m.y - half - 10,
            width: size + 20,
            height: size + 20,
            borderColor: p.focus,
            borderWidth: Stroke[2],
            borderStyle: 'dashed',
            borderRadius: Radius.pill,
          }}
        />
      )}

      <View pointerEvents="none" style={{ position: 'absolute', left: m.x - 80, top: m.y + half + 16, width: 160, alignItems: 'center' }}>
        <View style={{ paddingHorizontal: Space[2], paddingVertical: 1, borderRadius: Radius.sm, backgroundColor: p.surface }}>
          <Txt
            numberOfLines={1}
            color={m.status === 'locked' ? p.inkMuted : p.ink}
            style={{ fontFamily: Font.display600, fontSize: 17, lineHeight: 22 }}>
            {m.name}
          </Txt>
        </View>
      </View>

      <Sticker
        accessibilityRole="button"
        accessibilityLabel={`${m.name}, ${m.type === 'Lesson' ? 'lesson' : `${m.wordCount} words`}, ${StatusText[m.status]}`}
        accessibilityState={{ selected, disabled: m.status === 'locked' }}
        fill={p.paper}
        borderWidth={Stroke[3]}
        // A module opens once the one before it is done, which the server checks too.
        onPress={m.status === 'locked' ? undefined : onPress}
        style={{ position: 'absolute', left: m.x - half, top: m.y - half, width: size, height: size }}>
        <View style={[StyleSheet.absoluteFill, { borderRadius: Radius.pill, overflow: 'hidden' }]}>
          <View style={{ height: '50%', backgroundColor: top, borderBottomWidth: Stroke[2], borderColor: p.line }} />
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
        </View>
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
          {m.status === 'locked' ? (
            <View
              style={{
                width: 32,
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: p.paper,
                borderColor: p.line,
                borderWidth: Stroke[1],
                borderRadius: Radius.pill,
              }}>
              <LockIcon color={p.line} fill={p.locked} size={20} />
            </View>
          ) : (
            <View
              style={{
                paddingHorizontal: Space[2],
                paddingVertical: 1,
                backgroundColor: p.paper,
                borderColor: p.line,
                borderWidth: Stroke[1],
                borderRadius: Radius.pill,
              }}>
              <Txt
                numberOfLines={1}
                color={p.onBright}
                style={{ fontFamily: Font.display600, fontSize: m.glyph.length > 3 ? 15 : 17, lineHeight: 20 }}>
                {m.glyph}
              </Txt>
            </View>
          )}
        </View>
      </Sticker>

      {m.status === 'done' && (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: m.x - 36, top: m.y + half - 12, width: 72, flexDirection: 'row', justifyContent: 'center', gap: 1 }}>
          {[1, 2, 3].map((i) => (
            <StarIcon key={i} color={p.line} fill={i <= (m.stars ?? 0) ? p.sunshine : p.locked} size={20} />
          ))}
        </View>
      )}
      {m.status === 'done' && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: m.x + half - 24,
            top: m.y - half - 8,
            width: 32,
            height: 32,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: p.leaf,
            borderColor: p.line,
            borderWidth: Stroke[2],
            borderRadius: Radius.pill,
          }}>
          <CheckIcon color={p.line} size={20} />
        </View>
      )}
      {m.status === 'reward' && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: m.x + half - 22,
            top: m.y - half - 6,
            width: 28,
            height: 28,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: p.locked,
            borderColor: p.line,
            borderWidth: Stroke[1],
            borderRadius: Radius.pill,
          }}>
          <LockIcon color={p.line} fill={p.paper} size={16} />
        </View>
      )}
    </>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  const p = usePalette();
  return (
    <View style={{ paddingVertical: Space[6], paddingHorizontal: Space[4], alignItems: 'center', gap: 6 }}>
      <Txt style={{ fontFamily: Font.display600, fontSize: 20, lineHeight: 26, textAlign: 'center' }}>{title}</Txt>
      <Txt color={p.inkMuted} style={{ fontFamily: Font.body700, fontSize: 15, lineHeight: 20, textAlign: 'center' }}>
        {body}
      </Txt>
    </View>
  );
}
