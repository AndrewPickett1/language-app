import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, ZoomIn } from 'react-native-reanimated';

import { MascotPrompt } from '@/components/lesson/shared';
import { speak } from '@/components/speak-button';
import { PillButton } from '@/components/sticker';
import { WordCard } from '@/components/word-card';
import { gloss, lowerFirst, type LessonWord } from '@/data/lesson';
import { useLanguage } from '@/state/language';
import { Bounce } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';

/** A verb lesson opens on the verb's word card, so the learner sees its whole conjugation table first. */
export function VerbIntro({ verb, onDone }: { verb: LessonWord; onDone: () => void }) {
  const p = usePalette();
  const { language } = useLanguage();

  useEffect(() => {
    speak(lowerFirst(verb.word), language.locale);
  }, [verb.word, language.locale]);

  return (
    <>
      <MascotPrompt text={`Meet ${lowerFirst(verb.word)}, ${gloss(verb).toLowerCase()}! Each pronoun gets its own form.`} pose="point" />

      <View style={{ flex: 1, minHeight: 0 }}>
        <Animated.View entering={ZoomIn.duration(520).easing(Easing.bezier(...Bounce).factory())} style={{ flex: 1, minHeight: 0 }}>
          <WordCard word={verb} leading={null} style={{ flex: 1, minHeight: 0 }} />
        </Animated.View>
      </View>

      <PillButton label="Got it" fill={p.pink} onPress={onDone} style={{ minHeight: 56 }} />
    </>
  );
}
