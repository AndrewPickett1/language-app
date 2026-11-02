import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { Easing, SlideInDown, ZoomIn, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';

import { LottoMascot } from '@/components/art/lotto-mascot';
import { CheckIcon, CloseIcon } from '@/components/icons';
import { Screen, ScreenHeader, goBack } from '@/components/screen';
import { PullEarnedPopup } from '@/components/pull-earned-popup';
import { speak } from '@/components/speak-button';
import { StreakPopup } from '@/components/streak-popup';
import { Panel, PillButton, Sticker } from '@/components/sticker';
import { Txt } from '@/components/text';
import { gloss } from '@/data/lesson';
import { RarityInfo } from '@/data/rarity';
import { useAuth } from '@/state/auth';
import { useGame } from '@/state/game';
import { useLanguage } from '@/state/language';
import { useLotto } from '@/state/lotto';
import { useStreak } from '@/state/streak';
import { Font } from '@/theme/fonts';
import { Bounce, Radius, Space, Stroke } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';
import { bareNoun, fetchGenderNouns, genderTip, withArticle, type GenderNoun } from '@/utils/gender-nouns';
import type { BonusPullRow } from '@/utils/lotto';

const SessionSize = 10;

type Gender = GenderNoun['gender'];
type Loaded = { key: string; nouns: GenderNoun[]; error: string | null };

/** Gender: is each of the learner's own nouns masculine or feminine? */
export default function GenderScreen() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [loaded, setLoaded] = useState<Loaded>();
  const [round, setRound] = useState(0);
  const userId = user?.id;
  // A fresh fetch for each round, so every session draws a new random set.
  const key = `${userId}-${language.code}-${round}`;

  useEffect(() => {
    if (!userId) return;
    let live = true;
    fetchGenderNouns(userId, language).then(
      (nouns) => live && setLoaded({ key, nouns, error: null }),
      (e: Error) => live && setLoaded({ key, nouns: [], error: e.message })
    );
    return () => {
      live = false;
    };
  }, [userId, language, key]);

  const current = loaded?.key === key ? loaded : undefined;
  if (!current) return <GenderMessage title="Sorting nouns…" detail={`Getting your ${language.name} nouns ready.`} loading />;
  if (current.error) return <GenderMessage title="Couldn't load" detail={`We couldn't load your words. ${current.error}`} />;
  if (current.nouns.length === 0) {
    return <GenderMessage title="No nouns yet" detail={`Pull a capsule or finish a lesson to get some ${language.name} nouns to sort.`} />;
  }
  return <GenderSession key={key} pool={current.nouns} onAgain={() => setRound((r) => r + 1)} />;
}

function GenderSession({ pool, onAgain }: { pool: GenderNoun[]; onAgain: () => void }) {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const game = useGame();
  const streak = useStreak();
  const lotto = useLotto();
  const [bonus, setBonus] = useState<BonusPullRow | null>(null);
  const [session] = useState(() => pool.slice(0, SessionSize));
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<Gender | null>(null);
  const [score, setScore] = useState(0);

  // Say each noun as it comes up, without its article so the answer isn't given away.
  const spoken = session[qi] && bareNoun(session[qi], language);
  useEffect(() => {
    if (spoken) speak(spoken, language.locale);
  }, [qi, spoken, language.locale]);

  if (qi >= session.length) {
    return (
      <>
        <GenderMessage title="Session done!" detail={`You got ${score} of ${session.length} right.`} onAgain={onAgain} />
        {streak.streakPopup ? (
          <StreakPopup reason={streak.streakPopup} streak={streak.streak} onClose={streak.closeStreakPopup} />
        ) : (
          bonus && <PullEarnedPopup source="study" pulls={bonus.current_lotto_pulls} maxPulls={bonus.max_lotto_pulls} onClose={() => setBonus(null)} />
        )}
      </>
    );
  }

  const noun = session[qi];
  const answered = picked !== null;
  const right = picked === noun.gender;
  const done = qi + (answered ? 1 : 0);
  const said = withArticle(noun, language);
  const tip = genderTip(noun, language);
  const last = qi + 1 >= session.length;

  const pick = (g: Gender) => {
    if (answered) return;
    const isRight = g === noun.gender;
    Haptics.notificationAsync(isRight ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error).catch(() => {});
    setPicked(g);
    if (isRight) setScore((s) => s + 1);
    game.recordAnswer(noun.id, isRight);
    speak(said, language.locale);
  };

  const next = () => {
    if (last) {
      lotto
        .claimBonus('study')
        .then((row) => row.granted && setBonus(row))
        .catch((e: Error) => console.warn(`Couldn't claim the bonus pull: ${e.message}`));
    }
    setPicked(null);
    setQi(qi + 1);
  };

  return (
    <View style={{ flex: 1 }}>
      <Screen style={{ gap: Space[4] }}>
        <ScreenHeader
          kind="close"
          backLabel="Quit study session"
          fallback="/exercises"
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

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" aria-hidden>
            <Rect x={4} y={3} width={16} height={18} rx={4} stroke={p.inkMuted} strokeWidth={3} strokeLinejoin="round" />
            <Path d="M9 3v18" stroke={p.inkMuted} strokeWidth={3} />
          </Svg>
          <Txt variant="caption" color={p.inkMuted}>
            From your words · {pool.length} {pool.length === 1 ? 'noun' : 'nouns'}
          </Txt>
        </View>

        <View style={{ flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center' }}>
          <Panel fill={RarityInfo[noun.rarity].color} radius={28} borderWidth={Stroke[3]} style={{ width: '100%', padding: 10 }}>
            <View
              style={{
                minHeight: 230,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                paddingVertical: Space[6],
                paddingHorizontal: Space[3],
                backgroundColor: p.paper,
                borderColor: p.line,
                borderWidth: Stroke[2],
                borderRadius: 20,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Space[3] }}>
                {answered && (
                  <Animated.View
                    key={qi}
                    entering={ZoomIn.duration(420).easing(Easing.bezier(...Bounce).factory())}
                    style={{ height: 56, justifyContent: 'center', paddingHorizontal: Space[4], backgroundColor: noun.gender === 'F' ? p.grape : p.tangerine, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.pill }}>
                    <Txt color={p.onBright} style={{ fontFamily: Font.display600, fontSize: 30, lineHeight: 34 }}>
                      {language.articles[noun.gender]}
                    </Txt>
                  </Animated.View>
                )}
                <Txt color={p.onBright} numberOfLines={1} adjustsFontSizeToFit style={{ flexShrink: 1, fontFamily: Font.display600, fontSize: 48, lineHeight: 52 }}>
                  {bareNoun(noun, language)}
                </Txt>
              </View>
              <Txt color={p.onBrightMuted} style={{ textAlign: 'center', fontFamily: Font.body800, fontSize: 18, lineHeight: 24 }}>
                {gloss(noun).toLowerCase().replace(/^the /, '')}
              </Txt>
            </View>
          </Panel>
        </View>

        <View accessibilityLabel="Pick the gender" style={{ flexDirection: 'row', gap: 14, paddingBottom: 6 }}>
          {(['M', 'F'] as const).map((g) => (
            <GenderButton key={`${qi}-${g}`} gender={g} article={language.articles[g]} picked={picked} answer={noun.gender} onPress={() => pick(g)} />
          ))}
        </View>
      </Screen>

      {answered && (
        <Animated.View
          entering={SlideInDown.duration(360)}
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
            backgroundColor: right ? p.leafSoft : p.sunshineSoft,
            borderColor: p.line,
            borderTopWidth: Stroke[3],
            borderTopLeftRadius: Radius.lg,
            borderTopRightRadius: Radius.lg,
          }}>
          <View style={{ gap: 2 }}>
            <Txt style={{ fontFamily: Font.display700, fontSize: 26, lineHeight: 30 }}>{right ? language.praise : 'Almost —'}</Txt>
            <Txt variant="body" style={{ fontFamily: Font.body800 }}>
              {right ? `${said} · ${gloss(noun).toLowerCase()}` : `it's ${said}. ${noun.word} is ${noun.gender === 'F' ? 'feminine' : 'masculine'}.`}
            </Txt>
            {tip && (
              <Txt variant="label" color={p.inkMuted}>
                {tip}
              </Txt>
            )}
          </View>
          <PillButton label={last ? 'Finish' : right ? 'Continue' : 'Got it'} fill={right ? p.leaf : p.sunshine} onPress={next} />
        </Animated.View>
      )}
    </View>
  );
}

type GenderButtonProps = { gender: Gender; article: string; picked: Gender | null; answer: Gender; onPress: () => void };

/** A big article pill: tangerine for masculine, grape for feminine, labelled so it never relies on colour. */
function GenderButton({ gender, article, picked, answer, onPress }: GenderButtonProps) {
  const p = usePalette();
  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.get() }] }));
  const isAnswer = gender === answer;
  const isPick = gender === picked;
  const answered = picked !== null;
  const wrongPick = isPick && !isAnswer;
  const name = gender === 'F' ? 'feminine' : 'masculine';

  useEffect(() => {
    if (!wrongPick) return;
    shake.set(withSequence(withTiming(-8, { duration: 60 }), withRepeat(withTiming(8, { duration: 120 }), 3, true), withTiming(0, { duration: 60 })));
  }, [wrongPick, shake]);

  return (
    <Animated.View style={[{ flex: 1, opacity: answered && !isAnswer && !isPick ? 0.45 : 1 }, shakeStyle]}>
      <Sticker
        accessibilityRole="button"
        accessibilityLabel={`${article}, ${name}`}
        accessibilityState={{ disabled: answered }}
        fill={gender === 'F' ? p.grape : p.tangerine}
        borderWidth={Stroke[3]}
        disabled={answered}
        onPress={onPress}
        style={{ height: 104, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <Txt color={p.onBright} style={{ fontFamily: Font.display600, fontSize: 38, lineHeight: 42 }}>
          {article}
        </Txt>
        <Txt variant="caption" color={p.onBright}>
          {name}
        </Txt>
        {answered && (isAnswer || isPick) && (
          <Animated.View
            entering={ZoomIn.duration(320).easing(Easing.bezier(...Bounce).factory())}
            style={{
              position: 'absolute',
              top: -10,
              right: 6,
              width: 36,
              height: 36,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isAnswer ? p.leaf : p.cherry,
              borderColor: p.line,
              borderWidth: Stroke[2],
              borderRadius: Radius.pill,
            }}>
            {isAnswer ? <CheckIcon color={p.onBright} size={18} /> : <CloseIcon color={p.onBright} size={14} />}
          </Animated.View>
        )}
      </Sticker>
    </Animated.View>
  );
}

function GenderMessage({ title, detail, loading = false, onAgain }: { title: string; detail: string; loading?: boolean; onAgain?: () => void }) {
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
      {!loading && (
        <View style={{ alignSelf: 'stretch', flexDirection: 'row', gap: 10 }}>
          <PillButton label={onAgain ? 'Done' : 'Back to Study'} fill={onAgain ? p.white : p.tangerine} style={{ flex: 1 }} onPress={() => goBack('/exercises')} />
          {onAgain && <PillButton label="Play again" fill={p.tangerine} style={{ flex: 1.4 }} onPress={onAgain} />}
        </View>
      )}
    </Screen>
  );
}
