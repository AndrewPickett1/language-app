import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import type { Slide } from '@/components/lesson/concept-lesson';
import { B, Big, Card, FrWord, Gap, MascotScene, PronounPill, Sub, T, Tip } from '@/components/lesson/concepts/parts';
import { Txt } from '@/components/text';
import { Font } from '@/theme/fonts';
import { Stroke } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';

/**
 * Pronouns 1 (French): what a pronoun is, the common English ones, and je, vous, il, elle and nous.
 * Follows the Lesson — Pronouns 1 page of the Lingo Lotto Lessons design artifact.
 */
export const PronounsLesson: Slide[] = [
  { Body: Hello },
  {
    pose: 'point',
    say: (
      <>
        Words like <B>I</B> and <B>you</B> are called pronouns.
      </>
    ),
    title: "What's a pronoun?",
    Body: WhatsAPronoun,
  },
  { pose: 'point', say: 'Here are some other common ones.', title: 'Common pronouns', Body: CommonPronouns },
  { pose: 'wave', say: 'And this is what they are in French!', title: 'In French', Body: InFrench },
];

// 1 · Hi, I'm Lingo

function Hello() {
  return (
    <MascotScene
      pose="wave"
      chip="PRONOUNS 1"
      bubble={
        <>
          <T style={{ fontFamily: Font.display600, fontSize: 34, lineHeight: 38 }}>Hi, I&apos;m Lingo!</T>
          <T style={{ fontFamily: Font.body800, fontSize: 22, lineHeight: 30 }}>Good to see you.</T>
        </>
      }
    />
  );
}

// 2 · What's a pronoun?

function WhatsAPronoun() {
  const p = usePalette();
  const nudge = useSharedValue(0);
  const nudgeStyle = useAnimatedStyle(() => ({ transform: [{ translateY: nudge.get() }] }));
  useEffect(() => {
    const ease = { duration: 500, easing: Easing.inOut(Easing.quad) };
    nudge.set(withRepeat(withSequence(withTiming(4, ease), withTiming(0, ease)), -1));
  }, [nudge]);

  const sentence = (subject: string, rest: string, fill: string) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <View style={{ paddingHorizontal: 10, paddingVertical: 1, backgroundColor: fill, borderColor: p.line, borderWidth: Stroke[2], borderRadius: 14 }}>
        <T style={{ fontFamily: Font.display600, fontSize: 26, lineHeight: 32 }}>{subject}</T>
      </View>
      <T style={{ fontFamily: Font.display600, fontSize: 26, lineHeight: 32 }}>{rest}</T>
    </View>
  );

  const examples = [
    { from: 'Maya', to: 'She', rest: 'is hungry.' },
    { from: 'Sam and I', to: 'We', rest: 'are late.' },
  ];

  return (
    <View style={Gap}>
      <T style={Sub}>A pronoun stands in for a person, so you don&apos;t have to keep saying their name.</T>
      {examples.map((e) => (
        <Card key={e.to} style={{ alignItems: 'center', gap: 8, paddingVertical: 18, paddingHorizontal: 16 }}>
          <View accessible accessibilityLabel={`${e.from} ${e.rest} becomes ${e.to} ${e.rest}`} style={{ alignItems: 'center', gap: 8 }}>
            {sentence(e.from, e.rest, p.skySoft)}
            <Animated.View style={nudgeStyle}>
              <Svg width={28} height={30} viewBox="0 0 28 30">
                <Path d="M14 3 V24 M5 16 L14 26 L23 16" fill="none" stroke={p.line} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </Animated.View>
            {sentence(e.to, e.rest, p.sunshine)}
          </View>
        </Card>
      ))}
    </View>
  );
}

// 3 · Common pronouns

function CommonPronouns() {
  const p = usePalette();
  const rows = [
    { word: 'I', meaning: 'me, the one talking', fills: [p.pink] },
    { word: 'You', meaning: "the person I'm talking to", fills: [p.sky] },
    { word: 'He', meaning: 'a boy or a man', fills: [p.leaf] },
    { word: 'She', meaning: 'a girl or a woman', fills: [p.grape] },
    { word: 'We', meaning: 'me + someone else', fills: [p.pink, p.sky] },
  ];
  return (
    <View style={{ flexGrow: 1, gap: 10 }}>
      {rows.map((r, i) => (
        <Animated.View key={r.word} entering={FadeIn.delay(i * 70).duration(250)} style={{ flexGrow: 1 }}>
          <Card radius={24} style={{ flexGrow: 1, minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16 }}>
            <PronounPill text={r.word} />
            <T style={{ flex: 1, fontFamily: Font.body800, fontSize: 17, lineHeight: 22 }}>{r.meaning}</T>
            <People fills={r.fills} />
          </Card>
        </Animated.View>
      ))}
    </View>
  );
}

/** One person, or two side by side. */
function People({ fills }: { fills: string[] }) {
  const p = usePalette();
  if (fills.length === 1) {
    return (
      <Svg width={48} height={40} viewBox="0 0 48 40">
        <Path d="M12,38 A12,12 0 0 1 36,38 Z" fill={fills[0]} stroke={p.line} strokeWidth={3} strokeLinejoin="round" />
        <Circle cx={24} cy={14} r={8} fill={p.paper} stroke={p.line} strokeWidth={3} />
      </Svg>
    );
  }
  return (
    <Svg width={48} height={40} viewBox="0 0 48 40">
      <Path d="M2,38 A11,11 0 0 1 24,38 Z" fill={fills[0]} stroke={p.line} strokeWidth={3} strokeLinejoin="round" />
      <Circle cx={13} cy={16} r={7} fill={p.paper} stroke={p.line} strokeWidth={3} />
      <Path d="M24,38 A11,11 0 0 1 46,38 Z" fill={fills[1]} stroke={p.line} strokeWidth={3} strokeLinejoin="round" />
      <Circle cx={35} cy={16} r={7} fill={p.paper} stroke={p.line} strokeWidth={3} />
    </Svg>
  );
}

// 4 · In French

function InFrench() {
  const p = usePalette();
  const rows = [
    ['I', 'je'],
    ['You', 'vous'],
    ['He', 'il'],
    ['She', 'elle'],
    ['We', 'nous'],
  ];
  const header = { fontFamily: Font.body900, fontSize: 12, lineHeight: 16, letterSpacing: 0.72 } as const;
  return (
    <View style={Gap}>
      <Card style={{ paddingVertical: 8, paddingHorizontal: 16 }}>
        <View style={{ flexDirection: 'row', paddingTop: 8, paddingBottom: 10 }}>
          <Txt color={p.inkMuted} style={[header, { flex: 1 }]}>
            ENGLISH
          </Txt>
          <Txt color={p.inkMuted} style={[header, { flex: 1, paddingLeft: 26 }]}>
            FRENCH
          </Txt>
        </View>
        {rows.map(([english, french], i) => (
          <Animated.View
            key={french}
            entering={FadeIn.delay(100 + i * 120).duration(300)}
            accessible
            accessibilityLabel={`${english}: ${french}`}
            style={{ flexDirection: 'row', alignItems: 'center', height: 64, borderTopWidth: Stroke[2], borderColor: p.surfaceSunken }}>
            <T style={{ flex: 1, fontFamily: Font.display600, fontSize: 26, lineHeight: 30 }}>{english}</T>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Svg width={16} height={16} viewBox="0 0 24 24">
                <Path d="M9 5l7 7-7 7" fill="none" stroke={p.line} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <View style={{ paddingHorizontal: 12, paddingVertical: 2, backgroundColor: p.grapeSoft, borderRadius: 12 }}>
                <T french style={[Big, { fontSize: 28, lineHeight: 36 }]}>
                  {french}
                </T>
              </View>
            </View>
          </Animated.View>
        ))}
      </Card>
      <Tip>
        <FrWord>Vous</FrWord> is the polite “you”. Use it with people you don&apos;t know well, like a shopkeeper or a teacher.
      </Tip>
    </View>
  );
}
