import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { Capsule } from '@/components/art/capsule';
import { SpeakerIcon } from '@/components/icons';
import { AnswerTile, CheckButton, MascotPrompt, RoundAudio, type Feedback, type TileState } from '@/components/lesson/shared';
import { speak } from '@/components/speak-button';
import { Panel, PillButton } from '@/components/sticker';
import { Txt } from '@/components/text';
import { display, gloss, type LessonWord } from '@/data/lesson';
import { RarityInfo, starString } from '@/data/rarity';
import { useLanguage } from '@/state/language';
import { Font } from '@/theme/fonts';
import { Space, Stroke } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';

type Props = {
  kind: 'meaning' | 'pick' | 'listen';
  word: LessonWord;
  options: LessonWord[];
  retry?: boolean;
  onAnswer: (right: boolean, feedback: Feedback) => void;
};

/**
 * The three pick-one exercises. Pick the meaning: French on a card, English tiles. Pick the word:
 * English in a sky bubble, French tiles that speak when tapped. Listen & pick: a capsule plays the word.
 */
export function ChoiceQuiz({ kind, word, options, retry, onAnswer }: Props) {
  const p = usePalette();
  const { language } = useLanguage();
  const [sel, setSel] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const french = kind !== 'meaning';
  const label = (w: LessonWord) => (french ? display(w) : gloss(w));
  const said = display(word);

  const check = () => {
    if (sel === null || answered) return;
    setAnswered(true);
    const right = sel === word.id;
    const later = retry ? '' : " We'll come back to it.";
    const feedback: Record<Props['kind'], Feedback> = {
      meaning: right
        ? { right, title: 'Nice!', text: `${said} = ${gloss(word)}` }
        : { right, title: 'Almost —', text: `it means ${gloss(word)}.${later}` },
      pick: right ? { right, title: 'Nice!', text: `${said} = ${gloss(word)}` } : { right, title: 'Almost —', text: `it's ${said}.${later}` },
      listen: right
        ? { right, title: 'Good ears!', text: `${said} = ${gloss(word)}` }
        : { right, title: 'Almost —', text: `that was ${said} (${gloss(word)}).${later}` },
    };
    onAnswer(right, feedback[kind]);
  };

  const stateOf = (w: LessonWord): TileState => {
    if (!answered) return sel === w.id ? 'selected' : 'idle';
    if (w.id === word.id) return 'right';
    return sel === w.id ? 'wrong' : 'faded';
  };

  const tiles = options.map((w) => (
    <AnswerTile
      key={w.id}
      label={label(w)}
      french={french}
      state={stateOf(w)}
      disabled={answered}
      height={kind === 'listen' ? 58 : kind === 'pick' ? 68 : 64}
      style={kind === 'listen' ? undefined : { width: '47%', flexGrow: 1 }}
      onPress={() => {
        setSel(w.id);
        // Tapping a French tile says it, so you can hear the options before checking.
        if (kind === 'pick') speak(display(w), language.locale);
      }}
    />
  ));

  return (
    <>
      {kind === 'meaning' && <MascotPrompt text="What does this mean?" pose="think" />}
      {kind === 'listen' && (
        <Txt variant="bodyLg" style={{ textAlign: 'center' }}>
          Tap what you hear
        </Txt>
      )}

      <View style={{ flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center', gap: Space[4] }}>
        {kind === 'meaning' && <WordPanel word={word} said={said} />}
        {kind === 'pick' && (
          <>
            <Txt variant="bodyLg">How do you say…</Txt>
            <Panel fill={p.skySoft} radius={32} style={{ paddingVertical: 22, paddingHorizontal: 34, borderBottomLeftRadius: 10 }}>
              <Txt variant="caption" color={p.onBright} style={{ textAlign: 'center' }}>
                English
              </Txt>
              <Txt color={p.onBright} style={{ fontFamily: Font.display600, fontSize: 36, lineHeight: 44, textAlign: 'center' }}>
                {gloss(word)}
              </Txt>
            </Panel>
            <Txt variant="label" color={p.inkMuted}>
              Tap an answer to hear it.
            </Txt>
          </>
        )}
        {kind === 'listen' && <ListenCapsule text={said} />}
      </View>

      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Answers"
        style={kind === 'listen' ? { gap: 10 } : { flexDirection: 'row', flexWrap: 'wrap', gap: Space[3] }}>
        {tiles}
      </View>

      <CheckButton enabled={sel !== null && !answered} onPress={check} />
    </>
  );
}

/** The French word on a small card framed in its rarity colour, with a play button. */
function WordPanel({ word, said }: { word: LessonWord; said: string }) {
  const p = usePalette();
  const { language } = useLanguage();
  const info = RarityInfo[word.rarity];

  useEffect(() => {
    speak(said, language.locale);
  }, [said, language.locale]);

  return (
    <Panel fill={info.color} radius={28} style={{ width: 260, padding: 10 }}>
      <View style={{ alignItems: 'center', gap: 12, paddingTop: 22, paddingBottom: 18, paddingHorizontal: 14, backgroundColor: p.paper, borderColor: p.line, borderWidth: Stroke[2], borderRadius: 20 }}>
        <Txt variant="caption" color={p.onBrightMuted}>
          {info.name} {starString(word.rarity)}
        </Txt>
        <Txt color={p.onBright} numberOfLines={2} adjustsFontSizeToFit style={{ fontFamily: Font.display600, fontSize: 38, lineHeight: 44, textAlign: 'center' }}>
          {said}
        </Txt>
        <RoundAudio label="Hear the word" fill={p.sky} size={48} onPress={() => speak(said, language.locale)}>
          <SpeakerIcon color={p.onBright} fill={p.paper} />
        </RoundAudio>
      </View>
    </Panel>
  );
}

/** The play button is a capsule that wobbles open while the word plays. Plays once on arrival. */
function ListenCapsule({ text }: { text: string }) {
  const p = usePalette();
  const { language } = useLanguage();
  const wobble = useSharedValue(0);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${wobble.get()}deg` }, { scale: 1 + Math.abs(wobble.get()) / 60 }] }));
  const played = useRef(false);

  const play = (rate?: number) => {
    speak(text, language.locale, rate);
    wobble.set(withSequence(withRepeat(withTiming(8, { duration: 160, easing: Easing.inOut(Easing.ease) }), 6, true), withTiming(0, { duration: 160 })));
  };

  useEffect(() => {
    if (played.current) return;
    played.current = true;
    speak(text, language.locale);
    wobble.set(withSequence(withRepeat(withTiming(8, { duration: 160 }), 6, true), withTiming(0, { duration: 160 })));
  }, [text, language.locale, wobble]);

  return (
    <View style={{ alignItems: 'center', gap: 18 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Play the word" onPress={() => play()}>
        <Animated.View style={style}>
          <Capsule color={p.sky} line={p.line} size={150} />
        </Animated.View>
      </Pressable>
      <PillButton label="Slower" fill={p.skySoft} lift={3} onPress={() => play(0.5)} style={{ minHeight: 44, paddingHorizontal: 16 }} />
    </View>
  );
}
