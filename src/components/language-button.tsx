import { router } from 'expo-router';

import { ChevronIcon, Flag } from '@/components/icons';
import { Sticker } from '@/components/sticker';
import { Txt } from '@/components/text';
import { useLanguage } from '@/state/language';
import { Font } from '@/theme/fonts';
import { usePalette } from '@/theme/use-palette';

/** The flag-and-code sticker that opens the language picker. */
export function LanguageButton() {
  const p = usePalette();
  const { language } = useLanguage();
  return (
    <Sticker
      accessibilityRole="button"
      accessibilityLabel={`Learning ${language.name}. Change language`}
      fill={p.surfaceRaised}
      onPress={() => router.push('/language')}
      style={{ height: 48, flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 8, paddingRight: 10 }}>
      <Flag code={language.code} line={p.line} />
      <Txt variant="label" style={{ fontFamily: Font.body900, letterSpacing: 0.84 }}>
        {language.code}
      </Txt>
      <ChevronIcon color={p.ink} size={12} direction="down" />
    </Sticker>
  );
}
