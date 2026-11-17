import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { CheckIcon } from '@/components/icons';
import { Foil, GrowFill, StageChip } from '@/components/mastery/parts';
import { RarityBadge } from '@/components/rarity-badge';
import { Panel, PillButton } from '@/components/sticker';
import { Txt } from '@/components/text';
import {
  decodeRecent,
  hasMastered,
  HoloColors,
  masteryRules,
  masteryTip,
  recentRight,
  reviewCaption,
  RustyColors,
  StageInfo,
  stageA11y,
  StrengthTicks,
  type MasteryRule,
} from '@/data/mastery';
import { RarityInfo } from '@/data/rarity';
import type { Word } from '@/data/words';
import { Font } from '@/theme/fonts';
import { Radius, Space, Stroke } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';
import type { WordProgress } from '@/utils/word-progress';

type Props = {
  word: Word;
  progress: WordProgress;
  /** The round button at the top left, as on the card's front. */
  leading: ReactNode;
  /** The button that flips back to the word. */
  trailing: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** "Nov 9". */
function shortDate(d: Date) {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * The back of a word card: the word's strength and stage, its road to mastery (or its Mastered banner),
 * and its last 8 answers. A mastered card has a holo frame; a rusty one is muted and asks for a review.
 */
export function WordStatsCard({ word, progress, leading, trailing, style }: Props) {
  const p = usePalette();
  const mastered = progress.stage === 'mastered';
  const rusty = progress.stage === 'rusty';
  const rules = masteryRules(progress);
  const caption = progress.stage === 'new' ? 'Not tested yet. Answer it in a lesson or exercise to start.' : reviewCaption(progress.nextReviewAt);

  return (
    <Panel fill={RarityInfo[word.rarity].color} lift={6} style={[{ gap: 10, padding: Space[3] }, style]}>
      {(mastered || rusty) && <Foil colors={mastered ? HoloColors : RustyColors} moving={mastered} radius={Radius.lg - Stroke[3]} />}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 2 }}>
        {leading}
        <View style={{ flex: 1, minWidth: 0 }}>
          <RarityBadge rarity={word.rarity} fill={p.paper} />
        </View>
        {trailing}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 10 }} showsVerticalScrollIndicator={false}>
        <Section fill={p.paper} style={{ gap: Space[2] }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: Space[2] }}>
            <Txt numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} color={p.onBright} style={{ flexShrink: 1, fontFamily: Font.display700, fontSize: 30, lineHeight: 34 }}>
              {word.word}
            </Txt>
            <Txt color={p.onBrightMuted} numberOfLines={1} style={{ flexShrink: 1, fontFamily: Font.body800, fontSize: 15, lineHeight: 20 }}>
              {word.meaning}
            </Txt>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <SectionTitle>Strength</SectionTitle>
            <StageChip stage={progress.stage} />
          </View>
          <StrengthMeter progress={progress} />
          {caption && (
            <Txt color={p.onBrightMuted} style={{ fontFamily: Font.body800, fontSize: 13, lineHeight: 18 }}>
              {caption}
            </Txt>
          )}
        </Section>

        {!hasMastered(progress.stage) && <RoadToMastery rules={rules} />}

        {hasMastered(progress.stage) && (
          <Section fill={p.sunshine} style={{ gap: 10, overflow: 'hidden' }}>
            <Foil colors={mastered ? HoloColors : RustyColors} moving={mastered} radius={Radius.md - Stroke[2]} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space[3] }}>
              <Svg width={46} height={46} viewBox="0 0 48 48">
                <Circle cx={24} cy={24} r={21} fill={p.paper} stroke={p.line} strokeWidth={3.5} />
                <Path d="M24 10l3.9 8.3 9.1.9-6.8 6.1 2 9-8.2-4.7-8.2 4.7 2-9-6.8-6.1 9.1-.9z" fill={mastered ? p.sunshine : '#d8cfe2'} stroke={p.line} strokeWidth={2.5} strokeLinejoin="round" />
              </Svg>
              <View style={{ flex: 1 }}>
                <Txt color={p.onBright} style={{ fontFamily: Font.display600, fontSize: 22, lineHeight: 26 }}>
                  Mastered
                </Txt>
                {progress.masteredAt && (
                  <Txt color={p.onBright} style={{ fontFamily: Font.body800, fontSize: 13, lineHeight: 18 }}>
                    Since {shortDate(progress.masteredAt)} · kept forever
                  </Txt>
                )}
              </View>
            </View>
            <PassedPills rules={rules} />
          </Section>
        )}

        {rusty && (
          <Section fill={p.white} style={{ gap: 10 }}>
            <Txt color={p.onBright} style={{ fontFamily: Font.display600, fontSize: 20, lineHeight: 24 }}>
              Getting a little rusty
            </Txt>
            <Txt color={p.onBrightMuted} style={{ fontFamily: Font.body800, fontSize: 14, lineHeight: 19 }}>
              Your Mastered badge stays. One quick review brings the shine back.
            </Txt>
            <PillButton label="Polish it" fill={p.pink} onPress={() => router.push({ pathname: '/study', params: { word: word.id } })} />
          </Section>
        )}

        <RecentAnswers progress={progress} />
      </ScrollView>

    </Panel>
  );
}

function Section({ fill, children, style }: { fill: string; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const p = usePalette();
  return <View style={[{ paddingTop: Space[3], paddingHorizontal: 14, paddingBottom: 14, backgroundColor: fill, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.md }, style]}>{children}</View>;
}

function SectionTitle({ children }: { children: ReactNode }) {
  const p = usePalette();
  return (
    <Txt variant="caption" color={p.onBrightMuted} style={{ fontFamily: Font.body900 }}>
      {children}
    </Txt>
  );
}

/** Strength 0–100 with ticks where familiar and strong start and a bold one at the mastery line. */
function StrengthMeter({ progress }: { progress: WordProgress }) {
  const p = usePalette();
  const fill = StageInfo[progress.stage].ring;
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel="Strength"
          accessibilityValue={{ min: 0, max: 100, now: progress.strength, text: stageA11y(progress) }}
          style={{ flex: 1, height: 24, padding: 3, overflow: 'hidden', backgroundColor: p.surfaceSunken, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.pill }}>
          {fill && progress.strength > 0 && <GrowFill to={progress.strength} color={fill} />}
          {StrengthTicks.map((t, i) => (
            <View
              key={t}
              style={{ position: 'absolute', top: 0, bottom: 0, left: `${t}%`, width: i === StrengthTicks.length - 1 ? 3 : 2, backgroundColor: p.line, opacity: i === StrengthTicks.length - 1 ? 1 : 0.3 }}
            />
          ))}
        </View>
        <Txt color={p.onBright} style={{ width: 42, textAlign: 'right', fontFamily: Font.display600, fontSize: 26, lineHeight: 30 }}>
          {progress.strength}
        </Txt>
      </View>
      <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={{ flexDirection: 'row', marginRight: 52 }}>
        {[
          ['Learning', 40],
          ['Familiar', 30],
          ['Strong', 20],
          ['★', 10],
        ].map(([label, flex]) => (
          <Txt key={label} color={p.onBrightMuted} style={{ flex: flex as number, fontFamily: Font.body800, fontSize: 11, lineHeight: 14 }}>
            {label}
          </Txt>
        ))}
      </View>
    </View>
  );
}

function RoadToMastery({ rules }: { rules: MasteryRule[] }) {
  const p = usePalette();
  const done = rules.filter((r) => r.met).length;
  return (
    <Section fill={p.white} style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <SectionTitle>Road to mastery</SectionTitle>
        <View style={{ paddingHorizontal: 10, paddingVertical: 1, backgroundColor: p.sunshineSoft, borderColor: p.line, borderWidth: Stroke[1], borderRadius: Radius.pill }}>
          <Txt color={p.onBright} style={{ fontFamily: Font.body900, fontSize: 13, lineHeight: 18 }}>
            {done} of 4
          </Txt>
        </View>
      </View>
      {rules.map((r, i) => {
        const have = Math.min(r.have, r.need);
        return (
          <View
            key={r.label}
            accessible
            accessibilityLabel={`${r.label}, ${r.met ? 'done' : `${have} of ${r.need}`}`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: r.met ? p.leaf : p.white, borderColor: p.line, borderWidth: Stroke[1] + 0.5, borderRadius: Radius.pill }}>
              {r.met ? (
                <CheckIcon color={p.onBright} size={14} />
              ) : (
                <Txt color={p.onBright} style={{ fontFamily: Font.body900, fontSize: 13, lineHeight: 16 }}>
                  {i + 1}
                </Txt>
              )}
            </View>
            <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
              <Txt color={p.onBright} style={{ fontFamily: Font.body800, fontSize: 14, lineHeight: 18 }}>
                {r.label}
              </Txt>
              <View style={{ height: 10, padding: 1.5, overflow: 'hidden', backgroundColor: p.surfaceSunken, borderColor: p.line, borderWidth: Stroke[1], borderRadius: Radius.pill }}>
                {have > 0 && <GrowFill to={(have / r.need) * 100} color={r.met ? p.leaf : p.tangerine} delay={120 + i * 80} />}
              </View>
            </View>
            <Txt color={p.onBright} style={{ width: 44, textAlign: 'right', fontFamily: Font.body900, fontSize: 14, lineHeight: 18 }}>
              {have}/{r.need}
            </Txt>
          </View>
        );
      })}
      <View style={{ paddingVertical: 6, paddingHorizontal: 10, backgroundColor: p.sunshineSoft, borderRadius: Radius.sm }}>
        <Txt color={p.onBright} style={{ fontFamily: Font.body800, fontSize: 13, lineHeight: 18 }}>
          {masteryTip(rules)}
        </Txt>
      </View>
    </Section>
  );
}

/** The mastery rules a word passed, with its numbers. */
export function PassedPills({ rules, ink }: { rules: MasteryRule[]; ink?: string }) {
  const p = usePalette();
  return (
    <View accessibilityLabel="Mastery rules passed" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {rules.map((r) => (
        <View
          key={r.label}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 6, paddingRight: 9, paddingVertical: 2, backgroundColor: p.paper, borderColor: ink ?? p.line, borderWidth: Stroke[1], borderRadius: Radius.pill }}>
          <CheckIcon color={p.onBright} size={11} />
          <Txt color={p.onBright} style={{ fontFamily: Font.body900, fontSize: 12, lineHeight: 16 }}>
            {r.passed}
          </Txt>
        </View>
      ))}
    </View>
  );
}

/** The last 8 answers, oldest first: right is green with a tick, wrong is yellow with a dash (never red). */
function RecentAnswers({ progress }: { progress: WordProgress }) {
  const p = usePalette();
  const recent = decodeRecent(progress.recentResults, progress.recentCount);
  const right = recentRight(progress.recentResults);
  return (
    <Section fill={p.white} style={{ gap: Space[2], paddingBottom: Space[3] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <SectionTitle>Last 8 answers</SectionTitle>
        {recent.length > 0 && (
          <Txt color={p.onBrightMuted} style={{ fontFamily: Font.body800, fontSize: 12, lineHeight: 16 }}>
            {right} of {recent.length} right
          </Txt>
        )}
      </View>
      {recent.length === 0 ? (
        <Txt color={p.onBrightMuted} style={{ fontFamily: Font.body800, fontSize: 13, lineHeight: 18 }}>
          No answers yet.
        </Txt>
      ) : (
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={`${right} of the last ${recent.length} answers right, oldest to newest: ${recent.map((ok) => (ok ? 'right' : 'wrong')).join(', ')}`}
          style={{ flexDirection: 'row', gap: 6, justifyContent: recent.length === 8 ? 'space-between' : 'flex-start' }}>
          {recent.map((ok, i) => (
            <View
              key={i}
              style={{ width: 30, height: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: ok ? p.leaf : p.sunshineSoft, borderColor: p.line, borderWidth: Stroke[1] + 0.5, borderRadius: Radius.pill }}>
              {ok ? <CheckIcon color={p.onBright} size={14} /> : <View style={{ width: 12, height: 3.5, backgroundColor: p.onBright, borderRadius: 2 }} />}
            </View>
          ))}
        </View>
      )}
    </Section>
  );
}
