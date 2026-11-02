import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Path, Pattern, Rect } from 'react-native-svg';

import { LottoMascot } from '@/components/art/lotto-mascot';
import type { Slide } from '@/components/lesson/concept-lesson';
import { Panel } from '@/components/sticker';
import { Txt } from '@/components/text';
import { Font } from '@/theme/fonts';
import { Radius, Stroke } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';

/**
 * Genders & articles (French): what a noun and an article are, that every French noun is masculine or
 * feminine, and how that picks le/la and un/une. Follows the Lesson — Genders page of the Lingo Lotto
 * Pages design artifact. Orange is masculine and purple is feminine, as on the word cards.
 */
export const GendersLesson: Slide[] = [
  { pose: 'wave', say: 'A noun is a person, place, or a thing.', title: "What's a noun?", Body: Nouns },
  { pose: 'point', say: 'An article is a tiny word that sits right in front of a noun.', title: 'Meet the article', Body: Articles },
  {
    pose: 'point',
    say: (
      <>
        You already use them! In English the articles are <B>a</B>, <B>an</B> and <B>the</B>.
      </>
    ),
    title: 'In English',
    Body: English,
  },
  { pose: 'whoa', say: "In French, every noun has a gender. It's either masculine or feminine.", title: 'Every noun has a gender', Body: EveryNoun },
  {
    pose: 'shrug',
    say: "Don't overthink it! Gender is just a label. It usually has nothing to do with being manly or womanly.",
    title: "It's just a label",
    Body: JustALabel,
  },
  { pose: 'point', say: 'So why does gender matter? It changes the words around a noun, starting with the article.', title: 'Gender picks the article', Body: PicksTheArticle },
  { pose: 'point', say: "Same goes for “a”. That makes four little words, and they're all you need!", title: 'The four articles', Body: FourArticles },
  { pose: 'wave', say: "Let's see them in action! Check the shape on each one.", title: 'Here are some examples', Body: Examples },
  { Body: YouGotThis },
];

const Fr = 'fr-FR';

const Big: TextStyle = { fontFamily: Font.display600, fontSize: 30, lineHeight: 34 };
const Sub: TextStyle = { fontFamily: Font.body800, fontSize: 16, lineHeight: 22 };

function B({ children }: { children: ReactNode }) {
  return <Txt style={{ fontFamily: Font.body900, fontSize: 18 }}>{children}</Txt>;
}

/** Text on a white card or a bright fill. */
function T({ style, children, french = false }: { style?: StyleProp<TextStyle>; children: ReactNode; french?: boolean }) {
  const p = usePalette();
  return (
    <Txt color={p.onBright} accessibilityLanguage={french ? Fr : undefined} style={style}>
      {children}
    </Txt>
  );
}

function Muted({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const p = usePalette();
  return (
    <Txt color={p.onBrightMuted} style={[Sub, style]}>
      {children}
    </Txt>
  );
}

function Caption({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const p = usePalette();
  return (
    <Txt variant="caption" color={p.inkMuted} style={[{ fontFamily: Font.body900, textAlign: 'center' }, style]}>
      {children}
    </Txt>
  );
}

function Card({ children, style, radius = 28 }: { children: ReactNode; style?: StyleProp<ViewStyle>; radius?: number }) {
  const p = usePalette();
  return (
    <Panel fill={p.white} radius={radius} borderWidth={Stroke[2]} style={style}>
      {children}
    </Panel>
  );
}

/** The dashed yellow note under a slide. */
function Tip({ children }: { children: ReactNode }) {
  const p = usePalette();
  return (
    <View style={{ paddingVertical: 10, paddingHorizontal: 14, backgroundColor: p.sunshineSoft, borderColor: p.line, borderWidth: Stroke[2], borderStyle: 'dashed', borderRadius: 20 }}>
      <T style={{ fontFamily: Font.body800, fontSize: 15, lineHeight: 21 }}>{children}</T>
    </View>
  );
}

/** A French article: orange for masculine, purple for feminine. */
function ArticlePill({ text, feminine, width, height, size }: { text: string; feminine: boolean; width: number; height: number; size: number }) {
  const p = usePalette();
  return (
    <View
      accessibilityLabel={`${text}, ${feminine ? 'feminine' : 'masculine'}`}
      style={{ width, height, alignItems: 'center', justifyContent: 'center', backgroundColor: feminine ? p.grape : p.tangerine, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.pill }}>
      <T french style={{ fontFamily: Font.display600, fontSize: size, lineHeight: size * 1.2 }}>
        {text}
      </T>
    </View>
  );
}

/** A French word in the running text, on a grape highlight. */
function FrWord({ children }: { children: string }) {
  const p = usePalette();
  return (
    <Txt accessibilityLanguage={Fr} style={{ fontFamily: Font.display600, backgroundColor: p.grapeSoft }}>
      {` ${children} `}
    </Txt>
  );
}

const Gap = { gap: 14 } as const;

// 1 · What's a noun?

function Nouns() {
  const p = usePalette();
  const rows = [
    { name: 'Person', examples: 'teacher · friend · baby', fill: p.skySoft, icon: <PersonIcon /> },
    { name: 'Place', examples: 'park · café · home', fill: p.leafSoft, icon: <PlaceIcon /> },
    { name: 'Thing', examples: 'apple · phone · bike', fill: p.sunshineSoft, icon: <ThingIcon /> },
  ];
  return (
    <View style={[Gap, { flexGrow: 1 }]}>
      {rows.map((r) => (
        <Card key={r.name} style={{ flexGrow: 1, minHeight: 100, flexDirection: 'row', alignItems: 'center', gap: 18, paddingVertical: 12, paddingHorizontal: 20 }}>
          <View style={{ width: 76, height: 76, alignItems: 'center', justifyContent: 'center', backgroundColor: r.fill, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.pill }}>
            {r.icon}
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <T style={Big}>{r.name}</T>
            <Muted style={{ fontSize: 17 }}>{r.examples}</Muted>
          </View>
        </Card>
      ))}
      <Tip>Quick test: if you can say “the” in front of it, it&apos;s probably a noun.</Tip>
    </View>
  );
}

function PersonIcon() {
  const p = usePalette();
  return (
    <Svg width={52} height={52} viewBox="0 0 44 44">
      <Path d="M8,38 A14,14 0 0 1 36,38 Z" fill={p.sky} stroke={p.line} strokeWidth={3} strokeLinejoin="round" />
      <Circle cx={22} cy={15} r={8} fill={p.paper} stroke={p.line} strokeWidth={3} />
    </Svg>
  );
}

function PlaceIcon() {
  const p = usePalette();
  return (
    <Svg width={52} height={52} viewBox="0 0 44 44">
      <Path d="M8,22 L22,9 L36,22 L36,37 L8,37 Z" fill={p.leaf} stroke={p.line} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M18,37 L18,29 A4,4 0 0 1 26,29 L26,37" fill={p.paper} stroke={p.line} strokeWidth={3} strokeLinejoin="round" />
    </Svg>
  );
}

function ThingIcon() {
  const p = usePalette();
  return (
    <Svg width={52} height={52} viewBox="0 0 44 44">
      <Path
        d="M22,14 C12,10 6,20 9,29 C11,36 17,39 22,36 C27,39 33,36 35,29 C38,20 32,10 22,14 Z"
        fill={p.cherry}
        stroke={p.line}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Path d="M22,14 C22,9 24,6 27,4" fill="none" stroke={p.line} strokeWidth={3} strokeLinecap="round" />
      <Rect x={12} y={19} width={7} height={4} rx={2} fill={p.white} transform="rotate(-45 15.5 21)" />
    </Svg>
  );
}

// 2 · Meet the article

function Articles() {
  const p = usePalette();
  const nudge = useSharedValue(0);
  const nudgeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: nudge.get() }] }));
  useEffect(() => {
    nudge.set(withRepeat(withSequence(withTiming(3, { duration: 800, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 800, easing: Easing.inOut(Easing.quad) })), -1));
  }, [nudge]);

  const word = (text: string, fill: string, label: string) => (
    <View style={{ alignItems: 'center', gap: 8 }}>
      <View style={{ height: 64, paddingHorizontal: 22, justifyContent: 'center', backgroundColor: fill, borderColor: p.line, borderWidth: Stroke[2], borderRadius: 18, boxShadow: `0px 3px 0px ${p.line}` }}>
        <T style={Big}>{text}</T>
      </View>
      <T style={{ fontFamily: Font.body900, fontSize: 12, lineHeight: 16, letterSpacing: 0.72 }}>{label}</T>
    </View>
  );

  return (
    <View style={Gap}>
      <Card style={{ alignItems: 'center', gap: 16, paddingTop: 26, paddingBottom: 22, paddingHorizontal: 16 }}>
        <View accessible accessibilityLabel="the dog: the article comes before the noun" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          {word('the', p.sunshine, 'ARTICLE')}
          <Animated.View style={[{ height: 64, justifyContent: 'center' }, nudgeStyle]}>
            <Svg width={34} height={24} viewBox="0 20 34 24">
              <Path d="M4 32 H26 M18 22 L28 32 L18 42" fill="none" stroke={p.line} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Animated.View>
          {word('dog', p.skySoft, 'NOUN')}
        </View>
        <Muted style={{ textAlign: 'center' }}>
          Article first, then the noun.{'\n'}Like a sticker on the front of the word.
        </Muted>
      </Card>

      <Caption>Spot the article</Caption>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
        {[
          ['the', 'park'],
          ['a', 'cat'],
          ['an', 'idea'],
        ].map(([article, noun]) => (
          <View
            key={noun}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: p.white, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.pill }}>
            <View style={{ paddingHorizontal: 6, backgroundColor: p.sunshine, borderRadius: 8 }}>
              <T style={{ fontFamily: Font.display600, fontSize: 20, lineHeight: 24 }}>{article}</T>
            </View>
            <T style={{ fontFamily: Font.display600, fontSize: 20, lineHeight: 24 }}>{noun}</T>
          </View>
        ))}
      </View>
    </View>
  );
}

// 3 · In English

function English() {
  const p = usePalette();
  return (
    <View style={{ gap: 12 }}>
      {[
        ['A', 'man'],
        ['An', 'apple'],
        ['The', 'dog'],
      ].map(([article, noun]) => (
        <Card key={noun} radius={24} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16 }}>
          <View style={{ width: 76, height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: p.sunshine, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.pill }}>
            <T style={{ fontFamily: Font.display600, fontSize: 24, lineHeight: 28 }}>{article}</T>
          </View>
          <T style={{ fontFamily: Font.display600, fontSize: 28, lineHeight: 32 }}>{noun}</T>
        </Card>
      ))}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
        {[
          ['a · an', 'any one'],
          ['the', 'that one in particular'],
        ].map(([words, meaning]) => (
          <View key={words} style={{ flex: 1, gap: 4, padding: 12, backgroundColor: p.sunshineSoft, borderColor: p.line, borderWidth: Stroke[2], borderRadius: 20 }}>
            <T style={{ fontFamily: Font.display600, fontSize: 22, lineHeight: 26 }}>{words}</T>
            <T style={{ fontFamily: Font.body800, fontSize: 15, lineHeight: 20 }}>{meaning}</T>
          </View>
        ))}
      </View>
    </View>
  );
}

// 4 · Every noun has a gender

function EveryNoun() {
  const genders = [
    { name: 'Masculine', article: 'le', feminine: false, words: ['chien', 'livre', 'jour'] },
    { name: 'Feminine', article: 'la', feminine: true, words: ['pomme', 'table', 'maison'] },
  ];
  return (
    <View style={Gap}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {genders.map((g, i) => (
          <Card key={g.name} style={{ flex: 1, alignItems: 'center', gap: 12, paddingTop: 20, paddingBottom: 18, paddingHorizontal: 10 }}>
            <Animated.View entering={FadeIn.delay(100 + i * 100).duration(250)}>
              <ArticlePill text={g.article} feminine={g.feminine} width={120} height={72} size={34} />
            </Animated.View>
            <T style={{ fontFamily: Font.display600, fontSize: 22, lineHeight: 26 }}>{g.name}</T>
            <T french style={{ fontFamily: Font.display500, fontSize: 18, lineHeight: 26, textAlign: 'center' }}>
              {g.words.join('\n')}
            </T>
          </Card>
        ))}
      </View>
      <Tip>Watch for the colours in Lingo Lotto: orange means masculine, purple means feminine.</Tip>
    </View>
  );
}

// 5 · It's just a label

function JustALabel() {
  const p = usePalette();
  const twists = [
    { article: 'la', feminine: true, word: 'barbe', note: "a beard, and it's feminine!" },
    { article: 'le', feminine: false, word: 'maquillage', note: "makeup, and it's masculine!" },
  ];
  return (
    <View style={{ gap: 12 }}>
      <Caption style={{ textAlign: 'left' }}>Plot twist</Caption>
      {twists.map((t) => (
        <Card key={t.word} radius={24} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
          <ArticlePill text={t.article} feminine={t.feminine} width={76} height={50} size={22} />
          <View style={{ flex: 1, gap: 2 }}>
            <T french style={{ fontFamily: Font.display600, fontSize: 26, lineHeight: 30 }}>
              {t.word}
            </T>
            <Muted style={{ fontSize: 15, lineHeight: 20 }}>{t.note}</Muted>
          </View>
        </Card>
      ))}
      <View style={{ paddingVertical: 12, paddingHorizontal: 16, backgroundColor: p.skySoft, borderColor: p.line, borderWidth: Stroke[2], borderRadius: 20 }}>
        <T style={Sub}>A table isn&apos;t a girl and a book isn&apos;t a boy. Gender is just part of each word.</T>
      </View>
      <Tip>No need to guess. You&apos;ll pick it up word by word.</Tip>
    </View>
  );
}

// 6 · Gender picks the article

function PicksTheArticle() {
  const p = usePalette();
  return (
    <View style={Gap}>
      <Card style={{ alignItems: 'center', gap: 6, paddingTop: 22, paddingBottom: 20, paddingHorizontal: 16 }}>
        <View accessible accessibilityLabel="English the becomes le or la in French" style={{ alignSelf: 'stretch', alignItems: 'center', gap: 6 }}>
          <Caption>English</Caption>
          <View style={{ height: 60, paddingHorizontal: 26, justifyContent: 'center', backgroundColor: p.sunshine, borderColor: p.line, borderWidth: Stroke[2], borderRadius: 18, boxShadow: `0px 3px 0px ${p.line}` }}>
            <T style={Big}>the</T>
          </View>
          <Svg width="100%" height={64} viewBox="0 0 320 64" style={{ marginVertical: 2 }}>
            <Path d="M160 6 C160 34 78 22 78 52" fill="none" stroke={p.line} strokeWidth={4} strokeLinecap="round" />
            <Path d="M68 44 L78 55 L88 44" fill="none" stroke={p.line} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M160 6 C160 34 242 22 242 52" fill="none" stroke={p.line} strokeWidth={4} strokeLinecap="round" />
            <Path d="M232 44 L242 55 L252 44" fill="none" stroke={p.line} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <View style={{ alignSelf: 'stretch', flexDirection: 'row', gap: 10 }}>
            {[
              { text: 'le', feminine: false, label: 'Masculine' },
              { text: 'la', feminine: true, label: 'Feminine' },
            ].map((a, i) => (
              <Animated.View key={a.text} entering={FadeIn.delay(150 + i * 100).duration(250)} style={{ flex: 1, alignItems: 'center', gap: 8 }}>
                <ArticlePill text={a.text} feminine={a.feminine} width={110} height={66} size={32} />
                <T style={{ fontFamily: Font.body800, fontSize: 12, lineHeight: 16, letterSpacing: 0.72, textTransform: 'uppercase' }}>{a.label}</T>
              </Animated.View>
            ))}
          </View>
          <Caption style={{ marginTop: 6 }}>French</Caption>
        </View>
      </Card>
      <Tip>One word in English, two in French. The noun&apos;s gender decides which one you use.</Tip>
    </View>
  );
}

// 7 · The four articles

function FourArticles() {
  const p = usePalette();
  const rows = [
    { english: 'the', meaning: 'that one', masc: 'le', fem: 'la' },
    { english: 'a · an', meaning: 'any one', masc: 'un', fem: 'une' },
  ];
  const cell = { flex: 1, alignItems: 'center' } as const;
  return (
    <View style={Gap}>
      <Card style={{ gap: 10, padding: 14 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Caption style={{ flex: 1 }}>English</Caption>
          <Caption style={{ flex: 1, color: p.onBright }}>Masculine</Caption>
          <Caption style={{ flex: 1, color: p.onBright }}>Feminine</Caption>
        </View>
        {rows.map((r) => (
          <View
            key={r.english}
            accessible
            accessibilityLabel={`${r.english}: ${r.masc} for masculine, ${r.fem} for feminine`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 12, paddingBottom: 8, borderTopWidth: Stroke[2], borderColor: p.surfaceSunken }}>
            <View style={[cell, { gap: 2 }]}>
              <T style={{ fontFamily: Font.display600, fontSize: 26, lineHeight: 30 }}>{r.english}</T>
              <Txt color={p.inkMuted} style={{ fontFamily: Font.body800, fontSize: 12, lineHeight: 16 }}>
                {r.meaning}
              </Txt>
            </View>
            <View style={cell}>
              <ArticlePill text={r.masc} feminine={false} width={88} height={56} size={28} />
            </View>
            <View style={cell}>
              <ArticlePill text={r.fem} feminine width={88} height={56} size={28} />
            </View>
          </View>
        ))}
      </Card>
      <Tip>
        Tip: learn every noun with its article. Say <FrWord>la pomme</FrWord>, not just <FrWord>pomme</FrWord>.
      </Tip>
    </View>
  );
}

// 8 · Examples

function Examples() {
  const examples = [
    { article: 'un', feminine: false, word: 'homme', meaning: 'a man' },
    { article: 'une', feminine: true, word: 'femme', meaning: 'a woman' },
    { article: 'le', feminine: false, word: 'chien', meaning: 'the dog' },
    { article: 'la', feminine: true, word: 'pomme', meaning: 'the apple' },
  ];
  return (
    <View style={{ gap: 12 }}>
      {examples.map((e, i) => (
        <Animated.View key={e.word} entering={FadeIn.delay(60 + i * 80).duration(250)}>
          <Card radius={24} style={{ minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16 }}>
            <ArticlePill text={e.article} feminine={e.feminine} width={80} height={50} size={24} />
            <View style={{ flex: 1, gap: 2 }}>
              <T french style={{ fontFamily: Font.display600, fontSize: 28, lineHeight: 32 }}>
                {e.word}
              </T>
              <Muted style={{ fontSize: 15, lineHeight: 20 }}>{e.meaning}</Muted>
            </View>
            <T style={{ fontFamily: Font.body900, fontSize: 11, lineHeight: 14, letterSpacing: 0.66 }}>{e.feminine ? 'FEM.' : 'MASC.'}</T>
          </Card>
        </Animated.View>
      ))}
    </View>
  );
}

// 9 · You've got this

function YouGotThis() {
  const p = usePalette();
  const jump = useSharedValue(0);
  const jumpStyle = useAnimatedStyle(() => ({ transform: [{ translateY: jump.get() }] }));
  useEffect(() => {
    const ease = { duration: 1200, easing: Easing.inOut(Easing.quad) };
    jump.set(withRepeat(withSequence(withTiming(-6, ease), withTiming(0, ease)), -1));
  }, [jump]);

  return (
    <View
      style={{
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingTop: 20,
        paddingBottom: 18,
        paddingHorizontal: 16,
        backgroundColor: p.sunshineSoft,
        borderColor: p.line,
        borderWidth: Stroke[2],
        borderRadius: 32,
        overflow: 'hidden',
      }}>
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern id="dots" width={22} height={22} patternUnits="userSpaceOnUse">
            <Circle cx={11} cy={11} r={3} fill={p.sunshine} opacity={0.35} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#dots)" />
      </Svg>

      <Animated.View entering={FadeIn.duration(250)} style={{ alignSelf: 'stretch' }}>
        <Panel fill={p.white} radius={32} style={{ paddingTop: 20, paddingBottom: 18, paddingHorizontal: 20 }}>
          <T style={{ fontFamily: Font.body800, fontSize: 23, lineHeight: 32 }}>
            It sounds tricky, but trust me. Give it a little practice and you&apos;ll have it down in no time!
          </T>
          <Svg width={34} height={30} viewBox="0 0 34 30" style={{ position: 'absolute', left: '50%', bottom: -27, marginLeft: -6 }}>
            <Path d="M2,0 L30,0 L8,27 Z" fill={p.white} stroke={p.line} strokeWidth={4} strokeLinejoin="round" />
            <Path d="M0,1 L34,1" stroke={p.white} strokeWidth={5} />
          </Svg>
        </Panel>
      </Animated.View>

      <Animated.View style={[{ marginTop: 34 }, jumpStyle]}>
        <LottoMascot line={p.line} width={170} pose="cheer" />
      </Animated.View>

      <View
        accessible
        accessibilityLabel="Recap: le and un are masculine, la and une are feminine"
        style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 6 }}>
        <ArticlePill text="le" feminine={false} width={62} height={42} size={20} />
        <ArticlePill text="un" feminine={false} width={62} height={42} size={20} />
        <ArticlePill text="la" feminine width={62} height={42} size={20} />
        <ArticlePill text="une" feminine width={62} height={42} size={20} />
      </View>
    </View>
  );
}
