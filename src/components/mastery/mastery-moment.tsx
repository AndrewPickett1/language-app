import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Polygon } from 'react-native-svg';

import { Capsule } from '@/components/art/capsule';
import { WordArt } from '@/components/art/word-art';
import { Foil, GrowFill } from '@/components/mastery/parts';
import { PassedPills } from '@/components/mastery/word-stats-card';
import { Panel, PillButton } from '@/components/sticker';
import { Txt } from '@/components/text';
import { HoloColors, masteryRules } from '@/data/mastery';
import { RarityInfo } from '@/data/rarity';
import type { Word } from '@/data/words';
import { Font } from '@/theme/fonts';
import { Fixed, Radius, Space, Stroke } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';
import { progressFor, type WordProgress } from '@/utils/word-progress';

/** Every this many mastered words earns a guaranteed Rare pull. Matches the server. */
const GuaranteeEvery = 10;

/** What mastering this word earned, worked out from a `record_word_results` summary. */
export type MasteryReward = {
  /** The pull for mastering it. False when pulls were already full. */
  pull: boolean;
  /** This word reached a multiple of 10 mastered words. */
  guarantee: boolean;
  /** Mastered words in total, counting this one. */
  total: number;
};

type Props = {
  word: Word;
  progress: Record<string, WordProgress>;
  reward: MasteryReward;
  /** "1 of 2" when several words were mastered at once. */
  position?: string;
  /** Moves to the next word's moment, or closes the last one. */
  onNext: () => void;
  nextLabel: string;
};

/**
 * The full-screen moment a word is mastered: slow rays, the card flipping in with a holo frame and a shine
 * sweep, a MASTERED stamp, the rules it passed and what it earned. Reduced motion shows the final state.
 */
export function MasteryMoment({ word, progress, reward, position, onNext, nextLabel }: Props) {
  const p = usePalette();
  const reduce = useReducedMotion();
  const rules = masteryRules(progressFor(progress, word.id));
  const towardNext = reward.total % GuaranteeEvery;

  const spin = useSharedValue(0);
  const flip = useSharedValue(reduce ? 1 : 0);
  const shine = useSharedValue(reduce ? 1 : 0);
  const stamp = useSharedValue(reduce ? 1 : 0);
  const [rays, setRays] = useState(0);

  useEffect(() => {
    if (reduce) return;
    spin.set(withRepeat(withTiming(360, { duration: 40000, easing: Easing.linear }), -1));
    flip.set(withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.4)) }));
    shine.set(withDelay(650, withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) })));
    stamp.set(withDelay(1100, withSpring(1, { damping: 9, stiffness: 180 })));
    return () => cancelAnimation(spin);
  }, [reduce, spin, flip, shine, stamp]);

  const raysStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.get()}deg` }] }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, flip.get() * 2),
    transform: [{ perspective: 900 }, { rotateY: `${(1 - flip.get()) * 90}deg` }, { scale: 0.85 + 0.15 * flip.get() }],
  }));
  const shineStyle = useAnimatedStyle(() => ({ opacity: shine.get() > 0 && shine.get() < 1 ? 0.7 : 0, transform: [{ translateX: -160 + shine.get() * 420 }, { rotate: '20deg' }] }));
  const stampStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, stamp.get() * 1.5), transform: [{ rotate: '-12deg' }, { scale: 2.2 - 1.2 * stamp.get() }] }));

  const rewardTitle = reward.guarantee ? 'Guaranteed Rare pull!' : reward.pull ? 'Mastery reward: +1 pull' : 'Your pulls are full';
  const rewardDetail = reward.guarantee
    ? `${reward.total} words mastered. Your next pull is a Rare or better.${reward.pull ? ' Plus +1 pull.' : ''}`
    : reward.pull
      ? 'For mastering this word.'
      : 'Spend a pull to make room for the next reward.';

  return (
    <View accessibilityViewIsModal style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Fixed.onBright, overflow: 'hidden' }}>
      <View
        pointerEvents="none"
        onLayout={(e) => setRays(Math.hypot(e.nativeEvent.layout.width, e.nativeEvent.layout.height))}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: '35%', alignItems: 'center', justifyContent: 'center' }}>
        {rays > 0 && (
          <Animated.View style={[{ width: rays, height: rays }, raysStyle]}>
            <Svg width={rays} height={rays} viewBox="-50 -50 100 100">
              {Array.from({ length: 12 }, (_, i) => {
                const a = (i / 12) * Math.PI * 2;
                const b = a + Math.PI / 24;
                return <Polygon key={i} points={`0,0 ${Math.cos(a) * 60},${Math.sin(a) * 60} ${Math.cos(b) * 60},${Math.sin(b) * 60}`} fill={p.sunshine} opacity={0.12} />;
              })}
            </Svg>
          </Animated.View>
        )}
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingHorizontal: Space[4], paddingTop: Space[4], paddingBottom: Space[4], gap: 14 }}>
          <View style={{ alignItems: 'center', gap: 2 }}>
            {position && (
              <Txt variant="caption" color={p.paper}>
                {position}
              </Txt>
            )}
            <Txt variant="displayLg" accessibilityRole="header" color={p.paper} style={{ textAlign: 'center' }}>
              Mastered!
            </Txt>
          </View>

          <View style={{ flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View style={[{ width: '72%', maxWidth: 280, flexShrink: 1 }, cardStyle]}>
              <Panel fill={p.sunshine} lift={6} style={{ gap: Space[2], padding: Space[3], overflow: 'hidden' }}>
                <Foil colors={HoloColors} moving radius={Radius.lg - Stroke[3]} />
                <View style={{ height: 130, alignItems: 'center', justifyContent: 'center', backgroundColor: p.paper, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.md }}>
                  <WordArt id={word.id} color={RarityInfo[word.rarity].color} line={p.line} width={120} />
                </View>
                <View style={{ paddingVertical: Space[2], paddingHorizontal: Space[3], backgroundColor: p.paper, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.md }}>
                  <Txt numberOfLines={1} adjustsFontSizeToFit color={p.onBright} style={{ fontFamily: Font.display700, fontSize: 30, lineHeight: 34 }}>
                    {word.word}
                  </Txt>
                  <Txt color={p.onBrightMuted} style={{ fontFamily: Font.body800, fontSize: 15, lineHeight: 20 }}>
                    {word.meaning}
                  </Txt>
                </View>
                <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: -40, bottom: -40, width: 46, backgroundColor: p.white }, shineStyle]} />
              </Panel>
              <Animated.View
                accessible
                accessibilityLabel="Mastered"
                style={[
                  { position: 'absolute', top: '38%', alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 4, backgroundColor: p.pink, borderColor: p.line, borderWidth: Stroke[3], borderRadius: Radius.sm },
                  stampStyle,
                ]}>
                <Txt color={p.onBright} style={{ fontFamily: Font.display700, fontSize: 26, lineHeight: 30, letterSpacing: 1 }}>
                  MASTERED ★
                </Txt>
              </Animated.View>
            </Animated.View>
          </View>

          <PassedPills rules={rules} />

          <Panel fill={p.paper} lift={0} radius={Radius.md} style={{ gap: Space[2], paddingVertical: Space[3], paddingHorizontal: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space[3] }}>
              <Capsule color={reward.guarantee ? p.sky : p.pink} line={p.line} size={44} />
              <View style={{ flex: 1 }}>
                <Txt color={p.onBright} style={{ fontFamily: Font.display600, fontSize: 19, lineHeight: 23 }}>
                  {rewardTitle}
                </Txt>
                <Txt variant="label" color={p.onBrightMuted}>
                  {rewardDetail}
                </Txt>
              </View>
            </View>
            <View style={{ gap: 4 }}>
              <View
                accessible
                accessibilityRole="progressbar"
                accessibilityLabel="Toward your next guaranteed Rare pull"
                accessibilityValue={{ min: 0, max: GuaranteeEvery, now: towardNext, text: `${towardNext} of ${GuaranteeEvery} mastered words` }}
                style={{ height: 14, padding: 2, overflow: 'hidden', backgroundColor: p.surfaceSunken, borderColor: p.line, borderWidth: Stroke[1], borderRadius: Radius.pill }}>
                {towardNext > 0 && <GrowFill to={(towardNext / GuaranteeEvery) * 100} color={p.sky} delay={900} />}
              </View>
              <Txt color={p.onBrightMuted} style={{ fontFamily: Font.body800, fontSize: 12, lineHeight: 16 }}>
                {towardNext} of {GuaranteeEvery} toward a guaranteed Rare pull
              </Txt>
            </View>
          </Panel>

          <View style={{ flexDirection: 'row', gap: Space[3] }}>
            <PillButton label="See my words" fill={p.white} style={{ flex: 1 }} onPress={() => router.replace('/words')} />
            <PillButton label="Pull a capsule" fill={p.sunshine} style={{ flex: 1 }} onPress={() => router.replace('/lotto')} />
          </View>
          <Pressable accessibilityRole="button" onPress={onNext} style={{ minHeight: 44, alignSelf: 'center', justifyContent: 'center', paddingHorizontal: Space[4] }}>
            <Txt color={p.paper} style={{ fontFamily: Font.body800, fontSize: 16, lineHeight: 22, textDecorationLine: 'underline' }}>
              {nextLabel}
            </Txt>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

/**
 * Splits a summary's rewards across the words it mastered, in order: the first `pullsGranted` words got a
 * pull, and a word that brought the total to a multiple of 10 got the guaranteed Rare.
 */
export function masteryRewards(mastered: string[], summary: { pullsGranted: number; guaranteesGranted: number; masteredTotal: number }): Record<string, MasteryReward> {
  const rewards: Record<string, MasteryReward> = {};
  const start = summary.masteredTotal - mastered.length;
  mastered.forEach((id, i) => {
    const total = start + i + 1;
    rewards[id] = { pull: i < summary.pullsGranted, guarantee: summary.guaranteesGranted > 0 && total % GuaranteeEvery === 0, total };
  });
  return rewards;
}
