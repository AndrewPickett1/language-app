import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { Capsule } from '@/components/art/capsule';
import { LottoMascot } from '@/components/art/lotto-mascot';
import { ChoiceQuiz } from '@/components/lesson/choice-quiz';
import { GenderPick } from '@/components/lesson/gender-pick';
import { MatchPairs } from '@/components/lesson/match-pairs';
import { MeetWord } from '@/components/lesson/meet-word';
import { ModuleDone } from '@/components/lesson/module-done';
import { FeedbackSheet, type Feedback } from '@/components/lesson/shared';
import { goBack, Screen, ScreenHeader } from '@/components/screen';
import { StreakPopup } from '@/components/streak-popup';
import { PillButton } from '@/components/sticker';
import { Txt } from '@/components/text';
import { buildLesson, RetryKinds, type LessonWord, type Step } from '@/data/lesson';
import { useLanguage } from '@/state/language';
import { useLotto } from '@/state/lotto';
import { useStreak } from '@/state/streak';
import { Font } from '@/theme/fonts';
import { Radius, Space, Stroke } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';
import { completeModule, fetchLesson, fetchLessonDeck, type Lesson } from '@/utils/modules';

type Loaded = { id: string; lesson: Lesson | null; deck: LessonWord[]; error: string | null };

/** A Learn module, opened from the level map: its words taught through the Level 1 exercise types. */
export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { language } = useLanguage();
  const [loaded, setLoaded] = useState<Loaded>();

  useEffect(() => {
    let live = true;
    // The deck only supplies wrong answers and gender practice, so a lesson still runs without it.
    Promise.all([fetchLesson(id), fetchLessonDeck(language.name).catch((): LessonWord[] => [])])
      .then(([lesson, deck]): Loaded => ({ id, lesson, deck, error: null }))
      .catch((e: Error): Loaded => ({ id, lesson: null, deck: [], error: e.message }))
      .then((next) => {
        if (live) setLoaded(next);
      });
    return () => {
      live = false;
    };
  }, [id, language.name]);

  const current = loaded?.id === id ? loaded : undefined;
  if (!current) return <LessonMessage title="Opening the capsule…" detail="Getting your lesson ready." loading />;
  if (!current.lesson) return <LessonMessage title="Couldn't load" detail={`We couldn't open this module. ${current.error ?? ''}`} />;
  if (current.lesson.words.length === 0) return <LessonMessage title="Nothing here yet" detail="This module doesn't have any words yet." />;
  // Built once, so nothing reshuffles mid-lesson.
  return <LessonSession lesson={current.lesson} deck={current.deck} />;
}

type Stats = { combo: number; best: number; right: number; total: number };

function LessonSession({ lesson, deck }: { lesson: Lesson; deck: LessonWord[] }) {
  const p = usePalette();
  const lotto = useLotto();
  const streak = useStreak();
  const [steps, setSteps] = useState<Step[]>(() => buildLesson(lesson.words, deck));
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [stats, setStats] = useState<Stats>({ combo: 0, best: 0, right: 0, total: 0 });
  const [earnedPull, setEarnedPull] = useState(false);
  const claimed = useRef(false);
  const teachesArticles = lesson.words.some((w) => w.kind === 'Article');
  const firstGender = steps.findIndex((s) => s.kind === 'gender');

  const record = (right: boolean) => {
    setStats((s) => {
      const combo = right ? s.combo + 1 : 0;
      return { combo, best: Math.max(s.best, combo), right: s.right + (right ? 1 : 0), total: s.total + 1 };
    });
  };

  // A wrong answer comes back once at the end of the lesson.
  const answer = (right: boolean, next: Feedback) => {
    record(right);
    const step = steps[index];
    if (!right && !step.retry && RetryKinds.includes(step.kind)) {
      setSteps((s) => [...s, { ...step, key: `${step.key}-retry`, retry: true }]);
    }
    setFeedback(next);
  };

  const accuracy = stats.total ? Math.round((stats.right / stats.total) * 100) : null;

  const advance = () => {
    setFeedback(null);
    const next = index + 1;
    setIndex(next);
    if (next >= steps.length && !claimed.current) {
      // Finishing records the module as done and keeps the streak. The first time, it also earns a pull.
      claimed.current = true;
      completeModule(lesson.id, accuracy)
        .then(async (row) => {
          // Pulls and the streak come from the server, so reload both rather than counting here.
          await Promise.all([lotto.refresh(), streak.refresh('study')]);
          if (row.pull_granted) setEarnedPull(true);
        })
        .catch((e: Error) => console.warn(`Couldn't record the finished module: ${e.message}`));
    }
  };

  if (index >= steps.length) {
    return (
      <>
        <ModuleDone
          unit={lesson.unit}
          title={lesson.title}
          words={lesson.words}
          bestCombo={stats.best}
          accuracy={accuracy}
          earnedPull={earnedPull}
        />
        {streak.streakPopup && <StreakPopup reason={streak.streakPopup} streak={streak.streak} onClose={streak.closeStreakPopup} />}
      </>
    );
  }

  const step = steps[index];
  const done = index + (feedback ? 1 : 0);

  return (
    <View style={{ flex: 1 }}>
      <Screen style={{ gap: 14 }}>
        <ScreenHeader
          kind="close"
          backLabel="Quit lesson"
          fallback="/level-map"
          center={
            <View
              accessibilityRole="progressbar"
              accessibilityLabel="Lesson progress"
              accessibilityValue={{ min: 0, max: steps.length, now: done }}
              style={{ flex: 1, height: 22, padding: 3, backgroundColor: p.surfaceSunken, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.pill }}>
              <View style={{ height: '100%', width: `${(done / steps.length) * 100}%`, minWidth: 10, backgroundColor: p.pink, borderRadius: Radius.pill }} />
            </View>
          }
          trailing={step.kind === 'meet' ? <NewBadge /> : <ComboChip combo={stats.combo} />}
        />

        {step.kind === 'meet' && <MeetWord key={step.key} word={step.word} onDone={advance} />}
        {(step.kind === 'meaning' || step.kind === 'pick' || step.kind === 'listen') && (
          <ChoiceQuiz key={step.key} kind={step.kind} word={step.word} options={step.options} retry={step.retry} onAnswer={answer} />
        )}
        {step.kind === 'gender' && (
          <GenderPick key={step.key} noun={step.noun} indefinite={step.indefinite} ruleFirst={teachesArticles && index === firstGender} onAnswer={answer} />
        )}
        {step.kind === 'match' && <MatchPairs key={step.key} words={step.words} onTry={record} onDone={setFeedback} />}
      </Screen>

      {feedback && <FeedbackSheet feedback={feedback} onNext={advance} />}
    </View>
  );
}

function NewBadge() {
  const p = usePalette();
  return (
    <View style={{ paddingVertical: 3, paddingHorizontal: 10, backgroundColor: p.tangerine, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.pill }}>
      <Txt variant="caption" color={p.onBright} style={{ fontFamily: Font.body900 }}>
        New
      </Txt>
    </View>
  );
}

/** Answers in a row, on a little capsule. */
function ComboChip({ combo }: { combo: number }) {
  const p = usePalette();
  return (
    <View
      accessibilityLabel={`${combo} in a row`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2, paddingLeft: 4, paddingRight: 9, backgroundColor: p.white, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.pill }}>
      <Capsule color={p.pink} line={p.line} size={22} shine={false} stroke={5} />
      <Txt style={{ fontFamily: Font.body900, fontSize: 15, lineHeight: 20 }}>×{combo}</Txt>
    </View>
  );
}

function LessonMessage({ title, detail, loading = false }: { title: string; detail: string; loading?: boolean }) {
  const p = usePalette();
  return (
    <Screen style={{ alignItems: 'center', justifyContent: 'center', gap: Space[6] }}>
      <LottoMascot line={p.line} width={180} pose={loading ? 'wave' : 'think'} />
      <View style={{ alignItems: 'center', gap: Space[2] }}>
        <Txt variant="displayLg" accessibilityRole="header" style={{ textAlign: 'center' }}>
          {title}
        </Txt>
        <Txt variant="bodyLg" style={{ textAlign: 'center' }}>
          {detail}
        </Txt>
      </View>
      {!loading && <PillButton label="Back to the map" fill={p.pink} style={{ alignSelf: 'stretch' }} onPress={() => goBack('/level-map')} />}
    </Screen>
  );
}
