import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { LottoMascot } from '@/components/art/lotto-mascot';
import { CheckIcon } from '@/components/icons';
import { ChoiceQuiz } from '@/components/lesson/choice-quiz';
import { GenderPick } from '@/components/lesson/gender-pick';
import { MatchPairs } from '@/components/lesson/match-pairs';
import { FeedbackSheet, type Feedback } from '@/components/lesson/shared';
import { PullEarnedPopup } from '@/components/pull-earned-popup';
import { goBack, Screen, ScreenHeader } from '@/components/screen';
import { StreakPopup } from '@/components/streak-popup';
import { Panel, PillButton } from '@/components/sticker';
import { Txt } from '@/components/text';
import { buildDailyReview } from '@/data/daily-review';
import { RetryKinds, type LessonWord, type Step } from '@/data/lesson';
import { useGame } from '@/state/game';
import { useLanguage } from '@/state/language';
import { useLotto } from '@/state/lotto';
import { useMyWords } from '@/state/my-words';
import { useStreak } from '@/state/streak';
import { Font } from '@/theme/fonts';
import { Radius, Space, Stroke } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';
import type { DailyReviewRow } from '@/utils/daily-review';
import { fetchLessonDeck } from '@/utils/modules';
import type { WordProgress } from '@/utils/word-progress';

/**
 * The Daily Review: a mix of exercises on the learner's own words, planned by `buildDailyReview`
 * (`src/data/daily-review.ts`). The day's first finished round earns a pull; every round keeps the streak.
 */
export default function ReviewScreen() {
  const { language } = useLanguage();
  const myWords = useMyWords();
  const [deck, setDeck] = useState<{ language: string; words: LessonWord[] }>();
  // Practice more starts a fresh round, with newly picked words.
  const [round, setRound] = useState(0);

  useEffect(() => {
    let live = true;
    // The deck supplies wrong answers and each word's kind, so if it fails the learner's own words stand in.
    fetchLessonDeck(language.name)
      .catch((): LessonWord[] => [])
      .then((words) => {
        if (live) setDeck({ language: language.name, words });
      });
    return () => {
      live = false;
    };
  }, [language.name]);

  if (myWords.loading || deck?.language !== language.name) {
    return <ReviewMessage title="Mixing it up…" detail={`Getting your ${language.name} review ready.`} loading />;
  }
  if (myWords.error && myWords.words.length === 0) {
    return <ReviewMessage title="Couldn't load" detail={`We couldn't load your words. ${myWords.error}`} />;
  }
  if (myWords.words.length === 0) {
    return <ReviewMessage title="No words yet" detail={`Pull a capsule or finish a lesson to get some ${language.name} words to review.`} />;
  }

  // My words flattens the database's word type, so each word's kind comes from the deck.
  const kinds = new Map(deck.words.map((w) => [w.id, w.kind]));
  const pool: LessonWord[] = myWords.words.map((w) => ({ ...w, kind: kinds.get(w.id) ?? w.type }));
  return <ReviewSession key={round} pool={pool} deck={deck.words} progress={myWords.progress} onAgain={() => setRound((r) => r + 1)} />;
}

type Stats = { combo: number; best: number; right: number; total: number };
type SessionProps = { pool: LessonWord[]; deck: LessonWord[]; progress: Record<string, WordProgress>; onAgain: () => void };

function ReviewSession({ pool, deck, progress, onAgain }: SessionProps) {
  const p = usePalette();
  const { language } = useLanguage();
  const game = useGame();
  const lotto = useLotto();
  const streak = useStreak();
  const myWords = useMyWords();
  // Built once, so a refresh of My words mid-round doesn't reshuffle the questions.
  const [steps, setSteps] = useState<Step[]>(() => buildDailyReview(pool, deck, progress, language));
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [stats, setStats] = useState<Stats>({ combo: 0, best: 0, right: 0, total: 0 });
  const [result, setResult] = useState<DailyReviewRow | 'failed' | null>(null);
  const [showPull, setShowPull] = useState(false);

  // Answers go to the server as they happen. Listen & pick is recall; every other step picks from options.
  const record = (right: boolean, word: LessonWord, kind: 'recognition' | 'recall' = 'recognition') => {
    game.recordAnswer(word.id, right, kind);
    setStats((s) => {
      const combo = right ? s.combo + 1 : 0;
      return { combo, best: Math.max(s.best, combo), right: s.right + (right ? 1 : 0), total: s.total + 1 };
    });
  };

  // A wrong answer comes back once at the end of the round, as in a lesson.
  const answer = (right: boolean, next: Feedback) => {
    const step = steps[index];
    if (step.kind === 'gender') record(right, step.noun);
    else if (step.kind === 'listen') record(right, step.word, 'recall');
    else if (step.kind === 'meaning' || step.kind === 'pick') record(right, step.word);
    if (!right && !step.retry && RetryKinds.includes(step.kind)) {
      setSteps((s) => [...s, { ...step, key: `${step.key}-retry`, retry: true }]);
    }
    setFeedback(next);
  };

  const advance = () => {
    setFeedback(null);
    const next = index + 1;
    setIndex(next);
    if (next < steps.length) return;
    // The server decides whether this is the day's first round, which earns the pull.
    lotto.completeReview().then(
      (row) => {
        setResult(row);
        if (row.granted) setShowPull(true);
        void myWords.refresh();
      },
      (e: Error) => {
        console.warn(`Couldn't finish the review: ${e.message}`);
        setResult('failed');
      }
    );
  };

  if (steps.length === 0) {
    return <ReviewMessage title="Nothing to review" detail="Your words are all set for now. Come back later!" />;
  }

  if (index >= steps.length) {
    const accuracy = stats.total ? Math.round((stats.right / stats.total) * 100) : null;
    return (
      <>
        <ReviewDone result={result} accuracy={accuracy} bestCombo={stats.best} onAgain={onAgain} />
        {streak.streakPopup ? (
          <StreakPopup reason={streak.streakPopup} streak={streak.streak} onClose={streak.closeStreakPopup} />
        ) : (
          showPull &&
          result !== 'failed' &&
          result?.current_lotto_pulls != null &&
          result.max_lotto_pulls != null && (
            <PullEarnedPopup source="review" pulls={result.current_lotto_pulls} maxPulls={result.max_lotto_pulls} onClose={() => setShowPull(false)} />
          )
        )}
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
          backLabel="Quit review"
          fallback="/exercises"
          center={
            <View
              accessibilityRole="progressbar"
              accessibilityLabel="Review progress"
              accessibilityValue={{ min: 0, max: steps.length, now: done }}
              style={{ flex: 1, height: 22, padding: 3, backgroundColor: p.surfaceSunken, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.pill }}>
              <View style={{ height: '100%', width: `${(done / steps.length) * 100}%`, minWidth: 10, backgroundColor: p.leaf, borderRadius: Radius.pill }} />
            </View>
          }
          trailing={
            <Txt variant="label" accessibilityLabel={`${stats.combo} in a row`} style={{ fontFamily: Font.body900, fontSize: 15, lineHeight: 20 }}>
              ×{stats.combo}
            </Txt>
          }
        />

        {(step.kind === 'meaning' || step.kind === 'pick' || step.kind === 'listen') && (
          <ChoiceQuiz key={step.key} kind={step.kind} word={step.word} options={step.options} retry={step.retry} onAnswer={answer} />
        )}
        {step.kind === 'gender' && <GenderPick key={step.key} noun={step.noun} indefinite={step.indefinite} ruleFirst={false} onAnswer={answer} />}
        {step.kind === 'match' && (
          <MatchPairs
            key={step.key}
            words={step.words}
            onTry={(right, id) => {
              const word = step.words.find((w) => w.id === id);
              if (word) record(right, word);
            }}
            onDone={setFeedback}
          />
        )}
      </Screen>

      {feedback && <FeedbackSheet feedback={feedback} onNext={advance} />}
    </View>
  );
}

type DoneProps = { result: DailyReviewRow | 'failed' | null; accuracy: number | null; bestCombo: number; onAgain: () => void };

/** The end of a round: how it went, and whether it earned today's pull. */
function ReviewDone({ result, accuracy, bestCombo, onAgain }: DoneProps) {
  const p = usePalette();
  const first = result !== null && result !== 'failed' && result.first_today;
  const note =
    result === null
      ? 'Saving your review…'
      : result === 'failed'
        ? "We couldn't save this round. Check your connection and try another."
        : result.reason === 'granted'
          ? "Today's review is done, and it earned you a pull!"
          : result.reason === 'full'
            ? "Today's review is done. Your tray was full, so there was no room for a bonus pull."
            : "Extra practice! Today's pull is already claimed, so this round is just for you.";
  const stats = [
    { value: accuracy === null ? '–' : `${accuracy}%`, label: 'Accuracy' },
    { value: `×${bestCombo}`, label: 'Best combo' },
  ];

  return (
    <Screen style={{ alignItems: 'center', justifyContent: 'center', gap: Space[6] }}>
      <LottoMascot line={p.line} width={170} pose="cheer" />
      <View style={{ alignItems: 'center', gap: Space[2] }}>
        {first && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2, paddingLeft: 6, paddingRight: 10, backgroundColor: p.white, borderColor: p.line, borderWidth: Stroke[1], borderRadius: Radius.pill }}>
            <CheckIcon color={p.onBright} size={12} />
            <Txt color={p.onBright} style={{ fontFamily: Font.body900, fontSize: 11, lineHeight: 14, letterSpacing: 0.66 }}>
              DONE TODAY
            </Txt>
          </View>
        )}
        <Txt variant="displayXl" accessibilityRole="header" style={{ textAlign: 'center' }}>
          Review done!
        </Txt>
        <Txt variant="bodyLg" accessibilityLiveRegion="polite" style={{ textAlign: 'center' }}>
          {note}
        </Txt>
      </View>
      <View style={{ alignSelf: 'stretch', flexDirection: 'row', gap: Space[3] }}>
        {stats.map((s) => (
          <Panel key={s.label} fill={p.white} style={{ flex: 1, alignItems: 'center', paddingVertical: Space[3] }}>
            <Txt color={p.onBright} style={{ fontFamily: Font.display700, fontSize: 30, lineHeight: 34 }}>
              {s.value}
            </Txt>
            <Txt variant="label" color={p.onBright}>
              {s.label}
            </Txt>
          </Panel>
        ))}
      </View>
      <View style={{ alignSelf: 'stretch', flexDirection: 'row', gap: 10 }}>
        <PillButton label="Done" fill={p.white} style={{ flex: 1 }} onPress={() => goBack('/exercises')} />
        <PillButton label="Practice more" fill={p.leaf} disabled={result === null} style={{ flex: 1.4 }} onPress={onAgain} />
      </View>
    </Screen>
  );
}

function ReviewMessage({ title, detail, loading = false }: { title: string; detail: string; loading?: boolean }) {
  const p = usePalette();
  return (
    <Screen style={{ alignItems: 'center', justifyContent: 'center', gap: Space[6] }}>
      <LottoMascot line={p.line} width={180} pose={loading ? 'think' : 'shrug'} />
      <View style={{ alignItems: 'center', gap: Space[2] }}>
        <Txt variant="displayXl" accessibilityRole="header" style={{ textAlign: 'center' }}>
          {title}
        </Txt>
        <Txt variant="bodyLg" style={{ textAlign: 'center' }}>
          {detail}
        </Txt>
      </View>
      {!loading && <PillButton label="Back to Study" fill={p.leaf} style={{ alignSelf: 'stretch' }} onPress={() => goBack('/exercises')} />}
    </Screen>
  );
}
