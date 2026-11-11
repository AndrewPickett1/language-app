import { useState } from 'react';
import { View } from 'react-native';

import { AnswerTile, CheckButton, MascotPrompt, type Feedback, type TileState } from '@/components/lesson/shared';
import { speak } from '@/components/speak-button';
import { Panel } from '@/components/sticker';
import { Txt } from '@/components/text';
import { display, gloss, type LessonWord } from '@/data/lesson';
import { useLanguage } from '@/state/language';
import { Font } from '@/theme/fonts';
import { Radius, Space, Stroke } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';

type Props = {
  /** The conjugated form being asked, "nous sommes". */
  word: LessonWord;
  pronoun: string;
  form: string;
  options: string[];
  retry?: boolean;
  onAnswer: (right: boolean, feedback: Feedback) => void;
};

/** Fill in the form: a pronoun with a blank after it, and the verb's forms to choose from. */
export function FormPick({ word, pronoun, form, options, retry, onAnswer }: Props) {
  const p = usePalette();
  const { language } = useLanguage();
  const [sel, setSel] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const said = display(word);
  // An elided pronoun (j') runs straight into the blank.
  const joined = pronoun.endsWith("'");

  const check = () => {
    if (sel === null || answered) return;
    setAnswered(true);
    const right = sel === form;
    speak(said, language.locale);
    onAnswer(
      right,
      right
        ? { right, title: 'Nice!', text: `${said} = ${gloss(word)}` }
        : { right, title: 'Almost —', text: `it's ${said}.${retry ? '' : " We'll come back to it."}` }
    );
  };

  const stateOf = (o: string): TileState => {
    if (!answered) return sel === o ? 'selected' : 'idle';
    if (o === form) return 'right';
    return sel === o ? 'wrong' : 'faded';
  };

  return (
    <>
      <MascotPrompt text="Which form fills the gap?" pose="think" />

      <View style={{ flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center', gap: Space[4] }}>
        <Panel fill={p.white} radius={28} style={{ alignItems: 'center', gap: 10, paddingVertical: 24, paddingHorizontal: 22 }}>
          <View
            accessible
            accessibilityLabel={answered ? said : `${pronoun}, blank`}
            accessibilityLanguage={language.locale}
            style={{ flexDirection: 'row', alignItems: 'center', gap: joined ? 2 : 12 }}>
            <Txt color={p.onBright} style={{ fontFamily: Font.display600, fontSize: 36, lineHeight: 44 }}>
              {pronoun}
            </Txt>
            <View
              style={{
                minWidth: 110,
                paddingHorizontal: 12,
                alignItems: 'center',
                backgroundColor: answered ? p.leafSoft : p.pinkSoft,
                borderColor: answered ? p.leaf : p.pink,
                borderWidth: Stroke[2],
                borderStyle: answered ? 'solid' : 'dashed',
                borderRadius: Radius.md,
              }}>
              <Txt color={p.onBright} style={{ fontFamily: Font.display600, fontSize: 36, lineHeight: 44 }}>
                {answered ? form : ' '}
              </Txt>
            </View>
          </View>
          <View style={{ paddingVertical: 4, paddingHorizontal: 14, backgroundColor: p.skySoft, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.pill }}>
            <Txt color={p.onBright} style={{ fontFamily: Font.body800, fontSize: 17, lineHeight: 22 }}>
              {gloss(word)}
            </Txt>
          </View>
        </Panel>
      </View>

      <View accessibilityRole="radiogroup" accessibilityLabel="Answers" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space[3] }}>
        {options.map((o) => (
          <AnswerTile
            key={o}
            label={o}
            french
            state={stateOf(o)}
            disabled={answered}
            height={64}
            style={{ width: '47%', flexGrow: 1 }}
            onPress={() => setSel(o)}
          />
        ))}
      </View>

      <CheckButton enabled={sel !== null && !answered} onPress={check} />
    </>
  );
}
