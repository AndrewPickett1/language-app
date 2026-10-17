import { useId, useState, type ReactNode } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';

import { WordArt } from '@/components/art/word-art';
import { ConjugationPanel } from '@/components/conjugation-panel';
import { RarityBadge } from '@/components/rarity-badge';
import { SpeakButton } from '@/components/speak-button';
import { Panel } from '@/components/sticker';
import { Txt } from '@/components/text';
import { regularConjugation } from '@/data/conjugations';
import { RarityInfo } from '@/data/rarity';
import { Words, bareWord, type Word } from '@/data/words';
import { Font } from '@/theme/fonts';
import { Radius, Space, Stroke, Themes } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';

type WordCardProps = {
  word: Word;
  /** The round button at the top left: back on the card screen, close in the Lotto reveal. */
  leading: ReactNode;
  /** Fixed art height. Without it the art takes whatever height the card is given. */
  artHeight?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * The collectible word card: rarity frame, art window, word panel and example sentence.
 * Verbs get the verb layout: a conjugation table under the word, with tighter panels to make room.
 */
export function WordCard({ word, leading, artHeight, style }: WordCardProps) {
  const p = usePalette();
  const [artBox, setArtBox] = useState({ width: 0, height: 0 });
  const dotsId = `dots-${useId().replace(/:/g, '')}`;
  const info = RarityInfo[word.rarity];
  // Words from Supabase aren't in the local deck, so they show their database id and no total.
  const deckIndex = Words.indexOf(word);
  const setNumber = (deckIndex >= 0 ? String(deckIndex + 1) : word.id).padStart(3, '0');
  const conjugation = word.type === 'Verb' ? (word.conjugation ?? regularConjugation(word.word)) : undefined;
  const verb = !!conjugation;

  return (
    <Panel fill={info.color} lift={6} style={[{ gap: 10, padding: Space[3] }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 2 }}>
        {leading}
        <View
          accessible
          accessibilityLabel={`Word card: ${word.word}, ${info.name}`}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <RarityBadge rarity={word.rarity} fill={p.paper} />
          <Txt variant="caption" color={p.onBright} style={{ fontFamily: Font.body900 }}>
            No. {setNumber}
            {deckIndex >= 0 && ` / ${String(Words.length).padStart(3, '0')}`}
          </Txt>
        </View>
      </View>

      <View
        onLayout={(e) => setArtBox(e.nativeEvent.layout)}
        style={[
          // A fixed-height window still shrinks on short phones so the whole card fits.
          artHeight ? { height: artHeight, flexShrink: 1, minHeight: verb ? 104 : 120 } : { flex: 1, minHeight: 0 },
          {
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            backgroundColor: p.paper,
            borderColor: p.line,
            borderWidth: Stroke[2],
            borderRadius: Radius.md,
          },
        ]}>
        <Svg style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} width="100%" height="100%">
          <Defs>
            <Pattern id={dotsId} width={20} height={20} patternUnits="userSpaceOnUse">
              <Circle cx={10} cy={10} r={3} fill={info.color} />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#${dotsId})`} />
        </Svg>
        {artBox.width > 0 && (
          <WordArt id={word.id} color={info.color} line={p.line} width={Math.min(236, artBox.width * 0.7, artBox.height * 0.9)} />
        )}
      </View>

      <View style={{ gap: verb ? 2 : Space[1], padding: 14, paddingTop: verb ? 10 : Space[3], paddingBottom: verb ? Space[3] : 14, backgroundColor: p.paper, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space[2] }}>
          <Txt numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} color={p.onBright} style={[{ flexShrink: 1, fontFamily: Font.display700 }, verb ? { fontSize: 42, lineHeight: 46 } : { fontSize: 48, lineHeight: 52 }]}>
            {word.word}
          </Txt>
          <SpeakButton text={word.word} />
        </View>
        <Txt color={p.onBrightMuted} style={[{ fontFamily: Font.body800 }, verb ? { fontSize: 19, lineHeight: 24 } : { fontSize: 20, lineHeight: 26 }]}>
          {word.meaning}
        </Txt>
        <View style={{ flexDirection: 'row', gap: Space[2], marginTop: 6 }}>
          <Chip label={word.type} fill={verb ? Themes.light.skySoft : Themes.light.sunshineSoft} />
          {conjugation && <Chip label={conjugation.group} fill={Themes.light.leafSoft} />}
          {word.gender && <Chip label={word.gender === 'F' ? 'Feminine' : 'Masculine'} fill={Themes.light.skySoft} />}
        </View>
      </View>

      {conjugation && <ConjugationPanel conjugation={conjugation} />}

      <View style={{ gap: verb ? Space[1] : 6, padding: 14, paddingTop: verb ? 10 : Space[3], paddingBottom: verb ? Space[3] : 14, backgroundColor: p.white, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.md }}>
        <View style={{ alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 1, backgroundColor: p.onBright, borderRadius: Radius.pill }}>
          <Txt variant="caption" color={p.paper} style={{ fontFamily: Font.body900, fontSize: 11, lineHeight: 15 }}>
            Example
          </Txt>
        </View>
        <Txt color={p.onBright} style={[{ fontFamily: Font.body800 }, verb ? { fontSize: 17, lineHeight: 22 } : { fontSize: 18, lineHeight: 24 }]}>
          <HighlightedExample sentence={word.example} word={bareWord(word.word)} />
        </Txt>
        <Txt color={p.onBrightMuted} style={[{ fontFamily: Font.body700 }, verb ? { fontSize: 14, lineHeight: 19 } : { fontSize: 15, lineHeight: 20 }]}>
          {word.exampleMeaning}
        </Txt>
      </View>
    </Panel>
  );
}

/** The example sentence with the card's word marked, matched case-insensitively. */
function HighlightedExample({ sentence, word }: { sentence: string; word: string }) {
  const start = sentence.toLowerCase().indexOf(word.toLowerCase());
  if (start < 0) return sentence;
  const end = start + word.length;
  return (
    <>
      {sentence.slice(0, start)}
      <Text style={{ backgroundColor: Themes.light.sunshineSoft }}>{sentence.slice(start, end)}</Text>
      {sentence.slice(end)}
    </>
  );
}

/** Chips sit on paper, which never changes theme, so their tints are fixed too. */
function Chip({ label, fill }: { label: string; fill: string }) {
  const p = usePalette();
  return (
    <View style={{ paddingHorizontal: Space[3], paddingVertical: 3, backgroundColor: fill, borderColor: p.line, borderWidth: Stroke[1], borderRadius: Radius.pill }}>
      <Txt color={p.onBright} style={{ fontFamily: Font.body900, fontSize: 13, lineHeight: 18 }}>
        {label}
      </Txt>
    </View>
  );
}
