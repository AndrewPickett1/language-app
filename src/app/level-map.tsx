import { router } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { LottoMascot } from '@/components/art/lotto-mascot';
import { ChevronIcon, LockIcon, StarIcon } from '@/components/icons';
import { goBack } from '@/components/screen';
import { Panel, RoundButton, Sticker } from '@/components/sticker';
import { Txt } from '@/components/text';
import { unitProgress, type MapModule, type MapUnit, type ModuleStatus } from '@/data/level-map';
import { useLanguage } from '@/state/language';
import { useLotto } from '@/state/lotto';
import { useStreak } from '@/state/streak';
import { Font } from '@/theme/fonts';
import { Radius, Space, Stroke } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';
import { useLevelMap } from '@/utils/modules';

/** Module points are laid out on a canvas this wide, centred on the screen. */
const Canvas = 390;

const StatusText: Record<ModuleStatus, string> = {
  done: 'complete',
  current: 'up next',
  locked: 'locked',
  reward: 'bonus reward, locked',
};

/** The Learn screen: the current language's units of modules on a winding path, first at the bottom. */
export default function LevelMapScreen() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const scroll = useRef<ScrollViewInstance>(null);
  const scrolled = useRef(false);
  const [viewport, setViewport] = useState(0);
  const [currentY, setCurrentY] = useState<number | null>(null);
  const { language } = useLanguage();
  const { units, error } = useLevelMap();
  // The next module wears the dashed ring.
  const selected = units?.flatMap((u) => u.modules).find((m) => m.status === 'current')?.id ?? null;

  // Open with the next module in the middle of the screen.
  useEffect(() => {
    if (scrolled.current || !viewport || currentY === null) return;
    scrolled.current = true;
    scroll.current?.scrollTo({ y: Math.max(0, currentY - viewport / 2), animated: false });
  }, [viewport, currentY]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: p.surfaceRaised }}>
      <Header />
      <ScrollView
        ref={scroll}
        style={{ flex: 1, backgroundColor: p.surface }}
        contentContainerStyle={{ paddingTop: Space[2], paddingBottom: Space[4] + insets.bottom, gap: Space[3] }}
        showsVerticalScrollIndicator={false}
        onLayout={(e) => setViewport(e.nativeEvent.layout.height)}>
        {!units ? (
          <ActivityIndicator color={p.ink} style={{ padding: Space[6] }} />
        ) : units.length === 0 ? (
          <Empty
            title={error ? "Couldn't load the map" : 'Coming soon'}
            body={error ?? `There are no ${language.name} lessons yet. Check back soon!`}
          />
        ) : (
          [...units].reverse().map((unit) => {
          const current = unit.modules.find((m) => m.status === 'current');
          return (
            <View
              key={unit.number}
              onLayout={current ? (e) => setCurrentY(e.nativeEvent.layout.y + current.y) : undefined}>
              <UnitMap
                unit={unit}
                selected={selected}
                onPick={(id) => router.push({ pathname: '/lesson/[id]', params: { id } })}
              />
              {unit.number > 1 && <UnitBanner unit={unit} />}
            </View>
          );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Header() {
  const p = usePalette();
  const { streak } = useStreak();
  const { currentPulls, maxPulls } = useLotto();
  return (
    <View
      style={{
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Space[2],
        paddingHorizontal: Space[4],
        backgroundColor: p.surfaceRaised,
        borderBottomWidth: Stroke[2],
        borderColor: p.line,
        zIndex: 1,
      }}>
      <RoundButton accessibilityLabel="Back to home" size={44} fill={p.paper} onPress={() => goBack('/')}>
        <ChevronIcon color={p.ink} />
      </RoundButton>
      <View style={{ flexDirection: 'row', gap: Space[2] }}>
        <HeaderPill
          label={`${streak}`}
          accessibilityLabel={`${streak}-day streak`}
          fill={p.tangerine}
          icon={<SmallFlame />}
          onPress={() => router.push('/rewards')}
        />
        <HeaderPill
          label={`${currentPulls}/${maxPulls}`}
          accessibilityLabel={`${currentPulls} of ${maxPulls} pulls ready`}
          fill={p.sunshine}
          icon={<SmallCapsule />}
          onPress={() => router.push('/lotto')}
        />
      </View>
    </View>
  );
}

type HeaderPillProps = { label: string; accessibilityLabel: string; fill: string; icon: ReactNode; onPress: () => void };

function HeaderPill({ label, accessibilityLabel, fill, icon, onPress }: HeaderPillProps) {
  const p = usePalette();
  return (
    <Sticker
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      fill={fill}
      onPress={onPress}
      style={{ height: 44, flexDirection: 'row', alignItems: 'center', gap: Space[1], paddingLeft: Space[2], paddingRight: Space[3] }}>
      {icon}
      <Txt color={p.onBright} style={{ fontFamily: Font.display600, fontSize: 17, lineHeight: 22 }}>
        {label}
      </Txt>
    </Sticker>
  );
}

function SmallFlame() {
  const p = usePalette();
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M12 3c1 3 5.5 5 5.5 10a5.5 5.5 0 0 1-11 0c0-2.6 1.4-4.2 2.6-5.2 0 2 1 3.2 2.1 3.2 0-3-1.2-5.4.8-8z"
        fill={p.paper}
        stroke={p.line}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SmallCapsule() {
  const p = usePalette();
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path d="M4 12a8 8 0 0 1 16 0z" fill={p.pink} />
      <Path d="M4 12a8 8 0 0 0 16 0z" fill={p.paper} />
      <Circle cx={12} cy={12} r={8} fill="none" stroke={p.line} strokeWidth={2} />
      <Path d="M4 12h16" stroke={p.line} strokeWidth={2} />
    </Svg>
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

type UnitMapProps = { unit: MapUnit; selected: string | null; onPick: (id: string) => void };

function UnitMap({ unit, selected, onPick }: UnitMapProps) {
  const p = usePalette();
  const { modules } = unit;
  // The road is green up to the furthest module reached.
  const reach = modules.findLastIndex((m) => m.status === 'done' || m.status === 'current');
  const current = modules.find((m) => m.status === 'current');

  return (
    <View style={{ width: Canvas, height: unit.height, alignSelf: 'center' }}>
      <Svg width={Canvas} height={unit.height} style={{ position: 'absolute' }}>
        <Path d={roadThrough(modules)} fill="none" stroke={p.line} strokeWidth={20} strokeLinecap="round" />
        <Path d={roadThrough(modules)} fill="none" stroke={p.surfaceSunken} strokeWidth={12} strokeLinecap="round" />
        {reach > 0 && (
          <Path d={roadThrough(modules.slice(0, reach + 1))} fill="none" stroke={p.leaf} strokeWidth={12} strokeLinecap="round" />
        )}
      </Svg>
      {current && <Mascot module={current} />}
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
function Mascot({ module: m }: { module: MapModule }) {
  const p = usePalette();
  const bob = useBob();
  const left = m.x >= Canvas / 2 ? m.x - 200 : m.x + 100;
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left, top: m.y - 66 }, bob]}>
      <LottoMascot line={p.line} width={100} pose="wave" />
    </Animated.View>
  );
}

function UpNext({ module: m, half }: { module: MapModule; half: number }) {
  const p = usePalette();
  const bob = useBob();
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: m.x - 52,
          top: m.y - half - 42,
          width: 104,
          height: 28,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: p.surfaceRaised,
          borderColor: p.line,
          borderWidth: Stroke[2],
          borderRadius: Radius.pill,
        },
        bob,
      ]}>
      <Txt variant="caption" color={p.onBright}>
        Up next
      </Txt>
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
      {m.status === 'current' && <UpNext module={m} half={half} />}

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
        accessibilityLabel={`${m.name}, ${m.wordCount} words, ${StatusText[m.status]}`}
        accessibilityState={{ selected }}
        fill={p.paper}
        borderWidth={Stroke[3]}
        onPress={onPress}
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

/** Introduces a unit as you scroll up into it. */
function UnitBanner({ unit }: { unit: MapUnit }) {
  const p = usePalette();
  const { done, total } = unitProgress(unit);
  return (
    <Panel fill={p.grape} style={{ marginHorizontal: Space[4], paddingVertical: 14, paddingLeft: 18, paddingRight: 14, gap: 2 }}>
      <Txt variant="caption" color={p.onBright}>
        Unit {unit.number} · {done} of {total} done
      </Txt>
      <Txt accessibilityRole="header" color={p.onBright} style={{ fontFamily: Font.display600, fontSize: 26, lineHeight: 30 }}>
        {unit.title}
      </Txt>
    </Panel>
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
