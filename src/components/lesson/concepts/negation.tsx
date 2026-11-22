import type { ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import type { Slide } from '@/components/lesson/concept-lesson';
import { B, Card, Fr, FrWord, Gap, T, Tip } from '@/components/lesson/concepts/parts';
import { Txt } from '@/components/text';
import { Font } from '@/theme/fonts';
import { Radius, Stroke } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';

/**
 * Negation 1 (French): what a negative is, ne … pas around the verb, and ne squishing into n' before a vowel.
 * Follows the Lesson — Negation 1 page of the Lingo Lotto Lessons design artifact.
 */
export const NegationLesson: Slide[] = [
  {
    pose: 'wave',
    say: (
      <>
        Verbs describe something you do. A negative flips it into something you <B>don&apos;t</B> do!
      </>
    ),
    title: "Do, or don't?",
    Body: DoOrDont,
  },
  {
    pose: 'point',
    say: (
      <>
        In French, negation is a bit unique. You put <FrWord>ne</FrWord> before the verb and <FrWord>pas</FrWord> after it!
      </>
    ),
    title: 'Ne … pas',
    Body: NePas,
  },
  {
    pose: 'point',
    say: (
      <>
        Heads up! If the verb starts with a vowel, <FrWord>ne</FrWord> squishes into it and becomes <FrWord>n&apos;</FrWord>.
      </>
    ),
    title: 'Vowel? Squish it!',
    Body: Squish,
  },
];

const Line = { fontFamily: Font.display600, fontSize: 30, lineHeight: 38 } as const;
const Label = { fontFamily: Font.body900, fontSize: 13, lineHeight: 16, letterSpacing: 0.78 } as const;
const English = { fontFamily: Font.body700, fontSize: 16, lineHeight: 22 } as const;

/** A word boxed in grape (the verb) or pink (the negative). */
function Chip({ children, negative = false }: { children: ReactNode; negative?: boolean }) {
  const p = usePalette();
  return (
    <View
      style={{
        paddingHorizontal: 8,
        backgroundColor: negative ? p.pinkSoft : p.grapeSoft,
        borderColor: negative ? p.pink : p.grape,
        borderWidth: Stroke[2],
        borderRadius: 10,
      }}>
      <T style={Line}>{children}</T>
    </View>
  );
}

/** "n'est", with the squished n' highlighted. */
function NEst() {
  const p = usePalette();
  return (
    <Chip>
      <Txt style={[Line, { backgroundColor: p.pinkSoft }]}>n&apos;</Txt>est
    </Chip>
  );
}

/** A white card with a YES or NO label, a French line and its English. */
function SentenceCard({ label, english, children }: { label: string; english: string; children: ReactNode }) {
  return (
    <Card style={{ gap: 6, paddingVertical: 16, paddingHorizontal: 18 }}>
      <T style={Label}>{label}</T>
      <View accessibilityLanguage={Fr} style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 8 }}>
        {children}
      </View>
      <T style={English}>{english}</T>
    </Card>
  );
}

function DownArrow() {
  const p = usePalette();
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={34} height={30} viewBox="0 0 34 30">
        <Path d="M17 3 V22 M8 14 L17 23 L26 14" fill="none" stroke={p.line} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

// 1 · Do, or don't?

function DoOrDont() {
  const p = usePalette();
  const badge = (fill: string, icon: ReactNode) => (
    <View style={{ width: 60, height: 60, alignItems: 'center', justifyContent: 'center', backgroundColor: fill, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.pill }}>
      {icon}
    </View>
  );
  return (
    <View style={[Gap, { flexGrow: 1, justifyContent: 'center' }]}>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18 }}>
        {badge(
          p.sky,
          <Svg width={30} height={30} viewBox="0 0 24 24">
            <Path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={p.line} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>,
        )}
        <View accessible accessibilityLabel="You do it. Je parle: I speak" style={{ gap: 2 }}>
          <T style={Label}>YOU DO IT</T>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <T french style={Line}>
              Je
            </T>
            <Chip>parle</Chip>
          </View>
          <T style={English}>I speak</T>
        </View>
      </Card>

      <View style={{ alignItems: 'center' }}>
        <View style={{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: p.sunshine, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.pill }}>
          <Svg width={28} height={28} viewBox="0 0 24 24">
            <Path d="M4 9a8 8 0 0 1 14-3l2 2M20 4v4h-4M20 15a8 8 0 0 1-14 3l-2-2M4 20v-4h4" fill="none" stroke={p.line} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>
      </View>

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18 }}>
        {badge(
          p.tangerine,
          <Svg width={26} height={26} viewBox="0 0 24 24">
            <Path d="M6 6l12 12M18 6L6 18" fill="none" stroke={p.line} strokeWidth={3.8} strokeLinecap="round" />
          </Svg>,
        )}
        <View accessible accessibilityLabel="You don't. I don't speak" style={{ gap: 2 }}>
          <T style={Label}>YOU DON&apos;T</T>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <T style={Line}>I</T>
            <Animated.View entering={ZoomIn.delay(750).springify()}>
              <Chip negative>don&apos;t</Chip>
            </Animated.View>
            <T style={Line}>speak</T>
          </View>
        </View>
      </Card>

      <Tip>Same verb, opposite meaning. In English we just add “don&apos;t”. French does it a little differently…</Tip>
    </View>
  );
}

// 2 · Ne … pas

function NePas() {
  const p = usePalette();
  const bread = (word: string, where: string, delay: number) => (
    <Animated.View entering={ZoomIn.delay(delay).springify()} style={{ alignItems: 'center', gap: 6 }}>
      <Chip negative>{word}</Chip>
      <Txt color={p.onBright} style={{ fontFamily: Font.body900, fontSize: 12, lineHeight: 15, letterSpacing: 0.48 }}>
        {where}
      </Txt>
    </Animated.View>
  );
  return (
    <View style={[Gap, { flexGrow: 1, justifyContent: 'center' }]}>
      <SentenceCard label="YES" english="I speak">
        <T style={Line}>Je</T>
        <Chip>parle</Chip>
      </SentenceCard>
      <DownArrow />
      <SentenceCard label="NO" english="I don't speak">
        <T style={[Line, { paddingTop: 3 }]}>Je</T>
        {bread('ne', 'BEFORE', 450)}
        <Chip>parle</Chip>
        {bread('pas', 'AFTER', 750)}
      </SentenceCard>
      <Tip>
        Think of a sandwich: <FrWord>ne</FrWord> and <FrWord>pas</FrWord> are the bread, and the verb is the filling.
      </Tip>
    </View>
  );
}

// 3 · Vowel? Squish it!

function Squish() {
  const p = usePalette();
  return (
    <View style={[Gap, { flexGrow: 1, justifyContent: 'center' }]}>
      <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 16 }}>
        <View accessible accessibilityLabel="ne plus est becomes n'est" accessibilityLanguage={Fr} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Chip negative>ne</Chip>
          <T style={Line}>+</T>
          <Chip>est</Chip>
          <Svg width={28} height={20} viewBox="0 0 28 20">
            <Path d="M3 10 H23 M16 3 L23 10 L16 17" fill="none" stroke={p.line} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <Animated.View entering={ZoomIn.delay(450).springify()}>
            <NEst />
          </Animated.View>
        </View>
      </Card>
      <SentenceCard label="YES" english="He is tall">
        <T style={Line}>Il</T>
        <Chip>est</Chip>
        <T style={Line}>grand</T>
      </SentenceCard>
      <DownArrow />
      <SentenceCard label="NO" english="He isn't tall">
        <T style={Line}>Il</T>
        <NEst />
        <Chip negative>pas</Chip>
        <T style={Line}>grand</T>
      </SentenceCard>
      <Tip>
        Watch for verbs starting with a, e, i, o, u (or a silent h). The <FrWord>pas</FrWord> still goes after!
      </Tip>
    </View>
  );
}
