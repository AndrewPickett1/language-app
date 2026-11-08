import { View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import type { Slide } from '@/components/lesson/concept-lesson';
import { B, Big, Card, Ending, FrWord, Gap, MascotScene, PronounPill, Sub, T, Tip } from '@/components/lesson/concepts/parts';
import { Txt } from '@/components/text';
import { Font } from '@/theme/fonts';
import { Radius, Stroke } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';

/**
 * Verbs 1 (French): what a verb is, what conjugation and the infinitive are, and penser with je, vous and
 * nous. Follows the Lesson — Verbs 1 page of the Lingo Lotto Lessons design artifact.
 */
export const VerbsLesson: Slide[] = [
  { pose: 'wave', say: "A verb is an action. It's anything you do!", title: "What's a verb?", Body: WhatsAVerb },
  { pose: 'point', say: "In a sentence, a verb changes a little depending on who's doing the action.", title: 'Meet conjugation', Body: Conjugation },
  { pose: 'point', say: 'The plain, unchanged form of a verb is called the infinitive.', title: 'The infinitive', Body: Infinitive },
  { pose: 'point', say: 'But in French, each pronoun gets its own conjugation.', title: 'Penser, conjugated', Body: Penser },
  { Body: TricksComing },
];

// 1 · What's a verb?

function WhatsAVerb() {
  const p = usePalette();
  const rows = [
    { name: 'Running', fill: p.skySoft, icon: <RunIcon /> },
    { name: 'Speaking', fill: p.sunshineSoft, icon: <SpeakIcon /> },
    { name: 'Thinking', fill: p.grapeSoft, icon: <ThinkIcon /> },
  ];
  return (
    <View style={[Gap, { flexGrow: 1 }]}>
      {rows.map((r) => (
        <Card key={r.name} style={{ flexGrow: 1, minHeight: 100, flexDirection: 'row', alignItems: 'center', gap: 18, paddingVertical: 12, paddingHorizontal: 20 }}>
          <View style={{ width: 84, height: 84, alignItems: 'center', justifyContent: 'center', backgroundColor: r.fill, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.pill }}>
            {r.icon}
          </View>
          <T style={Big}>{r.name}</T>
        </Card>
      ))}
      <Tip>Running, speaking, thinking: all of them are verbs! If you can do it, it&apos;s a verb.</Tip>
    </View>
  );
}

function RunIcon() {
  const p = usePalette();
  const body = 'M22,16 L18,28 M21,19 L30,22 M21,19 L13,22 M18,28 L27,33 L26,40 M18,28 L12,36 L6,37';
  return (
    <Svg width={58} height={58} viewBox="0 0 44 44">
      <Path d="M3,18 H9 M2,24 H8 M4,30 H9" stroke={p.line} strokeWidth={2.5} strokeLinecap="round" />
      <Path d={body} fill="none" stroke={p.line} strokeWidth={6.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d={body} fill="none" stroke={p.sky} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={25} cy={9} r={6} fill={p.paper} stroke={p.line} strokeWidth={3} />
    </Svg>
  );
}

function SpeakIcon() {
  const p = usePalette();
  return (
    <Svg width={58} height={58} viewBox="0 0 44 44">
      <Path
        d="M8,8 H36 A4,4 0 0 1 40,12 V28 A4,4 0 0 1 36,32 H18 L10,39 L12,32 H8 A4,4 0 0 1 4,28 V12 A4,4 0 0 1 8,8 Z"
        fill={p.sunshine}
        stroke={p.line}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Circle cx={14} cy={20} r={2.6} fill={p.line} />
      <Circle cx={22} cy={20} r={2.6} fill={p.line} />
      <Circle cx={30} cy={20} r={2.6} fill={p.line} />
    </Svg>
  );
}

function ThinkIcon() {
  const p = usePalette();
  return (
    <Svg width={58} height={58} viewBox="0 0 44 44">
      <Path
        d="M12,26 A7,7 0 0 1 10,13 A8,8 0 0 1 22,7 A8,8 0 0 1 34,11 A7,7 0 0 1 34,25 A7,7 0 0 1 24,28 A7,7 0 0 1 12,26 Z"
        fill={p.grape}
        stroke={p.line}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={33} r={3.5} fill={p.grape} stroke={p.line} strokeWidth={2.5} />
      <Circle cx={7} cy={39} r={2.2} fill={p.grape} stroke={p.line} strokeWidth={2} />
    </Svg>
  );
}

// 2 · Meet conjugation

function Conjugation() {
  const p = usePalette();
  const verb = { fontFamily: Font.display600, fontSize: 34, lineHeight: 40 } as const;
  return (
    <View style={Gap}>
      <T style={Sub}>
        This change is called <B>conjugation</B>. And we do it in English too!
      </T>
      <Card style={{ gap: 12, paddingVertical: 20, paddingHorizontal: 18 }}>
        <View accessible accessibilityLabel="I think" style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <PronounPill text="I" width={76} />
          <T style={verb}>think</T>
        </View>
        <View style={{ height: Stroke[2], backgroundColor: p.surfaceSunken, borderRadius: Radius.pill }} />
        <View accessible accessibilityLabel="He thinks" style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <PronounPill text="He" width={76} />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <T style={verb}>think</T>
            <Animated.View entering={ZoomIn.delay(450).springify()}>
              <Ending size={34}>s</Ending>
            </Animated.View>
          </View>
        </View>
      </Card>
      <Tip>Same verb, different person, so it gets a little “s” on the end. That&apos;s conjugation!</Tip>
    </View>
  );
}

// 3 · The infinitive

function Infinitive() {
  const p = usePalette();
  return (
    <View style={Gap}>
      <Card style={{ alignItems: 'center', gap: 10, paddingTop: 30, paddingBottom: 26, paddingHorizontal: 16 }}>
        <Txt color={p.inkMuted} style={{ fontFamily: Font.body900, fontSize: 12, lineHeight: 16, letterSpacing: 0.72 }}>
          INFINITIVE
        </Txt>
        <View accessible accessibilityLabel="penser" accessibilityLanguage="fr-FR" style={{ flexDirection: 'row', alignItems: 'center' }}>
          <T french style={{ fontFamily: Font.display600, fontSize: 52, lineHeight: 58 }}>
            pens
          </T>
          <Ending size={52}>er</Ending>
        </View>
        <View style={{ paddingVertical: 6, paddingHorizontal: 16, backgroundColor: p.skySoft, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.pill }}>
          <T style={{ fontFamily: Font.display600, fontSize: 22, lineHeight: 26 }}>to think</T>
        </View>
      </Card>
      <View style={{ paddingVertical: 12, paddingHorizontal: 16, backgroundColor: p.skySoft, borderColor: p.line, borderWidth: Stroke[2], borderRadius: 20 }}>
        <T style={{ fontFamily: Font.body800, fontSize: 16, lineHeight: 22 }}>In English, it&apos;s the “to” form: to think, to run, to speak.</T>
      </View>
      <Tip>
        Lots of French infinitives end in <FrWord fill={p.pinkSoft}>-er</FrWord>, like <FrWord>penser</FrWord> and <FrWord>parler</FrWord> (to speak).
      </Tip>
    </View>
  );
}

// 4 · Penser, conjugated

const PenserForms = [
  { pronoun: 'je', ending: 'e', english: 'I think' },
  { pronoun: 'vous', ending: 'ez', english: 'you think' },
  { pronoun: 'nous', ending: 'ons', english: 'we think' },
];

function Penser() {
  const p = usePalette();
  return (
    <View style={{ gap: 12 }}>
      {PenserForms.map((f, i) => (
        <Animated.View key={f.pronoun} entering={FadeIn.delay(i * 120).duration(250)}>
          <Card radius={24} style={{ height: 96, justifyContent: 'center', gap: 2, paddingHorizontal: 18 }}>
            <View accessible accessibilityLabel={`${f.pronoun} pens${f.ending}`} accessibilityLanguage="fr-FR" style={{ flexDirection: 'row', alignItems: 'center' }}>
              <T french style={{ fontFamily: Font.display600, fontSize: 32, lineHeight: 38 }}>
                {`${f.pronoun} pens`}
              </T>
              <Ending size={32}>{f.ending}</Ending>
            </View>
            <Txt color={p.onBrightMuted} style={{ fontFamily: Font.body800, fontSize: 16, lineHeight: 21 }}>
              {f.english}
            </Txt>
          </Card>
        </Animated.View>
      ))}
      <Tip>
        See the pattern? The front, <FrWord>pens-</FrWord>, stays the same. Only the pink ending changes.
      </Tip>
    </View>
  );
}

// 5 · Tricks are coming

function TricksComing() {
  const p = usePalette();
  return (
    <MascotScene
      pose="cheer"
      bubble={<T style={{ fontFamily: Font.body800, fontSize: 23, lineHeight: 32 }}>It sounds tricky, but I&apos;ve got some tricks coming up soon that make it easy!</T>}>
      <View
        accessible
        accessibilityLabel="Recap: je pense, vous pensez, nous pensons"
        style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 6 }}>
        {PenserForms.map((f) => (
          <View key={f.pronoun} style={{ paddingVertical: 6, paddingHorizontal: 12, backgroundColor: p.white, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.pill }}>
            <T french style={{ fontFamily: Font.display600, fontSize: 18, lineHeight: 22 }}>
              {`${f.pronoun} pens`}
              <Txt style={{ fontFamily: Font.display600, fontSize: 18, lineHeight: 22, backgroundColor: p.pinkSoft }}>{f.ending}</Txt>
            </T>
          </View>
        ))}
      </View>
    </MascotScene>
  );
}
