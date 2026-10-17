import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { LottoMascot } from '@/components/art/lotto-mascot';
import { ConjugateIcon, FlashcardsIcon, ListeningIcon, MatchingIcon, PlayIcon, SpellingIcon } from '@/components/icons';
import { Screen, ScreenHeader } from '@/components/screen';
import { Panel, PillButton, Sticker } from '@/components/sticker';
import { Txt } from '@/components/text';
import { useGame } from '@/state/game';
import { Font } from '@/theme/fonts';
import { Radius, Space, Stroke } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';

type Exercise = {
  title: string;
  detail: string;
  fill: string;
  art: ReactNode;
  /** Exercises without a screen yet show a "Soon" badge and can't be opened. */
  href?: Href;
  isNew?: boolean;
};

/** The Study hub: a quick mixed review, or pick one exercise to play. */
export default function ExercisesScreen() {
  const p = usePalette();
  const { reviewCount } = useGame();

  const exercises: Exercise[] = [
    { title: 'Flashcards', detail: 'Pick the meaning', fill: p.sky, art: <FlashcardsIcon line={p.line} />, href: '/study' },
    { title: 'Matching', detail: 'Pair words up', fill: p.pink, art: <MatchingIcon line={p.line} />, href: '/match', isNew: true },
    { title: 'Listening', detail: 'Hear it, pick it', fill: p.grape, art: <ListeningIcon line={p.line} /> },
    { title: 'Spelling', detail: 'Type the word', fill: p.sunshine, art: <SpellingIcon line={p.line} /> },
    { title: 'Gender', detail: 'El or la?', fill: p.tangerine, art: <GenderArt /> },
    { title: 'Conjugate', detail: 'Verb drills', fill: p.leafSoft, art: <ConjugateIcon line={p.line} /> },
  ];
  const rows = [exercises.slice(0, 2), exercises.slice(2, 4), exercises.slice(4, 6)];

  return (
    <Screen style={{ gap: 14 }}>
      <ScreenHeader title="Study" backLabel="Back to home" />

      <Panel fill={p.leaf} style={{ flexDirection: 'row', alignItems: 'center', gap: Space[3], padding: 14, paddingLeft: Space[4] }}>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Txt color={p.onBright} style={{ fontFamily: Font.display700, fontSize: 44, lineHeight: 46 }}>
              {reviewCount}
            </Txt>
            <Txt color={p.onBright} style={{ flexShrink: 1, fontFamily: Font.display600, fontSize: 20, lineHeight: 24 }}>
              {reviewCount === 1 ? 'word' : 'words'} to review
            </Txt>
          </View>
          <Txt variant="label" color={p.onBright}>
            A mix of exercises, about 5 minutes
          </Txt>
          <PillButton
            label="Quick review"
            fill={p.sunshine}
            icon={<PlayIcon color={p.onBright} />}
            onPress={() => router.push('/study')}
            style={{ alignSelf: 'flex-start', minHeight: 46, marginTop: Space[2] }}
          />
        </View>
        <LottoMascot line={p.line} width={96} pose="think" />
      </Panel>

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

/** "el" and "la" stickers, tilted apart. */
function GenderArt() {
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
      {pill('el', p.skySoft, '-6deg')}
      {pill('la', p.pinkSoft, '6deg')}
    </View>
  );
}
