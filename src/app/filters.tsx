import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';

import { Capsule } from '@/components/art/capsule';
import { CheckIcon } from '@/components/icons';
import { Screen, ScreenHeader, goBack } from '@/components/screen';
import { Panel, PillButton } from '@/components/sticker';
import { Txt } from '@/components/text';
import { RarityInfo, type Rarity } from '@/data/rarity';
import type { WordType } from '@/data/words';
import { useMyWords } from '@/state/my-words';
import { NoFilters, applyWordFilters, useWordFilters, type GenderFilter, type WordSort } from '@/state/word-filters';
import { Font } from '@/theme/fonts';
import { Radius, Space, Stroke } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';

const Types: [WordType, string][] = [
  ['Noun', 'Nouns'],
  ['Verb', 'Verbs'],
  ['Adjective', 'Adjectives'],
];

const Rarities: Rarity[] = ['common', 'uncommon', 'rare', 'superRare', 'ultraRare'];

const Genders: [GenderFilter, string][] = [
  ['any', 'Any'],
  ['M', 'Masculine'],
  ['F', 'Feminine'],
];

const Sorts: [WordSort, string][] = [
  ['rarity', 'Rarity'],
  ['az', 'A–Z'],
  ['new', 'Newest'],
];

function toggle<T>(list: T[], item: T) {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

/** Edits a draft of the "My words" filters; "Show N words" applies it, the close button drops it. */
export default function FiltersScreen() {
  const p = usePalette();
  const { words, collected } = useMyWords();
  const { filters, setFilters } = useWordFilters();
  const [draft, setDraft] = useState(filters);

  const count = applyWordFilters(words, draft, collected).length;

  return (
    <Screen background={p.grapeSoft}>
      <ScreenHeader
        kind="close"
        backLabel="Close filters"
        fallback="/words"
        title="Filters"
        trailing={
          <Pressable
            accessibilityRole="button"
            onPress={() => setDraft(NoFilters)}
            style={{ width: 64, height: 48, alignItems: 'flex-end', justifyContent: 'center' }}>
            <Txt style={{ fontFamily: Font.body900, fontSize: 16, lineHeight: 20, textDecorationLine: 'underline' }}>Reset</Txt>
          </Pressable>
        }
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: Space[3] }} showsVerticalScrollIndicator={false}>
        <Section title="Word type">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space[2] }}>
            {Types.map(([type, label]) => {
              const on = draft.types.includes(type);
              return (
                <Chip key={type} on={on} onPress={() => setDraft({ ...draft, types: toggle(draft.types, type) })} style={{ paddingHorizontal: Space[4] }}>
                  {on && <CheckIcon color={p.onBright} size={14} />}
                  <ChipLabel>{label}</ChipLabel>
                </Chip>
              );
            })}
          </View>
        </Section>

        <Section title="Rarity">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space[2] }}>
            {Rarities.map((r) => (
              <Chip
                key={r}
                on={draft.rarities.includes(r)}
                onPress={() => setDraft({ ...draft, rarities: toggle(draft.rarities, r) })}
                style={{ paddingLeft: Space[2], paddingRight: 14, gap: 7 }}>
                <Capsule color={RarityInfo[r].color} line={p.line} size={24} shine={false} stroke={6.5} />
                <ChipLabel>{RarityInfo[r].name}</ChipLabel>
              </Chip>
            ))}
          </View>
        </Section>

        <Section title="Gender">
          <Segmented options={Genders} value={draft.gender} onChange={(gender) => setDraft({ ...draft, gender })} />
        </Section>

        <Section title="Sort by">
          <Segmented options={Sorts} value={draft.sort} onChange={(sort) => setDraft({ ...draft, sort })} />
        </Section>
      </ScrollView>

      <PillButton
        label={count === 0 ? 'No words match' : `Show ${count} ${count === 1 ? 'word' : 'words'}`}
        fill={count === 0 ? p.locked : p.leaf}
        disabled={count === 0}
        onPress={() => {
          setFilters(draft);
          goBack('/words');
        }}
        style={{ minHeight: 56 }}
      />
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const p = usePalette();
  return (
    <Panel fill={p.surfaceRaised} radius={Radius.md} borderWidth={Stroke[2]} lift={0} style={{ padding: 14, gap: 10 }}>
      <Txt variant="caption" accessibilityRole="header" style={{ fontFamily: Font.body900 }}>
        {title}
      </Txt>
      {children}
    </Panel>
  );
}

function Chip({ on, onPress, style, children }: { on: boolean; onPress: () => void; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const p = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={[
        {
          height: 44,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: on ? p.sunshine : p.surfaceRaised,
          borderColor: p.line,
          borderWidth: Stroke[2],
          borderRadius: Radius.pill,
        },
        style,
      ]}>
      {children}
    </Pressable>
  );
}

function ChipLabel({ children }: { children: ReactNode }) {
  const p = usePalette();
  return (
    <Txt color={p.onBright} style={{ fontFamily: Font.body900, fontSize: 15, lineHeight: 20 }}>
      {children}
    </Txt>
  );
}

function Segmented<T extends string>({ options, value, onChange }: { options: [T, string][]; value: T; onChange: (v: T) => void }) {
  const p = usePalette();
  return (
    <View
      accessibilityRole="radiogroup"
      style={{ flexDirection: 'row', padding: 3, gap: 3, backgroundColor: p.surface, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.pill }}>
      {options.map(([v, label]) => {
        const on = v === value;
        return (
          <Pressable
            key={v}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            onPress={() => onChange(v)}
            style={{ flex: 1, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? p.ink : 'transparent', borderRadius: Radius.pill }}>
            <Txt color={on ? p.surface : p.ink} style={{ fontFamily: Font.body900, fontSize: 15, lineHeight: 20 }}>
              {label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}
