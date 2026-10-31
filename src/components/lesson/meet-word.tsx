import { useEffect, useId, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming, ZoomIn } from 'react-native-reanimated';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { WordArt } from '@/components/art/word-art';
import { FlipIcon, SpeakerIcon, TurtleIcon } from '@/components/icons';
import { MascotPrompt, RoundAudio } from '@/components/lesson/shared';
import { speak } from '@/components/speak-button';
import { PillButton } from '@/components/sticker';
import { Txt } from '@/components/text';
import { HighlightedExample } from '@/components/word-card';
import { articleFor, display, isGendered, lowerFirst, type LessonWord } from '@/data/lesson';
import { RarityInfo } from '@/data/rarity';
import { useLanguage } from '@/state/language';
import { Font } from '@/theme/fonts';
import { Bounce, Radius, Space, Stroke } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';

/** The card's width, which a drag across turns it half over. */
const CardWidth = 268;
/** How far, as a share of the card's width, or how fast (px/s) a swipe must go to flip the card. */
const SwipeDistance = 0.3;
const SwipeVelocity = 600;
const FlipMs = 420;

/** Keeps an angle in 0–360, for angles that went negative from left swipes. */
function wrap(angle: number) {
  'worklet';
  return ((angle % 360) + 360) % 360;
}

/** A new word pops out of a capsule like a pull. Tap the card, or swipe it either way, to flip it to its meaning and example sentence. */
export function MeetWord({ word, onDone }: { word: LessonWord; onDone: () => void }) {
  const p = usePalette();
  const { language } = useLanguage();
  // Half-turns from the start: right swipes and taps add one, left swipes take one away.
  const [turns, setTurns] = useState(0);
  const back = Math.abs(turns) % 2 === 1;
  const [artWidth, setArtWidth] = useState(0);
  const dotsId = `dots-${useId().replace(/:/g, '')}`;
  const info = RarityInfo[word.rarity];
  const said = display(word);
  const gendered = isGendered(word);
  const bare = lowerFirst(word.word);
  const article = gendered ? articleFor(word) : '';
  const genderName = word.gender === 'F' ? 'feminine' : 'masculine';
  const detail = [lowerFirst(word.kind), word.gender && genderName].filter(Boolean).join(' · ');
  // Each face draws the whole card, frame included, so the flip turns the entire card over.
  const frame = {
    position: 'absolute' as const,
    inset: 0,
    padding: 10,
    gap: 10,
    backgroundColor: info.color,
    borderColor: p.line,
    borderWidth: Stroke[3],
    borderRadius: 28,
    boxShadow: `0 4px 0 ${p.line}`,
  };

  // The card turns 180° about its vertical centre line per flip. Both faces are stacked, and each shows
  // only while it faces the learner, swapping when the card is edge-on.
  const turn = useSharedValue(0);
  // Where the card rests between flips, a multiple of 180°.
  const rest = useSharedValue(0);
  const frontStyle = useAnimatedStyle(() => {
    const a = wrap(turn.get());
    return { opacity: a < 90 || a > 270 ? 1 : 0, transform: [{ perspective: 1200 }, { rotateY: `${a}deg` }] };
  });
  const backStyle = useAnimatedStyle(() => {
    const a = wrap(turn.get());
    return { opacity: a < 90 || a > 270 ? 0 : 1, transform: [{ perspective: 1200 }, { rotateY: `${a + 180}deg` }] };
  });
  const flip = () => {
    const to = rest.get() + 180;
    rest.set(to);
    turn.set(withTiming(to, { duration: FlipMs, easing: Easing.inOut(Easing.cubic) }));
    setTurns(to / 180);
  };

  // The card follows a sideways drag, then finishes turning the way it was swiped, or springs back.
  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-16, 16])
    .onUpdate((e) => {
      turn.set(rest.get() + Math.max(-180, Math.min(180, (e.translationX / CardWidth) * 180)));
    })
    .onEnd((e) => {
      const dir = e.translationX < 0 ? -1 : 1;
      const far = Math.abs(e.translationX) > CardWidth * SwipeDistance;
      const flung = Math.abs(e.velocityX) > SwipeVelocity && Math.sign(e.velocityX) === dir;
      const to = far || flung ? rest.get() + dir * 180 : rest.get();
      const duration = Math.max(120, (FlipMs * Math.abs(to - turn.get())) / 180);
      rest.set(to);
      turn.set(withTiming(to, { duration, easing: Easing.out(Easing.cubic) }));
      scheduleOnRN(setTurns, to / 180);
    });

  // Audio plays as the card lands.
  useEffect(() => {
    speak(said, language.locale);
  }, [said, language.locale]);

  return (
    <>
      <MascotPrompt text="New word! Tap the card to see what it means." />

      <View style={{ flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View entering={ZoomIn.duration(520).easing(Easing.bezier(...Bounce).factory())} style={{ width: CardWidth, maxHeight: '100%', flexShrink: 1 }}>
          <GestureDetector gesture={pan}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                back
                  ? `${said} means ${word.meaning}. ${detail}.${word.example ? ` ${word.example}: ${word.exampleMeaning}.` : ''} Tap to flip back.`
                  : `${said}. Tap to see what it means.`
              }
              onPress={flip}
              style={{ height: 420, maxHeight: '100%' }}>
              <Animated.View pointerEvents="none" importantForAccessibility="no-hide-descendants" style={[frame, backStyle]}>
                <View style={{ flex: 1, justifyContent: 'center', gap: Space[2], paddingVertical: 18, paddingHorizontal: Space[4], backgroundColor: p.paper, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.md }}>
                  <Txt color={p.onBright} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.6} style={{ fontFamily: Font.display700, fontSize: 40, lineHeight: 44 }}>
                    {word.meaning}
                  </Txt>
                  <Txt color={p.onBrightMuted} style={{ fontFamily: Font.body800, fontSize: 13, lineHeight: 18 }}>
                    {detail}
                  </Txt>
                  {!!word.example && (
                    <>
                      <View style={{ height: 2, marginVertical: 2, backgroundColor: p.surfaceSunken, borderRadius: 2 }} />
                      <Txt color={p.onBright} style={{ fontFamily: Font.display600, fontSize: 18, lineHeight: 23 }}>
                        <HighlightedExample sentence={word.example} word={bare} fill={p.grapeSoft} />
                      </Txt>
                      {!!word.exampleMeaning && (
                        <Txt color={p.onBrightMuted} style={{ fontFamily: Font.body800, fontSize: 14, lineHeight: 19 }}>
                          {word.exampleMeaning}
                        </Txt>
                      )}
                    </>
                  )}
                </View>
              </Animated.View>
              <Animated.View pointerEvents="none" importantForAccessibility="no-hide-descendants" style={[frame, frontStyle]}>
                <View
                  onLayout={(e) => setArtWidth(e.nativeEvent.layout.width)}
                  style={{ flex: 1, minHeight: 80, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: p[info.soft], borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.md }}>
                  <Svg style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} width="100%" height="100%">
                    <Defs>
                      <Pattern id={dotsId} width={20} height={20} patternUnits="userSpaceOnUse">
                        <Circle cx={10} cy={10} r={3} fill={info.color} opacity={0.45} />
                      </Pattern>
                    </Defs>
                    <Rect width="100%" height="100%" fill={`url(#${dotsId})`} />
                  </Svg>
                  {artWidth > 0 && <WordArt id={word.id} color={info.color} line={p.line} width={Math.min(140, artWidth * 0.6)} />}
                </View>
                <View style={{ alignItems: 'center', gap: Space[2], paddingTop: Space[3], paddingHorizontal: Space[3], paddingBottom: 14, backgroundColor: p.paper, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.md }}>
                  {/* The article sits quietly beside the word, joined to it after an elided l'. */}
                  <View style={{ maxWidth: '100%', flexDirection: 'row', alignItems: 'baseline', gap: article.endsWith("'") ? 0 : 10 }}>
                    {!!article && (
                      <Txt color={p.onBrightMuted} style={{ fontFamily: Font.display600, fontSize: 26, lineHeight: 30 }}>
                        {article}
                      </Txt>
                    )}
                    <Txt color={p.onBright} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} style={{ flexShrink: 1, fontFamily: Font.display700, fontSize: 44, lineHeight: 48 }}>
                      {bare}
                    </Txt>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: Space[1], paddingLeft: 9, paddingRight: Space[3], backgroundColor: p[info.soft], borderColor: p.line, borderWidth: Stroke[1], borderRadius: Radius.pill }}>
                    <FlipIcon color={p.onBright} />
                    <Txt color={p.onBright} style={{ fontFamily: Font.body900, fontSize: 13, lineHeight: 17 }}>
                      Tap to flip
                    </Txt>
                  </View>
                </View>
              </Animated.View>
            </Pressable>
          </GestureDetector>
        </Animated.View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Space[4] }}>
        <RoundAudio label="Play the word" fill={p.sky} size={64} onPress={() => speak(said, language.locale)}>
          <SpeakerIcon color={p.onBright} fill={p.paper} size={30} />
        </RoundAudio>
        <RoundAudio label="Play slowly" fill={p.skySoft} size={48} onPress={() => speak(said, language.locale, 0.5)}>
          <TurtleIcon color={p.onBright} fill={p.leaf} />
        </RoundAudio>
      </View>

      <PillButton label="Got it" fill={p.pink} onPress={onDone} style={{ minHeight: 56 }} />
    </>
  );
}

/** Masculine is a tangerine sideways pill, feminine a grape circle, so gender reads without colour. */
export function GenderChip({ feminine, text, size = 38 }: { feminine: boolean; text: string; size?: number }) {
  const p = usePalette();
  return (
    <View
      accessibilityLabel={feminine ? 'feminine' : 'masculine'}
      style={{
        height: size,
        minWidth: feminine ? size : size * 1.5,
        paddingHorizontal: feminine ? 0 : 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: feminine ? p.grape : p.tangerine,
        borderColor: p.line,
        borderWidth: Stroke[2],
        borderRadius: Radius.pill,
      }}>
      <Txt color={p.onBright} style={{ fontFamily: Font.display600, fontSize: size * 0.47, lineHeight: size * 0.58 }}>
        {text}
      </Txt>
    </View>
  );
}
