import { useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, ZoomIn } from 'react-native-reanimated';

import { GenderChip } from '@/components/lesson/meet-word';
import type { Feedback } from '@/components/lesson/shared';
import { speak } from '@/components/speak-button';
import { Panel, PillButton, Sticker } from '@/components/sticker';
import { Txt } from '@/components/text';
import { display, gloss, lowerFirst, type LessonWord } from '@/data/lesson';
import { useLanguage } from '@/state/language';
import { Font } from '@/theme/fonts';
import { Bounce, Radius, Space, Stroke } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';

type Props = {
  noun: LessonWord;
  indefinite: boolean;
  /** Open the rule card before the first question (the articles module). */
  ruleFirst: boolean;
  onAnswer: (right: boolean, feedback: Feedback) => void;
};

/** How long a wrong article sits in the slot before the right one slides in, then before the sheet. */
const SwapMs = 650;
const SheetMs = 1150;

/** Pick le or la (or un or une) for a noun. The article drops into the dashed slot; a wrong one swaps out. */
export function GenderPick({ noun, indefinite, ruleFirst, onAnswer }: Props) {
  const p = usePalette();
  const { language } = useLanguage();
  const [picked, setPicked] = useState<'M' | 'F' | null>(null);
  const [swapped, setSwapped] = useState(false);
  const [rule, setRule] = useState(ruleFirst);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const masc = indefinite ? 'un' : 'le';
  const fem = indefinite ? 'une' : 'la';
  const bare = lowerFirst(noun.word);
  const answer = noun.gender === 'F' ? 'F' : 'M';

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const pick = (g: 'M' | 'F') => {
    if (picked) return;
    setPicked(g);
    const right = g === answer;
    const said = display(noun, indefinite);
    const genderName = answer === 'F' ? 'feminine' : 'masculine';
    const feedback: Feedback = right
      ? { right, title: 'Snap!', text: `${said} = ${indefinite ? 'a' : 'the'} ${gloss(noun).toLowerCase()}` }
      : { right, title: 'Almost —', text: `it's ${said}. ${bare.charAt(0).toUpperCase() + bare.slice(1)} is ${genderName}.` };
    speak(said, language.locale);
    if (right) onAnswer(true, feedback);
    else {
      timers.current.push(setTimeout(() => setSwapped(true), SwapMs));
      timers.current.push(setTimeout(() => onAnswer(false, feedback), SheetMs));
    }
  };

  // The chip in the slot: what was picked, then the right one once a wrong pick has swapped out.
  const shown = picked && (picked === answer || swapped ? answer : picked);
  const wrongShowing = !!picked && picked !== answer && !swapped;

  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space[3] }}>
        <Txt variant="bodyLg" style={{ flex: 1 }}>
          Which one goes with this word?
        </Txt>
        <PillButton label="Rule" fill={p.sunshineSoft} lift={3} onPress={() => setRule(true)} style={{ minHeight: 44, paddingHorizontal: 14 }} />
      </View>

      <View style={{ flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Panel fill={p.sky} radius={28} style={{ width: '100%', padding: 10 }}>
          <View style={{ alignItems: 'center', gap: 10, paddingVertical: 22, paddingHorizontal: 12, backgroundColor: p.paper, borderColor: p.line, borderWidth: Stroke[2], borderRadius: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 72 }}>
              <View
                style={{
                  width: 96,
                  height: 64,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderColor: shown ? 'transparent' : p.line,
                  borderWidth: Stroke[2],
                  borderStyle: 'dashed',
                  borderRadius: Radius.pill,
                }}>
                {shown && (
                  <Animated.View key={`${shown}-${swapped}`} entering={ZoomIn.duration(300).easing(Easing.bezier(...Bounce).factory())}>
                    {wrongShowing ? (
                      <View style={{ height: 58, minWidth: 58, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: p.cherry, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.pill }}>
                        <Txt color={p.onBright} style={{ fontFamily: Font.display600, fontSize: 24, lineHeight: 28 }}>
                          {shown === 'M' ? masc : fem}
                        </Txt>
                      </View>
                    ) : (
                      <GenderChip feminine={shown === 'F'} text={shown === 'M' ? masc : fem} size={58} />
                    )}
                  </Animated.View>
                )}
              </View>
              <Txt color={p.onBright} numberOfLines={1} adjustsFontSizeToFit style={{ flexShrink: 1, fontFamily: Font.display600, fontSize: 40, lineHeight: 46 }}>
                {bare}
              </Txt>
            </View>
            <Txt color={p.onBrightMuted} style={{ fontFamily: Font.body800, fontSize: 16, lineHeight: 22 }}>
              {gloss(noun).toLowerCase()}
            </Txt>
          </View>
        </Panel>
      </View>

      <View accessibilityLabel="Articles" style={{ flexDirection: 'row', gap: 14 }}>
        <ArticleButton gender="M" text={masc} picked={picked} answer={answer} onPress={() => pick('M')} />
        <ArticleButton gender="F" text={fem} picked={picked} answer={answer} onPress={() => pick('F')} />
      </View>

      <RuleCard visible={rule} onClose={() => setRule(false)} />
    </>
  );
}

function ArticleButton({ gender, text, picked, answer, onPress }: { gender: 'M' | 'F'; text: string; picked: 'M' | 'F' | null; answer: 'M' | 'F'; onPress: () => void }) {
  const p = usePalette();
  const faded = !!picked && gender !== answer && picked !== gender;
  return (
    <Sticker
      accessibilityRole="button"
      accessibilityLabel={`${text}, ${gender === 'F' ? 'feminine' : 'masculine'}`}
      fill={p.white}
      radius={28}
      disabled={!!picked}
      onPress={onPress}
      style={{ flex: 1, height: 132, alignItems: 'center', justifyContent: 'center', gap: Space[2], opacity: faded ? 0.5 : 1 }}>
      {gender === 'M' ? (
        <View style={{ width: 120, height: 72, alignItems: 'center', justifyContent: 'center', backgroundColor: p.tangerine, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.pill }}>
          <Txt color={p.onBright} style={{ fontFamily: Font.display600, fontSize: 34, lineHeight: 40 }}>
            {text}
          </Txt>
        </View>
      ) : (
        <View style={{ width: 78, height: 78, alignItems: 'center', justifyContent: 'center', backgroundColor: p.grape, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.pill }}>
          <Txt color={p.onBright} style={{ fontFamily: Font.display600, fontSize: 30, lineHeight: 36 }}>
            {text}
          </Txt>
        </View>
      )}
      <Txt variant="caption" color={p.onBright}>
        {gender === 'F' ? 'Feminine' : 'Masculine'}
      </Txt>
    </Sticker>
  );
}

/** "Every noun has a gender": le · un on the tangerine pill, la · une on the grape circle. */
function RuleCard({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const p = usePalette();
  const column = (feminine: boolean) => (
    <View style={{ flex: 1, alignItems: 'center', gap: Space[2], paddingVertical: 14, paddingHorizontal: Space[2], backgroundColor: p.paper, borderColor: p.line, borderWidth: Stroke[2], borderRadius: 20 }}>
      <GenderChip feminine={feminine} text={feminine ? 'la · une' : 'le · un'} size={feminine ? 76 : 52} />
      <Txt variant="caption" color={p.onBright}>
        {feminine ? 'Feminine' : 'Masculine'}
      </Txt>
      <Txt color={p.onBright} style={{ fontFamily: Font.body800, fontSize: 16, lineHeight: 22, textAlign: 'center' }}>
        {feminine ? 'la femme\nla maison' : 'le jour\nle temps'}
      </Txt>
    </View>
  );
  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(200)} style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', padding: Space[4], backgroundColor: 'rgba(42, 27, 74, 0.45)' }]}>
        <Panel fill={p.white} radius={28} style={{ width: '100%', gap: 14, padding: 18 }}>
          <Txt variant="title" accessibilityRole="header" color={p.onBright}>
            Every noun has a gender
          </Txt>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {column(false)}
            {column(true)}
          </View>
          <Txt variant="body" color={p.onBright}>
            Learn each noun with its article. The shape on the card tells you which: a pill for masculine, a circle for feminine.
          </Txt>
          <PillButton label="Got it" fill={p.pink} onPress={onClose} />
        </Panel>
      </Animated.View>
    </Modal>
  );
}
