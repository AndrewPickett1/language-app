import * as Speech from 'expo-speech';

import { SpeakerIcon } from '@/components/icons';
import { RoundButton } from '@/components/sticker';
import { useLanguage } from '@/state/language';
import { usePalette } from '@/theme/use-palette';

/** Says `text` aloud in `locale`, cutting off anything already being said. */
export function speak(text: string, locale: string) {
  Speech.stop();
  Speech.speak(text, { language: locale, rate: 0.9 });
}

/** Says `text` aloud in the learning language. */
export function SpeakButton({ text }: { text: string }) {
  const p = usePalette();
  const { language } = useLanguage();
  return (
    <RoundButton
      accessibilityLabel={`Hear ${text}`}
      fill={p.sunshine}
      size={44}
      lift={3}
      onPress={() => speak(text, language.locale)}>
      <SpeakerIcon color={p.onBright} fill={p.paper} />
    </RoundButton>
  );
}
