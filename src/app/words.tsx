import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Capsule } from '@/components/art/capsule';
import { ArrowIcon, FilterIcon } from '@/components/icons';
import { LanguageButton } from '@/components/language-button';
import { Screen, ScreenHeader } from '@/components/screen';
import { RoundButton } from '@/components/sticker';
import { Txt } from '@/components/text';
import { RarityInfo } from '@/data/rarity';
import { bareWord, type WordType } from '@/data/words';
import { useMyWords } from '@/state/my-words';
import { applyWordFilters, isFiltered, nextColumnSort, useWordFilters, type WordColumn } from '@/state/word-filters';
import { Font } from '@/theme/fonts';
import { Radius, Space, Stroke } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';

const Columns = [37, 29, 20, 14];
const Headers: [WordColumn, string, string][] = [
  ['word', 'Word', 'word'],
  ['meaning', 'Meaning', 'meaning'],
  ['type', 'Type', 'type'],
  ['gender', 'Gen.', 'gender'],
];

export default function WordsScreen() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { words, otherLanguageCount, collected, loading, error, refresh } = useMyWords();
  const { filters, setFilters } = useWordFilters();
  const [refreshing, setRefreshing] = useState(false);

  // Words can be won elsewhere, so re-read them whenever the list comes into view.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const rows = applyWordFilters(words, filters, collected);
  const typeFill: Record<WordType, string> = { Noun: p.sunshineSoft, Verb: p.skySoft, Adjective: p.pinkSoft };
  const count = loading && words.length === 0 ? 'Loading…' : `${rows.length} ${rows.length === 1 ? 'word' : 'words'}${isFiltered(filters) ? '' : ' collected'}`;

  return (
    <Screen edges={['top', 'left', 'right']} style={{ paddingBottom: 0, gap: 14 }}>
      <ScreenHeader
        backLabel="Back to home"
        center={
          <View style={{ flex: 1 }}>
            <Txt accessibilityRole="header" style={{ fontFamily: Font.display700, fontSize: 30, lineHeight: 34 }}>
              My words
            </Txt>
            <Txt variant="label" color={p.inkMuted}>
              {count}
            </Txt>
          </View>
        }
        trailing={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <LanguageButton />
            <RoundButton accessibilityLabel="Filter and sort words" fill={p.sunshine} onPress={() => router.push('/filters')}>
              <FilterIcon color={p.onBright} knob={p.paper} />
            </RoundButton>
          </View>
        }
      />

      <View style={{ flex: 1, marginHorizontal: -Space[4], backgroundColor: p.surfaceRaised }}>
        <View style={{ flexDirection: 'row', gap: Space[2], paddingHorizontal: 18, paddingTop: 14, paddingBottom: Space[3], backgroundColor: p.ink }}>
          {Headers.map(([column, label, name], i) => {
            const dir = filters.column?.column === column ? filters.column.dir : null;
            return (
              <Pressable
                key={column}
                accessibilityRole="button"
                accessibilityLabel={`Sort by ${name}`}
                accessibilityValue={dir ? { text: dir === 'asc' ? 'ascending' : 'descending' } : undefined}
                hitSlop={{ top: 14, bottom: Space[3] }}
                onPress={() => setFilters({ ...filters, column: nextColumnSort(filters.column, column) })}
                style={{ flex: Columns[i], flexDirection: 'row', alignItems: 'center', justifyContent: i === 3 ? 'center' : 'flex-start', gap: 3 }}>
                <Txt variant="caption" color={p.surface} style={{ fontSize: 11, lineHeight: 14, fontFamily: Font.body900 }}>
                  {label}
                </Txt>
                {dir && <ArrowIcon color={p.surface} size={11} direction={dir === 'asc' ? 'up' : 'down'} />}
              </Pressable>
            );
          })}
        </View>
        <FlatList
          data={rows}
          keyExtractor={(w) => w.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + Space[8] }}
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await refresh();
            setRefreshing(false);
          }}
          ListEmptyComponent={
            loading ? null : (
              <Txt variant="bodyLg" color={p.inkMuted} style={{ padding: 18, textAlign: 'center' }}>
                {error
                  ? `We couldn't load your words. ${error}`
                  : words.length === 0
                    ? otherLanguageCount > 0
                      ? `No words in this language yet. You have ${otherLanguageCount} in other languages: switch language to see them.`
                      : 'No words yet. Pull a capsule to win your first one!'
                    : 'No words match these filters.'}
              </Txt>
            )
          }
          renderItem={({ item: w }) => (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`${w.word}, ${w.meaning}, ${RarityInfo[w.rarity].name}`}
              onPress={() => router.push({ pathname: '/card/[id]', params: { id: w.id } })}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: Space[2],
                minHeight: 52,
                paddingHorizontal: 18,
                borderBottomWidth: Stroke[1],
                borderBottomColor: p.surfaceSunken,
                backgroundColor: pressed ? p.surface : 'transparent',
              })}>
              <View style={{ flex: Columns[0], flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <Capsule color={RarityInfo[w.rarity].color} line={p.line} size={16} shine={false} stroke={8} />
                <Txt style={{ flexShrink: 1, fontFamily: Font.display600, fontSize: 16, lineHeight: 20 }}>{bareWord(w.word)}</Txt>
              </View>
              <Txt variant="label" color={p.onBrightMuted} style={{ flex: Columns[1] }}>
                {w.meaning.replace(/^the /, '')}
              </Txt>
              <View style={{ flex: Columns[2], alignItems: 'flex-start' }}>
                <View style={{ paddingHorizontal: 7, paddingVertical: 1, backgroundColor: typeFill[w.type], borderColor: p.line, borderWidth: Stroke[1], borderRadius: Radius.pill }}>
                  <Txt style={{ fontFamily: Font.body900, fontSize: 11, lineHeight: 15 }}>{w.type === 'Adjective' ? 'Adj.' : w.type}</Txt>
                </View>
              </View>
              <View style={{ flex: Columns[3], alignItems: 'center' }}>
                {w.gender ? (
                  <View
                    accessibilityLabel={w.gender === 'F' ? 'Feminine' : 'Masculine'}
                    style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: p.surface, borderColor: p.line, borderWidth: Stroke[1], borderRadius: Radius.pill }}>
                    <Txt style={{ fontFamily: Font.body900, fontSize: 12, lineHeight: 16 }}>{w.gender}</Txt>
                  </View>
                ) : (
                  <Txt accessibilityLabel="Not a noun" color={p.inkMuted} style={{ fontFamily: Font.body900 }}>
                    –
                  </Txt>
                )}
              </View>
            </Pressable>
          )}
        />
      </View>
    </Screen>
  );
}
