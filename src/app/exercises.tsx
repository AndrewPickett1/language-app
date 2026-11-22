import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { LottoMascot } from '@/components/art/lotto-mascot';
import { CheckIcon, ConjugateIcon, ExploreIcon, FlashcardsIcon, MatchingIcon, PlayIcon, RefreshIcon, SpellingIcon } from '@/components/icons';
import { Screen, ScreenHeader } from '@/components/screen';
import { Panel, PillButton, Sticker } from '@/components/sticker';
import { Txt } from '@/components/text';
import { useLanguage } from '@/state/language';
import { Font } from '@/theme/fonts';
import { Radius, Space, Stroke } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';
import { useDailyReviewDone } from '@/utils/daily-review';

type Exercise = {
  title: string;
  detail: string;
  fill: string;
  art: ReactNode;
  /** Exercises without a screen yet show a "Soon" badge and can't be opened. */
  href?: Href;
  isNew?: boolean;
};

/** The Study hub: today's Daily Review, or pick one exercise to play. */
export default function ExercisesScreen() {
  const p = usePalette();
  const { language } = useLanguage();
  const { M: masc, F: fem } = language.articles;

  const exercises: Exercise[] = [
    { title: 'Flashcards', detail: 'Pick the meaning', fill: p.sky, art: <FlashcardsIcon line={p.line} />, href: '/study' },
    { title: 'Matching', detail: 'Pair words up', fill: p.pink, art: <MatchingIcon line={p.line} />, href: '/match' },
    { title: 'Explore', detail: 'Discover new words', fill: p.grape, art: <ExploreIcon line={p.line} />, href: '/explore' },
    { title: 'Spelling', detail: 'Type the word', fill: p.sunshine, art: <SpellingIcon line={p.line} /> },
    { title: 'Gender', detail: `${masc.charAt(0).toUpperCase() + masc.slice(1)} or ${fem}?`, fill: p.tangerine, art: <GenderArt masc={masc} fem={fem} />, href: '/gender' },
    { title: 'Conjugate', detail: 'Verb drills', fill: p.leafSoft, art: <ConjugateIcon line={p.line} /> },
  ];
  const rows = [exercises.slice(0, 2), exercises.slice(2, 4), exercises.slice(4, 6)];

  return (
    <Screen style={{ gap: 14 }}>
      <ScreenHeader title="Study" backLabel="Back to home" />

      <DailyReviewCard />

      <Txt variant="caption" color={p.inkMuted} style={{ paddingHorizontal: Space[1], fontFamily: Font.body900 }}>
        Choose an exercise
      </Txt>

      <View style={{ flex: 1, minHeight: 0, gap: Space[3], paddingBottom: Space[1] }}>
        {rows.map((row) => (
          <View key={row[0].title} style={{ flex: 1, minHeight: 0, flexDirection: 'row', gap: Space[3] }}>
            {row.map((exercise) => (
              <ExerciseTile key={exercise.title} exercise={exercise} />
            ))}
          </View>
        ))}
      </View>
    </Screen>
  );
}

/**
 * Today's Daily Review. Until the day's first round is done it's leaf green with Start review; after, it's
 * marked done today and offers more practice, which earns nothing more.
 */
function DailyReviewCard() {
  const p = usePalette();
  const done = useDailyReviewDone() === true;
  return (
    <Panel
      fill={done ? p.leafSoft : p.leaf}
      radius={28}
      style={{ flexDirection: 'row', alignItems: 'center', gap: Space[3], paddingVertical: Space[4], paddingLeft: 18, paddingRight: 14 }}>
      <View style={{ flex: 1, minWidth: 0, gap: Space[1] }}>
        {done && (
          <View
            style={{
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingVertical: 2,
              paddingLeft: 6,
              paddingRight: 10,
              backgroundColor: p.white,
              borderColor: p.line,
              borderWidth: Stroke[1],
              borderRadius: Radius.pill,
            }}>
            <CheckIcon color={p.onBright} size={12} />
            <Txt color={p.onBright} style={{ fontFamily: Font.body900, fontSize: 11, lineHeight: 14, letterSpacing: 0.66 }}>
              DONE TODAY
            </Txt>
          </View>
        )}
        <Txt color={p.onBright} accessibilityRole="header" style={{ fontFamily: Font.display700, fontSize: 32, lineHeight: 36 }}>
          Daily Review
        </Txt>
        <PillButton
          label={done ? 'Practice more' : 'Start review'}
          fill={done ? p.white : p.sunshine}
          icon={done ? <RefreshIcon color={p.onBright} /> : <PlayIcon color={p.onBright} />}
          onPress={() => router.push('/review')}
          style={{ alignSelf: 'flex-start', minHeight: 46, marginTop: 10 }}
        />
      </View>
      {done ? (
        <View style={{ width: 104 }}>
          <LottoMascot line={p.line} width={104} pose="cheer" />
          <View
            style={{
              position: 'absolute',
              right: -4,
              bottom: 2,
              width: 36,
              height: 36,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: p.white,
              borderColor: p.line,
              borderWidth: Stroke[2],
              borderRadius: Radius.pill,
            }}>
            <CheckIcon color={p.onBright} size={18} />
          </View>
        </View>
      ) : (
        <LottoMascot line={p.line} width={96} pose="think" />
      )}
    </Panel>
  );
}

function ExerciseTile({ exercise: { title, detail, fill, art, href, isNew } }: { exercise: Exercise }) {
  const p = usePalette();
  const badge = !href ? 'SOON' : isNew ? 'NEW' : null;
  return (
    <Sticker
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${detail}${href ? '' : ', coming soon'}`}
      fill={fill}
      radius={26}
      borderWidth={Stroke[3]}
      disabled={!href}
      onPress={() => href && router.push(href)}
      style={{ flex: 1, paddingTop: Space[3], paddingHorizontal: 14, paddingBottom: 14, gap: 1 }}>
      {badge && (
        <View
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 1,
            paddingHorizontal: Space[2],
            paddingVertical: 1,
            backgroundColor: href ? p.sunshine : p.paper,
            borderColor: p.line,
            borderWidth: Stroke[1],
            borderRadius: Radius.pill,
          }}>
          <Txt color={p.onBright} style={{ fontFamily: Font.body900, fontSize: 11, lineHeight: 14, letterSpacing: 0.66 }}>
            {badge}
          </Txt>
        </View>
      )}
      <View style={{ flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>{art}</View>
      <Txt numberOfLines={1} color={p.onBright} style={{ fontFamily: Font.display600, fontSize: 19, lineHeight: 23 }}>
        {title}
      </Txt>
      <Txt numberOfLines={1} color={p.onBright} style={{ fontFamily: Font.body800, fontSize: 13, lineHeight: 17 }}>
        {detail}
      </Txt>
    </Sticker>
  );
}

/** The language's masculine and feminine articles ("el" and "la") as stickers, tilted apart. */
function GenderArt({ masc, fem }: { masc: string; fem: string }) {
  const p = usePalette();
  const pill = (label: string, fill: string, rotate: string) => (
    <View
      style={{
        paddingHorizontal: Space[3],
        paddingVertical: Space[1],
        backgroundColor: fill,
        borderColor: p.line,
        borderWidth: Stroke[2],
        borderRadius: Radius.pill,
        transform: [{ rotate }],
      }}>
      <Txt color={p.onBright} style={{ fontFamily: Font.display700, fontSize: 20, lineHeight: 24 }}>
        {label}
      </Txt>
    </View>
  );
  return (
    <View aria-hidden style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {pill(masc, p.skySoft, '-6deg')}
      {pill(fem, p.pinkSoft, '6deg')}
    </View>
  );
}
