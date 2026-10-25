import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  FadeOut,
  SlideInDown,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polygon } from 'react-native-svg';

import { LottoMascot } from '@/components/art/lotto-mascot';
import { CheckIcon, ClockIcon, StarPoints } from '@/components/icons';
import { Screen, ScreenHeader, goBack } from '@/components/screen';
import { PullEarnedPopup } from '@/components/pull-earned-popup';
import { speak } from '@/components/speak-button';
import { StreakPopup } from '@/components/streak-popup';
import { PillButton, Sticker } from '@/components/sticker';
import { Txt } from '@/components/text';
import type { Word } from '@/data/words';
import { useGame } from '@/state/game';
import { useLanguage } from '@/state/language';
import { useLotto } from '@/state/lotto';
import { useMyWords } from '@/state/my-words';
import { useStreak } from '@/state/streak';
import { Font } from '@/theme/fonts';
import { Bounce, Radius, Space, Stroke } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';
import type { BonusPullRow } from '@/utils/lotto';

const RoundSize = 5;

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Up to five of the learner's words with different meanings, so every pair has one right answer. */
function pickRound(words: Word[]) {
  const pairs = shuffle(words)
    .filter((w, i, all) => all.findIndex((o) => o.meaning === w.meaning) === i)
    .slice(0, RoundSize);
  return { pairs, meanings: shuffle(pairs) };
}

function formatClock(ms: number) {
  const secs = Math.floor(ms / 1000);
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

/** Matching: tap a word, then its meaning, until every pair is matched. */
export default function MatchScreen() {
  const { language } = useLanguage();
  const myWords = useMyWords();
  const [round, setRound] = useState(0);

  if (myWords.loading) {
    return <MatchMessage title="Shuffling tiles…" detail={`Getting your ${language.name} words ready.`} loading />;
  }
  if (myWords.error && myWords.words.length === 0) {
    return <MatchMessage title="Couldn't load" detail={`We couldn't load your words. ${myWords.error}`} />;
  }
  if (myWords.words.length < 2) {
    return <MatchMessage title="Not enough words" detail={`Pull a capsule or two to get more ${language.name} words to match.`} />;
  }
  // A new key starts a fresh round with new words and a reset clock.
  return <MatchRound key={round} words={myWords.words} onAgain={() => setRound((r) => r + 1)} />;
}

type TileState = 'idle' | 'selected' | 'wrong' | 'done';

function MatchRound({ words, onAgain }: { words: Word[]; onAgain: () => void }) {
  const p = usePalette();
  const { language } = useLanguage();
  const insets = useSafeAreaInsets();
  const game = useGame();
  const streak = useStreak();
  const lotto = useLotto();
  const [bonus, setBonus] = useState<BonusPullRow | null>(null);
  const [{ pairs, meanings }] = useState(() => pickRound(words));
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(startedAt);
  const [matched, setMatched] = useState<string[]>([]);
  const [selLeft, setSelLeft] = useState<string | null>(null);
  const [selRight, setSelRight] = useState<string | null>(null);
  const [wrong, setWrong] = useState<{ left: string; right: string } | null>(null);
  const [justMatched, setJustMatched] = useState<string | null>(null);
  const [combo, setCombo] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const finished = matched.length === pairs.length;

  // Ticks the clock each second, and stamps the final time once when the last pair is matched.
  useEffect(() => {
    const tick = () => setNow(Date.now());
    if (finished) {
      const id = setTimeout(tick, 0);
      return () => clearTimeout(id);
    }
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [finished]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  const tryPair = (left: string, right: string) => {
    if (left === right) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const next = [...matched, left];
      setMatched(next);
      setSelLeft(null);
      setSelRight(null);
      setCombo((c) => c + 1);
      setJustMatched(left);
      later(() => setJustMatched(null), 900);
      game.recordAnswer(left, true);
      if (next.length === pairs.length) {
        streak.markPlayed('study');
        lotto
          .claimBonus('match')
          .then((row) => row.granted && setBonus(row))
          .catch((e: Error) => console.warn(`Couldn't claim the bonus pull: ${e.message}`));
      }
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setWrong({ left, right });
      setMistakes((m) => m + 1);
      setCombo(0);
      game.recordAnswer(left, false);
      later(() => {
        setWrong(null);
        setSelLeft(null);
        setSelRight(null);
      }, 450);
    }
  };

  const pick = (side: 'left' | 'right', id: string) => {
    if (wrong || matched.includes(id)) return;
    Haptics.selectionAsync().catch(() => {});
    if (side === 'left') {
      if (selRight !== null) tryPair(id, selRight);
      else setSelLeft(selLeft === id ? null : id);
    } else if (selLeft !== null) tryPair(selLeft, id);
    else setSelRight(selRight === id ? null : id);
  };

  const stateOf = (side: 'left' | 'right', id: string): TileState => {
    if (matched.includes(id)) return 'done';
    if (wrong?.[side] === id) return 'wrong';
    return (side === 'left' ? selLeft : selRight) === id ? 'selected' : 'idle';
  };

  const clock = formatClock(now - startedAt);
  const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <ScreenHeader
          kind="close"
          backLabel="Quit matching"
          fallback="/exercises"
          center={
            <View
              accessibilityRole="progressbar"
              accessibilityLabel="Pairs matched"
              accessibilityValue={{ min: 0, max: pairs.length, now: matched.length }}
              style={{ flex: 1, height: 22, padding: 3, backgroundColor: p.surfaceSunken, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.pill }}>
              <View style={{ height: '100%', width: `${(matched.length / pairs.length) * 100}%`, minWidth: 10, backgroundColor: p.pink, borderRadius: Radius.pill }} />
            </View>
          }
          trailing={
            <View
              accessibilityRole="timer"
              accessibilityLabel={`Time ${clock}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                paddingVertical: Space[1],
                paddingLeft: 7,
                paddingRight: 10,
                backgroundColor: p.white,
                borderColor: p.line,
                borderWidth: Stroke[2],
                borderRadius: Radius.pill,
              }}>
              <ClockIcon color={p.onBright} fill={p.sunshine} size={16} />
              <Txt color={p.onBright} style={{ fontFamily: Font.body900, fontSize: 15, lineHeight: 20, fontVariant: ['tabular-nums'] }}>
                {clock}
              </Txt>
            </View>
          }
        />

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: Space[2] }}>
          <View style={{ flexShrink: 1 }}>
            <Txt variant="title" accessibilityRole="header">
              Match the pairs
            </Txt>
            <Txt variant="label" color={p.inkMuted} style={{ fontSize: 15, lineHeight: 20 }}>
              Tap a word, then its meaning.
            </Txt>
          </View>
          {combo >= 2 && justMatched && !finished && (
            <Animated.View
              key={combo}
              entering={ZoomIn.duration(240).easing(Easing.bezier(...Bounce).factory())}
              exiting={FadeOut.duration(200)}
              accessibilityLiveRegion="polite"
              style={{ paddingVertical: 3, paddingHorizontal: 11, backgroundColor: p.tangerine, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.pill }}>
              <Txt color={p.onBright} style={{ fontFamily: Font.display700, fontSize: 16, lineHeight: 20 }}>
                {combo} in a row!
              </Txt>
            </Animated.View>
          )}
        </View>

        <View style={{ flex: 1, minHeight: 0, flexDirection: 'row', gap: Space[3] }}>
          <View accessibilityLabel="Words" style={{ flex: 1, gap: Space[3] }}>
            {pairs.map((w) => (
              <MatchTile key={w.id} label={w.word} kind="word" state={stateOf('left', w.id)} pop={justMatched === w.id} onPress={() => {
                  speak(w.word, language.locale);
                  pick('left', w.id);
                }}
              />
            ))}
          </View>
          <View accessibilityLabel="Meanings" style={{ flex: 1, gap: Space[3] }}>
            {meanings.map((w) => (
              <MatchTile key={w.id} label={w.meaning} kind="meaning" state={stateOf('right', w.id)} pop={justMatched === w.id} onPress={() => pick('right', w.id)} />
            ))}
          </View>
        </View>
      </Screen>

      {finished && (
        <Animated.View
          entering={SlideInDown.duration(380)}
          accessibilityLiveRegion="polite"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            gap: Space[3],
            paddingTop: 22,
            paddingHorizontal: Space[4],
            paddingBottom: insets.bottom + Space[4],
            backgroundColor: p.leafSoft,
            borderColor: p.line,
            borderTopWidth: Stroke[3],
            borderTopLeftRadius: Radius.lg,
            borderTopRightRadius: Radius.lg,
          }}>
          <View accessible accessibilityLabel={`${stars} out of 3 stars`} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: -48 }}>
            {[1, 2, 3].map((n) => (
              <Animated.View
                key={n}
                entering={ZoomIn.delay(n * 150)
                  .duration(380)
                  .easing(Easing.bezier(...Bounce).factory())}
                style={{ marginTop: n === 2 ? 0 : 12 }}>
                <Svg width={n === 2 ? 64 : 50} height={n === 2 ? 64 : 50} viewBox="0 0 24 24">
                  <Polygon points={StarPoints} fill={n <= stars ? p.sunshine : p.white} stroke={p.line} strokeWidth={1.8} strokeLinejoin="round" />
                </Svg>
              </Animated.View>
            ))}
          </View>
          <Txt color={p.onBright} style={{ fontFamily: Font.display700, fontSize: 30, lineHeight: 34 }}>
            {stars === 3 ? 'Perfect match!' : stars === 2 ? 'Nice matching!' : 'All matched!'}
          </Txt>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <ResultChip label={`Time ${clock}`} />
            <ResultChip label={mistakes === 0 ? 'No mistakes' : `${mistakes} ${mistakes === 1 ? 'mistake' : 'mistakes'}`} />
          </View>
          <View style={{ alignSelf: 'stretch', flexDirection: 'row', gap: 10, marginTop: Space[1] }}>
            <PillButton label="Done" fill={p.white} style={{ flex: 1 }} onPress={() => goBack('/exercises')} />
            <PillButton label="Play again" fill={p.leaf} style={{ flex: 1.4 }} onPress={onAgain} />
          </View>
        </Animated.View>
      )}

      {finished && streak.streakPopup && <StreakPopup reason={streak.streakPopup} streak={streak.streak} onClose={streak.closeStreakPopup} />}
      {finished && !streak.streakPopup && bonus && (
        <PullEarnedPopup source="match" pulls={bonus.current_lotto_pulls} maxPulls={bonus.max_lotto_pulls} onClose={() => setBonus(null)} />
      )}
    </View>
  );
}

type MatchTileProps = { label: string; kind: 'word' | 'meaning'; state: TileState; pop: boolean; onPress: () => void };

function MatchTile({ label, kind, state, pop, onPress }: MatchTileProps) {
  const p = usePalette();
  const shake = useSharedValue(0);
  const scale = useSharedValue(1);
  const motion = useAnimatedStyle(() => ({ transform: [{ translateX: shake.get() }, { scale: scale.get() }] }));
  const fill = { idle: p.white, selected: p.sunshine, wrong: p.cherry, done: p.leafSoft }[state];
  const done = state === 'done';

  useEffect(() => {
    if (state === 'wrong') {
      shake.set(withSequence(withTiming(-7, { duration: 60 }), withRepeat(withTiming(7, { duration: 90 }), 3, true), withTiming(0, { duration: 60 })));
    }
  }, [state, shake]);

  useEffect(() => {
    if (pop) scale.set(withSequence(withTiming(1.08, { duration: 160 }), withTiming(1, { duration: 200 })));
  }, [pop, scale]);

  return (
    <Animated.View style={[{ flex: 1, minHeight: 64, opacity: done && !pop ? 0.55 : 1 }, motion]}>
      <Sticker
        accessibilityRole="button"
        accessibilityLabel={done ? `${label}, matched` : label}
        accessibilityState={{ disabled: done, selected: state === 'selected' }}
        fill={fill}
        radius={22}
        lift={state === 'selected' ? 6 : 4}
        disabled={done}
        onPress={onPress}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10 }}>
        {done && <CheckIcon color={p.onBright} size={18} />}
        <Txt
          color={p.onBright}
          numberOfLines={2}
          adjustsFontSizeToFit
          style={
            kind === 'word'
              ? { flexShrink: 1, textAlign: 'center', fontFamily: Font.display600, fontSize: 21, lineHeight: 25 }
              : { flexShrink: 1, textAlign: 'center', fontFamily: Font.body900, fontSize: 17, lineHeight: 22 }
          }>
          {label}
        </Txt>
      </Sticker>
    </Animated.View>
  );
}

function ResultChip({ label }: { label: string }) {
  const p = usePalette();
  return (
    <View style={{ paddingVertical: Space[1], paddingHorizontal: Space[3], backgroundColor: p.white, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.pill }}>
      <Txt color={p.onBright} style={{ fontFamily: Font.body900, fontSize: 14, lineHeight: 18 }}>
        {label}
      </Txt>
    </View>
  );
}

function MatchMessage({ title, detail, loading = false }: { title: string; detail: string; loading?: boolean }) {
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
      {!loading && <PillButton label="Back to Study" fill={p.pink} style={{ alignSelf: 'stretch' }} onPress={() => goBack('/exercises')} />}
    </Screen>
  );
}
