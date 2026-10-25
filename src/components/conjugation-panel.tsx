import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Txt } from '@/components/text';
import { Persons, Tenses, type Conjugation, type Tense, type VerbForm } from '@/data/conjugations';
import { Font } from '@/theme/fonts';
import { Radius, Space, Stroke, Themes } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';

/**
 * The verb card's conjugation table: a tense switch over the six forms, endings highlighted.
 * Every verb card has one. Without a `conjugation` the forms show as dashes.
 */
export function ConjugationPanel({ conjugation }: { conjugation?: Conjugation }) {
  const p = usePalette();
  const [tense, setTense] = useState<Tense>('present');
  const forms: (VerbForm | undefined)[] = conjugation?.forms[tense] ?? Array.from({ length: Persons.length }, () => undefined);
  const rows = [0, 2, 4].map((i) => forms.slice(i, i + 2));

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
        {rows.map((row, r) => (
          <View key={r} style={{ flexDirection: 'row', gap: 6 }}>
            {row.map((form, c) => (
              <FormCell key={c} person={Persons[r * 2 + c]} form={form} />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

function FormCell({ person, form }: { person: string; form?: VerbForm }) {
  const p = usePalette();
  return (
    <View
      accessible
      accessibilityLabel={form ? `${person}: ${form.stem}${form.ending}` : `${person}: not available yet`}
      style={{ flex: 1, paddingHorizontal: 10, paddingTop: 5, paddingBottom: 6, backgroundColor: p.paper, borderRadius: Radius.sm }}>
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
    </View>
  );
}
