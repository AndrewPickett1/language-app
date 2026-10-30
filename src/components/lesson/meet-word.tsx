import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming, ZoomIn } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { WordArt } from '@/components/art/word-art';
import { SpeakerIcon } from '@/components/icons';
import { MascotPrompt, RoundAudio } from '@/components/lesson/shared';
import { speak } from '@/components/speak-button';
import { PillButton } from '@/components/sticker';
import { Txt } from '@/components/text';
import { display, isGendered, lowerFirst, type LessonWord } from '@/data/lesson';
import { RarityInfo, starString } from '@/data/rarity';
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

/** A new word pops out of a capsule like a pull. Tap the card, or swipe it either way, to flip it to its example sentence. */
export function MeetWord({ word, onDone }: { word: LessonWord; onDone: () => void }) {
  const p = usePalette();
  const { language } = useLanguage();
  // Half-turns from the start: right swipes and taps add one, left swipes take one away.
  const [turns, setTurns] = useState(0);
  const back = Math.abs(turns) % 2 === 1;
  const [artWidth, setArtWidth] = useState(0);
  const info = RarityInfo[word.rarity];
  const said = display(word);
  const gendered = isGendered(word);
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
      <MascotPrompt text="New word! Tap or swipe the card to flip it." />

      <View style={{ flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View entering={ZoomIn.duration(520).easing(Easing.bezier(...Bounce).factory())} style={{ width: CardWidth, maxHeight: '100%', flexShrink: 1 }}>
          <GestureDetector gesture={pan}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={back ? `Card back: ${word.example}. Tap to flip back.` : `${said}, ${word.meaning}. Tap to see it in a sentence.`}
              onPress={flip}
              style={{ height: 420, maxHeight: '100%' }}>
              <Animated.View pointerEvents="none" importantForAccessibility="no-hide-descendants" style={[frame, backStyle]}>
                <View style={{ flex: 1, justifyContent: 'center', gap: 14, padding: 18, backgroundColor: p.paper, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.md }}>
                  <Txt variant="caption" color={p.onBrightMuted}>
                    In a sentence
                  </Txt>
                  <Txt color={p.onBright} style={{ fontFamily: Font.display600, fontSize: 26, lineHeight: 32 }}>
                    {word.example || said}
                  </Txt>
                  {!!word.exampleMeaning && (
                    <Txt color={p.onBrightMuted} style={{ fontFamily: Font.body800, fontSize: 16, lineHeight: 22 }}>
                      {word.exampleMeaning}
                    </Txt>
                  )}
                  <Txt color={p.onBright} style={{ fontFamily: Font.body800, fontSize: 13, lineHeight: 18 }}>
                    Tap to flip back
                  </Txt>
                </View>
              </Animated.View>
              <Animated.View pointerEvents="none" importantForAccessibility="no-hide-descendants" style={[frame, frontStyle]}>
                <View
                  onLayout={(e) => setArtWidth(e.nativeEvent.layout.width)}
                  style={{ flex: 1, minHeight: 80, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: p.paper, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.md }}>
                  {artWidth > 0 && <WordArt id={word.id} color={info.color} line={p.line} width={Math.min(150, artWidth * 0.6)} />}
                </View>
                <View style={{ gap: 4, padding: 12, backgroundColor: p.paper, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.md }}>
                  <Txt variant="caption" color={p.onBrightMuted}>
                    {info.name} {starString(word.rarity)}
                  </Txt>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space[2] }}>
                    {gendered && <GenderChip feminine={word.gender === 'F'} text={word.gender === 'F' ? 'la' : 'le'} />}
                    <Txt color={p.onBright} numberOfLines={1} adjustsFontSizeToFit style={{ flexShrink: 1, fontFamily: Font.display600, fontSize: 32, lineHeight: 38 }}>
                      {gendered ? lowerFirst(word.word) : said}
                    </Txt>
                  </View>
                  <Txt color={p.onBright} style={{ fontFamily: Font.body800, fontSize: 16, lineHeight: 22 }}>
                    {word.meaning}
                  </Txt>
                  <Txt color={p.onBrightMuted} style={{ fontFamily: Font.body700, fontSize: 13, lineHeight: 18 }}>
                    {detail}
                  </Txt>
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
        <PillButton label="Slower" fill={p.skySoft} lift={3} onPress={() => speak(said, language.locale, 0.5)} style={{ minHeight: 48, paddingHorizontal: 16 }} />
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
