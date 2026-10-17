import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View, type StyleProp, type TextStyle } from 'react-native';

import { LottoMascot } from '@/components/art/lotto-mascot';
import { CheckIcon, Flag } from '@/components/icons';
import { Screen, ScreenHeader, goBack } from '@/components/screen';
import { Sticker } from '@/components/sticker';
import { Txt } from '@/components/text';
import { Languages, type Language } from '@/data/languages';
import { useLanguage } from '@/state/language';
import { useMyWords } from '@/state/my-words';
import { Font } from '@/theme/fonts';
import { Radius, Space, Stroke } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';
import { supabase } from '@/utils/supabase';

const DangerText = '#c42f2f';

/**
 * Loads the languages listed in the Supabase `language` table. The table only holds names, so each
 * row is matched by name to `Languages` for its code, flag and TTS locale. Unknown names are skipped.
 */
function useLanguageList() {
  const [languages, setLanguages] = useState<Language[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('language')
      .select('name')
      .order('id')
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setError(error.message);
          return;
        }
        const names = (data as { name: string }[]).map((row) => row.name.trim().toLowerCase());
        setLanguages(names.flatMap((name) => Languages.find((l) => l.name.toLowerCase() === name) ?? []));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { languages, error };
}

export default function LanguageScreen() {
  const p = usePalette();
  const { language, setLanguage, started } = useLanguage();
  const { words } = useMyWords();
  const { languages, error } = useLanguageList();

  const others = languages?.filter((l) => l.code !== language.code) ?? [];
  const before = others.filter((l) => started.includes(l.code));
  const fresh = others.filter((l) => !started.includes(l.code));

  const pick = (l: Language) => {
    setLanguage(l.code);
    goBack('/');
  };

  return (
    <Screen style={{ gap: 14, paddingBottom: 0 }} edges={['top', 'left', 'right']}>
      <ScreenHeader
        kind="close"
        backLabel="Close"
        center={
          <Txt variant="title" accessibilityRole="header" style={{ flex: 1, fontSize: 30, lineHeight: 34 }}>
            Choose a language
          </Txt>
        }
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <LottoMascot line={p.line} width={92} pose="wave" />
        <SpeechBubble text="Which words should we pull next?" />
      </View>

      <ScrollView
        style={{ flex: 1, marginHorizontal: -Space[4] }}
        contentContainerStyle={{ gap: 10, paddingHorizontal: Space[4], paddingTop: Space[1], paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>
        <SectionLabel>Learning now</SectionLabel>
        <LanguageRow
          language={language}
          detail={`${language.native} · ${words.length} words`}
          badge={{ label: 'Current', fill: p.tangerine }}
          selected
          accessibilityLabel={`Keep learning ${language.name}`}
          onPress={() => pick(language)}
        />

        {error ? (
          <Txt accessibilityRole="alert" color={DangerText} style={{ fontFamily: Font.body800, textAlign: 'center' }}>
            {`Couldn’t load languages. ${error}`}
          </Txt>
        ) : !languages ? (
          <ActivityIndicator color={p.inkMuted} style={{ marginTop: Space[4] }} />
        ) : null}

        {before.length > 0 && <SectionLabel style={{ marginTop: Space[2] }}>Picked before</SectionLabel>}
        {before.map((l) => (
          <LanguageRow
            key={l.code}
            language={l}
            detail={l.native}
            badge={{ label: 'Started', fill: p.leafSoft }}
            accessibilityLabel={`Switch back to ${l.name}, started before`}
            onPress={() => pick(l)}
          />
        ))}

        {fresh.length > 0 && <SectionLabel style={{ marginTop: Space[2] }}>New to you</SectionLabel>}
        {fresh.map((l) => (
          <LanguageRow
            key={l.code}
            language={l}
            detail={l.native}
            badge={{ label: 'New', fill: p.skySoft }}
            accessibilityLabel={`Start learning ${l.name}, new`}
            onPress={() => pick(l)}
          />
        ))}
      </ScrollView>
    </Screen>
  );
}

function SpeechBubble({ text }: { text: string }) {
  const p = usePalette();
  return (
    <View
      style={{
        flex: 1,
        paddingVertical: Space[3],
        paddingHorizontal: 14,
        backgroundColor: p.surfaceRaised,
        borderColor: p.line,
        borderWidth: Stroke[2],
        borderRadius: Radius.md,
      }}>
      {/* The tail: a square with two borders, turned to point at Lotto. */}
      <View
        style={{
          position: 'absolute',
          left: -9,
          top: '50%',
          width: 14,
          height: 14,
          marginTop: -7,
          backgroundColor: p.surfaceRaised,
          borderColor: p.line,
          borderLeftWidth: Stroke[2],
          borderBottomWidth: Stroke[2],
          borderBottomLeftRadius: 4,
          transform: [{ rotate: '45deg' }],
        }}
      />
      <Txt style={{ fontFamily: Font.body800, fontSize: 16, lineHeight: 22 }}>{text}</Txt>
    </View>
  );
}

function SectionLabel({ children, style }: { children: string; style?: StyleProp<TextStyle> }) {
  const p = usePalette();
  return (
    <Txt variant="caption" accessibilityRole="header" color={p.inkMuted} style={[{ fontFamily: Font.body900 }, style]}>
      {children}
    </Txt>
  );
}

type RowProps = {
  language: Language;
  detail: string;
  badge?: { label: string; fill: string };
  selected?: boolean;
  accessibilityLabel: string;
  onPress?: () => void;
  disabled?: boolean;
};

function LanguageRow({ language, detail, badge, selected = false, accessibilityLabel, onPress, disabled }: RowProps) {
  const p = usePalette();
  return (
    <Sticker
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected, disabled }}
      fill={selected ? p.sunshineSoft : p.surfaceRaised}
      radius={22}
      onPress={onPress}
      disabled={disabled}
      style={{ minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: Space[3], paddingVertical: 10, paddingLeft: Space[3], paddingRight: 14 }}>
      <Flag code={language.code} line={p.line} size={42} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt color={p.onBright} style={{ fontFamily: Font.display600, fontSize: 20, lineHeight: 24 }}>
          {language.name}
        </Txt>
        <Txt color={p.onBrightMuted} style={{ fontFamily: Font.body800, fontSize: 13, lineHeight: 18 }}>
          {detail}
        </Txt>
      </View>
      {badge && (
        <View style={{ paddingHorizontal: 9, paddingVertical: 2, backgroundColor: badge.fill, borderColor: p.line, borderWidth: Stroke[1], borderRadius: Radius.pill }}>
          <Txt variant="caption" color={p.onBright} style={{ fontFamily: Font.body900, fontSize: 11, lineHeight: 15, letterSpacing: 0.66 }}>
            {badge.label}
          </Txt>
        </View>
      )}
      {!disabled && (
        <View
          style={{
            width: 28,
            height: 28,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: selected ? p.leaf : p.surfaceRaised,
            borderColor: p.line,
            borderWidth: Stroke[2],
            borderRadius: Radius.pill,
          }}>
          {selected && <CheckIcon color={p.onBright} size={14} />}
        </View>
      )}
    </Sticker>
  );
}
