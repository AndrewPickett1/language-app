import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { speak } from '@/components/speak-button';
import { Txt } from '@/components/text';
import { PersonCodes, Tenses, type Conjugation, type Tense, type VerbForm } from '@/data/conjugations';
import type { LanguageCode } from '@/data/languages';
import { Pronouns } from '@/data/pronouns';
import { withPronoun } from '@/data/verb-lesson';
import { useLanguage } from '@/state/language';
import { Font } from '@/theme/fonts';
import { Radius, Space, Stroke, Themes } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';

/**
 * The verb card's conjugation table: a tense switch over the six forms, endings highlighted.
 * Every verb card has one. Forms missing from `conjugation` (or all of them, without one) show as dashes.
 * Each form is labelled with its pronoun in `language` (see `Pronouns`), and tapping one says it aloud.
 */
export function ConjugationPanel({ conjugation, language }: { conjugation?: Conjugation; language: LanguageCode }) {
  const p = usePalette();
  const [tense, setTense] = useState<Tense>('present');
  const forms = conjugation?.forms[tense];

  return (
    <View
      accessibilityLabel="Conjugation"
      style={{ gap: Space[2], padding: 10, backgroundColor: p.white, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.md }}>
      <View
        accessibilityRole="tablist"
        accessibilityLabel="Tense"
        style={{ flexDirection: 'row', gap: Space[1], padding: 3, backgroundColor: p.paper, borderColor: p.line, borderWidth: Stroke[1], borderRadius: Radius.pill }}>
        {Tenses.map((t) => {
          const on = t.id === tense;
          return (
            <Pressable
              key={t.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => setTense(t.id)}
              style={{
                flex: 1,
                height: 30,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: on ? p.sunshine : 'transparent',
                borderColor: on ? p.line : 'transparent',
                borderWidth: Stroke[1],
                borderRadius: Radius.pill,
              }}>
              <Txt color={p.onBright} style={{ fontFamily: Font.display600, fontSize: 15, lineHeight: 18 }}>
                {t.label}
              </Txt>
            </Pressable>
          );
        })}
      </View>

      <View style={{ gap: 6 }}>
        {[0, 2, 4].map((first) => (
          <View key={first} style={{ flexDirection: 'row', gap: 6 }}>
            {[first, first + 1].map((i) => (
              <FormCell key={i} person={Pronouns[language][PersonCodes[i]]} form={forms?.[i]} />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

/** One form in the table. Tapping it says the form with its first pronoun ("Il / Elle" → il), as the lessons write it. */
function FormCell({ person, form }: { person: string; form?: VerbForm }) {
  const p = usePalette();
  const { language } = useLanguage();
  const phrase = form ? withPronoun(person.split(' / ')[0], form.stem + form.ending) : undefined;
  return (
    <Pressable
      disabled={!phrase}
      accessibilityRole={phrase ? 'button' : undefined}
      accessibilityLabel={form ? `${person}: ${form.stem}${form.ending}` : `${person}: not available yet`}
      accessibilityHint={phrase ? 'Plays the pronunciation' : undefined}
      onPress={() => phrase && speak(phrase, language.locale)}
      style={({ pressed }) => ({ flex: 1, paddingHorizontal: 10, paddingTop: 5, paddingBottom: 6, backgroundColor: pressed ? Themes.light.sunshineSoft : p.paper, borderRadius: Radius.sm })}>
      <Txt color={Themes.light.inkMuted} style={{ fontFamily: Font.body900, fontSize: 11, lineHeight: 14, letterSpacing: 0.44, textTransform: 'uppercase' }}>
        {person}
      </Txt>
      <Txt numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} color={p.onBright} style={{ fontFamily: Font.display600, fontSize: 18, lineHeight: 22 }}>
        {form ? (
          <>
            {form.stem}
            <Text style={{ backgroundColor: Themes.light.sunshineSoft }}>{form.ending}</Text>
          </>
        ) : (
          '–'
        )}
      </Txt>
    </Pressable>
  );
}
