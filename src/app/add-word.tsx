import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckIcon, CloseIcon, SearchIcon } from '@/components/icons';
import { Screen, ScreenHeader } from '@/components/screen';
import { StreakPopup } from '@/components/streak-popup';
import { Txt } from '@/components/text';
import { bareWord, type Word, type WordType } from '@/data/words';
import { useLanguage } from '@/state/language';
import { useMyWords } from '@/state/my-words';
import { useStreak } from '@/state/streak';
import { Font } from '@/theme/fonts';
import { Radius, Space, Stroke, shadowPop } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';
import { fetchDeck } from '@/utils/word-rows';

type Deck = { language: string; words: Word[]; error: string | null };

export default function AddWordScreen() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const { collected, add, canAddToday, refresh } = useMyWords();
  const streak = useStreak();
  const [deck, setDeck] = useState<Deck>();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  // Today's add is used up. Unknown (null) still allows a tap; the server has the final say.
  const locked = canAddToday === false;

  // The day may have rolled over since the screen was last open.
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  useEffect(() => {
    let live = true;
    fetchDeck(language.name)
      .then((words) => ({ language: language.name, words: words.sort((a, b) => bareWord(a.word).localeCompare(bareWord(b.word), undefined, { sensitivity: 'base' })), error: null }))
      .catch((e: Error) => ({ language: language.name, words: [], error: e.message }))
      .then((next) => {
        if (live) setDeck(next);
      });
    return () => {
      live = false;
    };
  }, [language.name]);

  const current = deck?.language === language.name ? deck : undefined;
  const owned = new Set(collected);
  const q = normalize(query);
  // Nothing shows until the learner starts typing.
  const results = q ? (current?.words ?? []).filter((w) => matches(w, q)) : [];
  const typeFill: Record<WordType, string> = { Noun: p.sunshineSoft, Verb: p.skySoft, Adjective: p.pinkSoft };
  const listTitle = !q ? '' : !current ? 'Loading…' : `${results.length} ${results.length === 1 ? 'match' : 'matches'}`;

  async function addWord(w: Word) {
    if (adding || locked || owned.has(w.id)) return;
    setAdding(w.id);
    setAddError(null);
    try {
      const status = await add(w.id);
      if (status === 'added') void streak.refresh('add');
      else if (status === 'owned') setAddError('That word is already in your words.');
      else if (status === 'unknown_word') setAddError("That word isn't available any more.");
    } catch (e) {
      setAddError(e instanceof Error ? e.message : String(e));
    } finally {
      setAdding(null);
    }
  }

  return (
    <Screen edges={['top', 'left', 'right']} style={{ paddingBottom: 0 }}>
      <ScreenHeader
        backLabel="Back to my words"
        fallback="/words"
        center={
          <Txt variant="title" accessibilityRole="header" style={{ flex: 1 }}>
            Add a word
          </Txt>
        }
      />

      <View
        style={{
          height: 56,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingLeft: Space[4],
          paddingRight: Space[2],
          backgroundColor: p.surfaceRaised,
          borderColor: p.line,
          borderWidth: Stroke[2],
          borderRadius: Radius.pill,
          boxShadow: focused ? `0px 0px 0px 4px ${p.grapeSoft}, ${shadowPop(p.line)}` : shadowPop(p.line),
        }}>
        <SearchIcon color={p.ink} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={`Search for a word in ${language.name} or English`}
          placeholder={`Type a ${language.name} or English word`}
          placeholderTextColor={p.inkMuted}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          autoFocus
          returnKeyType="search"
          style={{ flex: 1, minWidth: 0, height: '100%', padding: 0, color: p.ink, fontFamily: Font.display500, fontSize: 19 }}
        />
        {query.length > 0 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            hitSlop={4}
            onPress={() => setQuery('')}
            style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: p.grapeSoft, borderRadius: Radius.pill }}>
            <CloseIcon color={p.ink} size={14} />
          </Pressable>
        )}
      </View>

      {locked ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: Space[3], backgroundColor: p.sunshineSoft, borderColor: p.line, borderWidth: Stroke[1], borderRadius: Radius.md }}>
          <View style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: p.leaf, borderColor: p.line, borderWidth: Stroke[1], borderRadius: Radius.pill }}>
            <CheckIcon color={p.onBright} size={14} />
          </View>
          <Txt variant="label" color={p.onBright} accessibilityLiveRegion="polite" style={{ flex: 1 }}>
            You&apos;ve added today&apos;s word. Come back tomorrow for another.
          </Txt>
        </View>
      ) : (
        canAddToday && (
          <Txt variant="label" color={p.inkMuted} style={{ paddingHorizontal: Space[1], marginTop: -Space[1] }}>
            1 word to add today
          </Txt>
        )
      )}

      <View style={{ flex: 1, gap: 10 }}>
        {listTitle !== '' && (
          <Txt variant="caption" accessibilityLiveRegion="polite" color={p.onBrightMuted} style={{ paddingHorizontal: Space[1], fontFamily: Font.body900 }}>
            {listTitle}
          </Txt>
        )}
        {addError && (
          <Txt variant="label" color={p.ink} style={{ paddingHorizontal: Space[1] }}>
            {addError}
          </Txt>
        )}
        <FlatList
          data={results}
          keyExtractor={(w) => w.id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          style={{ marginHorizontal: -Space[4] }}
          contentContainerStyle={{ paddingHorizontal: Space[4], paddingBottom: insets.bottom + Space[8] }}
          ListEmptyComponent={
            current?.error ? (
              <Empty title="Couldn't load words" body={current.error} />
            ) : !q ? undefined : !current ? (
              <ActivityIndicator color={p.ink} style={{ padding: Space[6] }} />
            ) : (
              <Empty title="No matches yet" body="Check the spelling or try the English meaning." />
            )
          }
          renderItem={({ item: w, index }) => {
            const isOwned = owned.has(w.id);
            const article = w.word.match(/^(el|la|los|las) /i)?.[1];
            const first = index === 0;
            const last = index === results.length - 1;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  isOwned ? `${w.word}, ${w.meaning}, already in your words` : locked ? `${w.word}, ${w.meaning}. Come back tomorrow to add it` : `Add ${w.word}, ${w.meaning}`
                }
                accessibilityState={{ disabled: isOwned || locked, busy: adding === w.id }}
                disabled={isOwned || locked || !!adding}
                onPress={() => addWord(w)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: Space[3],
                  minHeight: 60,
                  paddingHorizontal: Space[4],
                  paddingVertical: 10,
                  backgroundColor: pressed ? p.surface : p.surfaceRaised,
                  borderColor: p.line,
                  borderLeftWidth: Stroke[2],
                  borderRightWidth: Stroke[2],
                  borderTopWidth: first ? Stroke[2] : 0,
                  borderBottomWidth: last ? Stroke[2] : 0,
                  borderTopLeftRadius: first ? Radius.md : 0,
                  borderTopRightRadius: first ? Radius.md : 0,
                  borderBottomLeftRadius: last ? Radius.md : 0,
                  borderBottomRightRadius: last ? Radius.md : 0,
                })}>
                {!first && <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: Stroke[1], backgroundColor: p.surfaceSunken }} />}
                <View style={{ flex: 11, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: 5 }}>
                  {article && (
                    <Txt color={p.inkMuted} style={{ fontFamily: Font.display500, fontSize: 15, lineHeight: 20 }}>
                      {article}
                    </Txt>
                  )}
                  <Txt style={{ flexShrink: 1, fontFamily: Font.display600, fontSize: 19, lineHeight: 24 }}>{bareWord(w.word)}</Txt>
                </View>
                <Txt color={p.onBrightMuted} style={{ flex: 9, fontFamily: Font.body800, fontSize: 15, lineHeight: 20 }}>
                  {w.meaning.replace(/^the /, '')}
                </Txt>
                <View style={{ width: 60, alignItems: 'flex-end' }}>
                  {adding === w.id ? (
                    <ActivityIndicator color={p.ink} />
                  ) : isOwned ? (
                    <View style={[pill(p.line), { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: p.leafSoft }]}>
                      <CheckIcon color={p.ink} size={11} />
                      <Txt style={pillText}>Added</Txt>
                    </View>
                  ) : (
                    <View style={[pill(p.line), { backgroundColor: typeFill[w.type] }]}>
                      <Txt style={pillText}>{w.type === 'Adjective' ? 'Adj.' : w.type}</Txt>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          }}
        />
      </View>
      {streak.streakPopup && <StreakPopup reason={streak.streakPopup} streak={streak.streak} onClose={streak.closeStreakPopup} />}
    </Screen>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  const p = usePalette();
  return (
    <View style={{ paddingVertical: Space[6], paddingHorizontal: Space[4], alignItems: 'center', gap: 6 }}>
      <Txt style={{ fontFamily: Font.display600, fontSize: 20, lineHeight: 26, textAlign: 'center' }}>{title}</Txt>
      <Txt color={p.onBrightMuted} style={{ fontFamily: Font.body700, fontSize: 15, lineHeight: 20, textAlign: 'center' }}>
        {body}
      </Txt>
    </View>
  );
}

function pill(line: string) {
  return { paddingHorizontal: 7, paddingVertical: 1, borderColor: line, borderWidth: Stroke[1], borderRadius: Radius.pill };
}

const pillText = { fontFamily: Font.body900, fontSize: 11, lineHeight: 15 };

/** Lower case without accents, so "arbol" finds "árbol". */
function normalize(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/** Matches the start of the word (with or without its article) or of the English meaning (with or without "to"/"the"). */
function matches(w: Word, q: string) {
  const meaning = normalize(w.meaning);
  return [normalize(w.word), normalize(bareWord(w.word)), meaning, meaning.replace(/^(to|the|a|an) /, '')].some((s) => s.startsWith(q));
}
