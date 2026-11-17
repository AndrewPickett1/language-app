import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Foil, GrowFill } from '@/components/mastery/parts';
import { Screen } from '@/components/screen';
import { Txt } from '@/components/text';
import { HoloColors, StageInfo, type Stage } from '@/data/mastery';
import { RarityInfo } from '@/data/rarity';
import type { Word } from '@/data/words';
import { Font } from '@/theme/fonts';
import { Radius, Space, Stroke } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';
import type { WordChange } from '@/utils/word-stats';

/** True when an answer moved the word's strength or stage. */
export function hasChanged(c: WordChange) {
  return c.newStrength !== c.oldStrength || c.newStage !== c.oldStage || c.newlyMastered;
}

type Props = {
  /** "Level 1 · Top 10 nouns". */
  heading: string;
  /** The words that changed, newly mastered first (the server's order). */
  changes: WordChange[];
  wordFor: (id: string) => Word | undefined;
  /** Opens a newly mastered word's mastery moment. */
  onOpenMastery: (wordId: string) => void;
  /** The buttons at the bottom. */
  footer: ReactNode;
};

/**
 * After a lesson: how each word it asked about grew. Each row shows the old strength as a ghost under the
 * new one, the stage it moved from and to, and the change. Newly mastered words come first, in holo, and
 * open their mastery moment. A drop is yellow and kind about it, never red.
 */
export function WordsGrew({ heading, changes, wordFor, onOpenMastery, footer }: Props) {
  const p = usePalette();
  const reduce = useReducedMotion();
  const rows = changes.flatMap((c) => {
    const word = wordFor(c.wordId);
    return word ? [{ c, word }] : [];
  });
  const pills = [
    { label: `${rows.filter((r) => r.c.newStrength > r.c.oldStrength).length} got stronger`, fill: p.white, holo: false },
    { label: `${rows.filter((r) => r.c.newStage !== r.c.oldStage).length} levelled up`, fill: p.leafSoft, holo: false },
    { label: `${rows.filter((r) => r.c.newlyMastered).length} mastered`, fill: p.sunshine, holo: true },
  ];

  return (
    <Screen background={p.grapeSoft} style={{ gap: 14, paddingTop: Space[6] }}>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Txt variant="caption" style={{ textAlign: 'center' }}>
          {heading}
        </Txt>
        <Txt variant="displayLg" accessibilityRole="header" style={{ textAlign: 'center' }}>
          Your words grew!
        </Txt>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Space[2] }}>
        {pills.map((pill) => (
          <View key={pill.label} style={{ overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 4, backgroundColor: pill.fill, borderColor: p.line, borderWidth: Stroke[1] + 0.5, borderRadius: Radius.pill }}>
            {pill.holo && <Foil colors={HoloColors} moving radius={Radius.pill} />}
            <Txt color={p.onBright} style={{ fontFamily: Font.body900, fontSize: 14, lineHeight: 18 }}>
              {pill.label}
            </Txt>
          </View>
        ))}
      </View>

      <ScrollView accessibilityLabel="How each word changed" style={{ flex: 1 }} contentContainerStyle={{ gap: Space[2], paddingVertical: 2 }}>
        {rows.map(({ c, word }, i) => (
          <Animated.View key={c.wordId} entering={reduce ? undefined : FadeInDown.delay(80 + i * 70).duration(380)}>
            <GrewRow change={c} word={word} barDelay={300 + i * 90} onPress={() => (c.newlyMastered ? onOpenMastery(c.wordId) : router.push({ pathname: '/card/[id]', params: { id: c.wordId, side: 'stats' } }))} />
          </Animated.View>
        ))}
      </ScrollView>

      {footer}
    </Screen>
  );
}

function StagePill({ stage, mastered = false }: { stage: Stage; mastered?: boolean }) {
  const p = usePalette();
  return (
    <View style={{ paddingHorizontal: 7, backgroundColor: StageInfo[stage].chip, borderColor: p.line, borderWidth: Stroke[1], borderRadius: Radius.pill }}>
      <Txt color={p.onBright} style={{ fontFamily: Font.body900, fontSize: 11, lineHeight: 16 }}>
        {StageInfo[stage].name}
        {mastered ? ' ★' : ''}
      </Txt>
    </View>
  );
}

function GrewRow({ change: c, word, barDelay, onPress }: { change: WordChange; word: Word; barDelay: number; onPress: () => void }) {
  const p = usePalette();
  const delta = c.newStrength - c.oldStrength;
  const changed = c.newStage !== c.oldStage;
  const dropped = delta < 0;
  const fill = dropped ? p.sunshine : (StageInfo[c.newStage].ring ?? p.stone);
  const color = RarityInfo[word.rarity].color;
  const aria = `${word.word}: ${changed ? `${StageInfo[c.oldStage].name} to ${StageInfo[c.newStage].name}` : `still ${StageInfo[c.newStage].name}`}, strength ${c.oldStrength} to ${c.newStrength}${c.newlyMastered ? '. Mastered! Opens your mastery reward' : ''}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={aria}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingTop: 9,
        paddingBottom: 10,
        paddingLeft: 10,
        paddingRight: 12,
        overflow: 'hidden',
        backgroundColor: c.newlyMastered ? p.sunshine : p.white,
        borderColor: p.line,
        borderWidth: Stroke[2],
        borderRadius: 18,
        boxShadow: `0px ${pressed ? 1 : 3}px 0px ${p.line}`,
        transform: [{ translateY: pressed ? 2 : 0 }],
      })}>
      {c.newlyMastered && <Foil colors={HoloColors} moving radius={18 - Stroke[2]} />}
      <View style={{ width: 40, height: 50, padding: 3, backgroundColor: color, borderColor: p.line, borderWidth: Stroke[1] + 0.5, borderRadius: 9 }}>
        <View style={{ flex: 1, backgroundColor: p.paper, borderColor: p.line, borderWidth: Stroke[1], borderRadius: 6, opacity: 0.7 }} />
      </View>
      <View style={{ flex: 1, gap: 5, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Txt numberOfLines={1} color={p.onBright} style={{ flexShrink: 1, fontFamily: Font.display600, fontSize: 17, lineHeight: 21 }}>
            {word.word}
          </Txt>
          <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {changed && (
              <>
                <StagePill stage={c.oldStage} />
                <Svg width={14} height={14} viewBox="0 0 24 24">
                  <Path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke={p.onBright} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </>
            )}
            <StagePill stage={c.newStage} mastered={c.newlyMastered} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space[2] }}>
          <View style={{ flex: 1, height: 12, overflow: 'hidden', backgroundColor: p.surfaceSunken, borderColor: p.line, borderWidth: Stroke[1], borderRadius: Radius.pill }}>
            {/* The old strength as a faded ghost, the new one growing over it. */}
            <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${c.oldStrength}%`, backgroundColor: '#d9cdee' }} />
            {c.newStrength > 0 && <GrowFill to={c.newStrength} color={fill} delay={barDelay} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, height: undefined }} />}
          </View>
          <Txt color={p.onBright} style={{ width: 36, textAlign: 'right', fontFamily: Font.body900, fontSize: 13, lineHeight: 16 }}>
            {delta >= 0 ? '+' : '−'}
            {Math.abs(delta)}
          </Txt>
        </View>
        {dropped && (
          <Txt color={p.onBrightMuted} style={{ fontFamily: Font.body800, fontSize: 12, lineHeight: 16 }}>
            A slip is fine. It’ll come up more next time.
          </Txt>
        )}
        {c.newlyMastered && (
          <Txt color={p.onBright} style={{ fontFamily: Font.body800, fontSize: 12, lineHeight: 16 }}>
            Tap to see your mastery reward
          </Txt>
        )}
      </View>
    </Pressable>
  );
}
