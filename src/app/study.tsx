import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { SlideInDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';

import { LottoMascot } from '@/components/art/lotto-mascot';
import { WordArt } from '@/components/art/word-art';
import { CheckIcon, CloseIcon } from '@/components/icons';
import { Screen, ScreenHeader } from '@/components/screen';
import { SpeakButton, speak } from '@/components/speak-button';
import { StreakPopup } from '@/components/streak-popup';
import { Panel, PillButton, Sticker } from '@/components/sticker';
import { Txt } from '@/components/text';
import { RarityInfo } from '@/data/rarity';
import type { Word } from '@/data/words';
import { useGame } from '@/state/game';
import { useLanguage } from '@/state/language';
import { useMyWords } from '@/state/my-words';
import { useStreak } from '@/state/streak';
import { Font } from '@/theme/fonts';
import { Radius, Space, Stroke } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';
import { fetchDeck } from '@/utils/word-rows';

const SessionLength = 10;

type Question = { word: Word; options: string[] };

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Ten questions from the learner's words, `focusId` first. Wrong options come from the
 * language's whole deck plus the learner's words, and prefer the same word type.
 */
function buildSession(collected: Word[], deck: Word[], focusId?: string): Question[] {
  const focus = collected.find((w) => w.id === focusId);
  const rest = shuffle(collected.filter((w) => w !== focus));
  const picks = focus ? [focus, ...rest] : rest;
  const words = Array.from({ length: Math.min(SessionLength, Math.max(picks.length, 1) * 2) }, (_, i) => picks[i % picks.length]);

  return words.map((word) => {
    const others = [...deck, ...collected].filter((w) => w.meaning !== word.meaning);
    const sameType = shuffle(others.filter((w) => w.type === word.type));
    const distractors = [...sameType, ...shuffle(others)]
      .map((w) => w.meaning)
      .filter((m, i, all) => all.indexOf(m) === i)
      .slice(0, 3);
    return { word, options: shuffle([word.meaning, ...distractors]) };
  });
}

/** Quizzes the learner on the words they own in the selected language. */
export default function StudyScreen() {
  const { word: focusId } = useLocalSearchParams<{ word?: string }>();
  const { language } = useLanguage();
  const myWords = useMyWords();
  const [deck, setDeck] = useState<{ language: string; words: Word[] }>();

  useEffect(() => {
    let live = true;
    // The deck only supplies wrong answers, so if it fails to load the learner's own words stand in.
    fetchDeck(language.name)
      .catch(() => [])
      .then((words) => {
        if (live) setDeck({ language: language.name, words });
      });
    return () => {
      live = false;
    };
  }, [language.name]);

  if (myWords.loading || deck?.language !== language.name) {
    return <StudyMessage title="Shuffling cards…" detail={`Getting your ${language.name} words ready.`} loading />;
  }
  if (myWords.error && myWords.words.length === 0) {
    return <StudyMessage title="Couldn't load" detail={`We couldn't load your words. ${myWords.error}`} />;
  }
  // Built once, so a refresh of My words mid-session doesn't reshuffle the questions.
  return <StudySession words={myWords.words} deck={deck.words} focusId={focusId} />;
}

function StudySession({ words, deck, focusId }: { words: Word[]; deck: Word[]; focusId?: string }) {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const game = useGame();
  const streak = useStreak();
  const { language } = useLanguage();
  const [session] = useState(() => buildSession(words, deck, focusId));
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [artWidth, setArtWidth] = useState(0);

  // Say each card's word as it comes up.
  const cardWord = session[qi]?.word.word;
  useEffect(() => {
    if (cardWord) speak(cardWord, language.locale);
  }, [qi, cardWord, language.locale]);

  if (session.length === 0 || qi >= session.length) {
    return session.length === 0 ? (
      <StudyMessage title="No words yet" detail={`Pull a capsule to get your first ${language.name} word.`} />
    ) : (
      <>
        <StudyMessage title="Session done!" detail={`You got ${score} of ${session.length} right.`} />
        {streak.streakPopup && <StreakPopup reason={streak.streakPopup} streak={streak.streak} onClose={streak.closeStreakPopup} />}
      </>
    );
  }

  const q = session[qi];
  const answered = picked !== null;
  const right = picked === q.word.meaning;
  const done = qi + (answered ? 1 : 0);

  const pick = (option: string) => {
    if (answered) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    setPicked(option);
    const isRight = option === q.word.meaning;
    if (isRight) setScore((s) => s + 1);
    game.recordAnswer(q.word.id, isRight);
  };

  const next = () => {
    if (qi + 1 >= session.length) streak.markPlayed('study');
    setPicked(null);
    setQi(qi + 1);
  };

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <ScreenHeader
          kind="close"
          backLabel="Quit study session"
          center={
            <>
              <View
                accessibilityRole="progressbar"
                accessibilityLabel="Session progress"
                accessibilityValue={{ min: 0, max: session.length, now: done }}
                style={{ flex: 1, height: 22, padding: 3, backgroundColor: p.surfaceSunken, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.pill }}>
                <View style={{ height: '100%', width: `${(done / session.length) * 100}%`, minWidth: 10, backgroundColor: p.leaf, borderRadius: Radius.pill }} />
              </View>
              <Txt variant="label" style={{ fontFamily: Font.body900, fontSize: 15, lineHeight: 20 }}>
                {done} / {session.length}
              </Txt>
            </>
          }
        />

        <Txt variant="bodyLg" style={{ fontFamily: Font.body800 }}>
          What does this word mean?
        </Txt>

        <Panel fill={p.white} style={{ flex: 1, gap: 10, padding: Space[3] }}>
          <View
            onLayout={(e) => setArtWidth(e.nativeEvent.layout.width)}
            style={{ flex: 1, minHeight: 150, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#e9f9ff', borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.md }}>
            <Svg style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} width="100%" height="100%">
              <Defs>
                <Pattern id="study-dots" width={20} height={20} patternUnits="userSpaceOnUse">
                  <Circle cx={10} cy={10} r={3} fill="#a9e6f8" />
                </Pattern>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#study-dots)" />
            </Svg>
            {artWidth > 0 && <WordArt id={q.word.id} color={RarityInfo[q.word.rarity].color} line={p.line} width={Math.min(200, artWidth * 0.6)} />}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space[2], paddingHorizontal: Space[1] }}>
            <Txt color={p.onBright} style={{ flexShrink: 1, fontFamily: Font.display700, fontSize: 40, lineHeight: 46 }}>
              {q.word.word}
            </Txt>
            <SpeakButton text={q.word.word} />
          </View>
        </Panel>

        <View accessibilityLabel="Answers" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space[3] }}>
          {q.options.map((option) => (
            <AnswerButton
              key={`${qi}-${option}`}
              label={option}
              state={!answered ? 'idle' : option === q.word.meaning ? 'right' : option === picked ? 'wrong' : 'faded'}
              disabled={answered}
              onPress={() => pick(option)}
            />
          ))}
        </View>
      </Screen>

      {answered && (
        <Animated.View
          entering={SlideInDown.duration(350)}
          accessibilityLiveRegion="polite"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            gap: 14,
            paddingTop: 20,
            paddingHorizontal: Space[4],
            paddingBottom: insets.bottom + Space[4],
            backgroundColor: right ? p.leafSoft : p.pinkSoft,
            borderColor: p.line,
            borderTopWidth: Stroke[3],
            borderTopLeftRadius: Radius.lg,
            borderTopRightRadius: Radius.lg,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space[3] }}>
            <View style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: right ? p.leaf : p.cherry, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.pill }}>
              {right ? <CheckIcon color={p.onBright} size={24} /> : <CloseIcon color={p.onBright} size={20} />}
            </View>
            <View style={{ flex: 1 }}>
              <Txt style={{ fontFamily: Font.display700, fontSize: 26, lineHeight: 30 }}>{right ? '¡Muy bien!' : 'Almost!'}</Txt>
              <Txt variant="body" style={{ fontFamily: Font.body800 }}>
                {q.word.word} means {q.word.meaning}.
              </Txt>
            </View>
          </View>
          <PillButton label={qi + 1 >= session.length ? 'Finish' : 'Continue'} fill={right ? p.leaf : p.pink} onPress={next} />
        </Animated.View>
      )}
    </View>
  );
}

type AnswerState = 'idle' | 'right' | 'wrong' | 'faded';

function AnswerButton({ label, state, disabled, onPress }: { label: string; state: AnswerState; disabled: boolean; onPress: () => void }) {
  const p = usePalette();
  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.get() }] }));
  const fill = { idle: p.white, right: p.leaf, wrong: p.cherry, faded: p.white }[state];

  return (
    <Animated.View style={[{ width: '47%', flexGrow: 1, opacity: state === 'faded' ? 0.5 : 1 }, shakeStyle]}>
      <Sticker
        accessibilityRole="button"
        accessibilityState={{ disabled, selected: state === 'wrong' || state === 'right' }}
        fill={fill}
        radius={22}
        disabled={disabled}
        onPress={() => {
          onPress();
          shake.set(withSequence(withTiming(-6, { duration: 60 }), withRepeat(withTiming(6, { duration: 120 }), 3, true), withTiming(0, { duration: 60 })));
        }}
        style={{ height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Space[2], paddingHorizontal: Space[3] }}>
        {state === 'right' && <CheckIcon color={p.onBright} size={20} />}
        {state === 'wrong' && <CloseIcon color={p.onBright} size={18} />}
        <Txt color={p.onBright} numberOfLines={1} adjustsFontSizeToFit style={{ fontFamily: Font.display600, fontSize: 20, lineHeight: 24 }}>
          {label}
        </Txt>
      </Sticker>
    </Animated.View>
  );
}

function StudyMessage({ title, detail, loading = false }: { title: string; detail: string; loading?: boolean }) {
  const p = usePalette();
  return (
    <Screen style={{ alignItems: 'center', justifyContent: 'center', gap: Space[6] }}>
      <LottoMascot line={p.line} width={180} />
      <View style={{ alignItems: 'center', gap: Space[2] }}>
        <Txt variant="displayXl" accessibilityRole="header" style={{ textAlign: 'center' }}>
          {title}
        </Txt>
        <Txt variant="bodyLg" style={{ textAlign: 'center' }}>
          {detail}
        </Txt>
      </View>
      {!loading && <PillButton label="Keep going" fill={p.pink} style={{ alignSelf: 'stretch' }} onPress={() => router.dismissTo('/')} />}
    </Screen>
  );
}
