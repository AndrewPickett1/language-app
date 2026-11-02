import { useState, type ComponentType, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import type { MascotPose } from '@/components/art/lotto-mascot';
import { ChevronIcon } from '@/components/icons';
import { ModuleDone } from '@/components/lesson/module-done';
import { MascotPrompt } from '@/components/lesson/shared';
import { Screen, ScreenHeader } from '@/components/screen';
import { StreakPopup } from '@/components/streak-popup';
import { PillButton, RoundButton } from '@/components/sticker';
import { Txt } from '@/components/text';
import { useStreak } from '@/state/streak';
import { Font } from '@/theme/fonts';
import { Radius, Stroke } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';
import { useFinishModule, type Lesson } from '@/utils/modules';

/** One screen of a slide lesson. */
export type Slide = {
  /** Lotto's line at the top. A slide without one (the closing slide) fills the whole screen with `Body`. */
  say?: ReactNode;
  pose?: MascotPose;
  title?: string;
  Body: ComponentType;
};

type Props = {
  lesson: Lesson;
  slides: Slide[];
  /** The last slide's button. */
  finishLabel?: string;
};

/**
 * A Lesson module: Lotto walks through a concept one slide at a time, with Back and Next. Nothing is
 * asked, so finishing records the module with no score.
 */
export function ConceptLesson({ lesson, slides, finishLabel = 'Finish' }: Props) {
  const p = usePalette();
  const streak = useStreak();
  const { finish, earnedPull } = useFinishModule(lesson.id);
  const [index, setIndex] = useState(0);

  if (index >= slides.length) {
    return (
      <>
        <ModuleDone unit={lesson.unit} title={lesson.title} lesson={{ description: lesson.description }} words={[]} bestCombo={0} accuracy={null} earnedPull={earnedPull} />
        {streak.streakPopup && <StreakPopup reason={streak.streakPopup} streak={streak.streak} onClose={streak.closeStreakPopup} />}
      </>
    );
  }

  const slide = slides[index];
  const last = index === slides.length - 1;
  const next = () => {
    if (last) finish(null);
    setIndex(index + 1);
  };

  return (
    <Screen style={{ gap: 14 }}>
      <ScreenHeader
        kind="close"
        backLabel="Quit lesson"
        fallback="/level-map"
        center={
          <View
            accessibilityRole="progressbar"
            accessibilityLabel="Lesson progress"
            accessibilityValue={{ min: 0, max: slides.length, now: index + 1 }}
            style={{ flex: 1, height: 22, padding: 3, backgroundColor: p.surfaceSunken, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.pill }}>
            <View style={{ height: '100%', width: `${((index + 1) / slides.length) * 100}%`, minWidth: 10, backgroundColor: p.grape, borderRadius: Radius.pill }} />
          </View>
        }
        trailing={<LessonChip />}
      />

      {slide.say !== undefined && <MascotPrompt text={slide.say} pose={slide.pose} mascotWidth={76} />}
      {slide.title && (
        <Txt variant="title" accessibilityRole="header">
          {slide.title}
        </Txt>
      )}

      {/* Slides are laid out to fit the screen, so they don't scroll. */}
      <Animated.View key={index} entering={FadeIn.duration(220)} style={{ flex: 1, minHeight: 0, justifyContent: 'center' }}>
        <slide.Body />
      </Animated.View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <RoundButton
          accessibilityLabel="Back"
          size={56}
          disabled={index === 0}
          onPress={() => setIndex(index - 1)}
          style={index === 0 ? { opacity: 0.4 } : undefined}>
          <ChevronIcon color={p.ink} />
        </RoundButton>
        <PillButton label={last ? finishLabel : 'Next'} fill={p.pink} style={{ flex: 1, minHeight: 56 }} onPress={next} />
      </View>
    </Screen>
  );
}

function LessonChip() {
  const p = usePalette();
  return (
    <View style={{ paddingVertical: 3, paddingHorizontal: 10, backgroundColor: p.grapeSoft, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.pill }}>
      <Txt variant="caption" color={p.onBright} style={{ fontFamily: Font.body900 }}>
        Lesson
      </Txt>
    </View>
  );
}
