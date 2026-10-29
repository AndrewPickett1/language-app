import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import type { Feedback } from '@/components/lesson/shared';
import { speak } from '@/components/speak-button';
import { Sticker } from '@/components/sticker';
import { Txt } from '@/components/text';
import { display, gloss, shuffle, type LessonWord } from '@/data/lesson';
import { useLanguage } from '@/state/language';
import { Font } from '@/theme/fonts';
import { Radius, Stroke } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';

type Props = {
  words: LessonWord[];
  /** Each pair tried, right or wrong, for the combo and accuracy. */
  onTry: (right: boolean) => void;
  onDone: (feedback: Feedback) => void;
};

function formatClock(ms: number) {
  const secs = Math.floor(ms / 1000);
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

/** Pill tiles, French on the left and English on the right. Each cleared pair fills a capsule segment. */
export function MatchPairs({ words, onTry, onDone }: Props) {
  const p = usePalette();
  const { language } = useLanguage();
  const [right] = useState(() => shuffle(words));
  const [matched, setMatched] = useState<string[]>([]);
  const [selLeft, setSelLeft] = useState<string | null>(null);
  const [selRight, setSelRight] = useState<string | null>(null);
  const [wrong, setWrong] = useState<{ left: string; right: string } | null>(null);
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(startedAt);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const finished = matched.length === words.length;
  const segments = [p.sunshine, p.tangerine, p.pink, p.grape, p.sky];

  // Count-up clock, no penalty for time. Once the last pair is matched it stops, and the capsule pops.
  useEffect(() => {
    if (!finished) {
      const id = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(id);
    }
    const end = Date.now();
    const stamp = setTimeout(() => setNow(end), 0);
    const pop = setTimeout(() => onDone({ right: true, title: 'Capsule popped!', text: `All ${words.length} pairs in ${formatClock(end - startedAt)}.` }), 500);
    return () => {
      clearTimeout(stamp);
      clearTimeout(pop);
    };
  }, [finished, onDone, words.length, startedAt]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const tryPair = (left: string, rightId: string) => {
    if (left === rightId) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const next = [...matched, left];
      setMatched(next);
      setSelLeft(null);
      setSelRight(null);
      onTry(true);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setWrong({ left, right: rightId });
      onTry(false);
      timers.current.push(
        setTimeout(() => {
          setWrong(null);
          setSelLeft(null);
          setSelRight(null);
        }, 450)
      );
    }
  };

  const pick = (side: 'left' | 'right', id: string) => {
    if (wrong || matched.includes(id)) return;
    Haptics.selectionAsync().catch(() => {});
    if (side === 'left') {
      const w = words.find((x) => x.id === id);
      if (w) speak(display(w), language.locale);
      if (selRight !== null) tryPair(id, selRight);
      else setSelLeft(selLeft === id ? null : id);
    } else if (selLeft !== null) tryPair(selLeft, id);
    else setSelRight(selRight === id ? null : id);
  };

  const tile = (side: 'left' | 'right', w: LessonWord) => {
    const done = matched.includes(w.id);
    const isWrong = wrong?.[side] === w.id;
    const sel = (side === 'left' ? selLeft : selRight) === w.id;
    return (
      <View key={w.id} style={{ opacity: done ? 0.35 : 1 }}>
        <Sticker
          accessibilityRole="button"
          accessibilityState={{ selected: sel, disabled: done }}
          fill={isWrong ? p.cherry : done ? p.leaf : sel ? p.pinkSoft : p.white}
          lift={done ? 0 : 4}
          disabled={done}
          onPress={() => pick(side, w.id)}
          style={{ height: 60, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, transform: [{ translateY: sel && !isWrong ? -3 : 0 }] }}>
          <Txt
            color={p.onBright}
            numberOfLines={1}
            adjustsFontSizeToFit
            style={side === 'left' ? { fontFamily: Font.display600, fontSize: 20, lineHeight: 24 } : { fontFamily: Font.body900, fontSize: 17, lineHeight: 22 }}>
            {side === 'left' ? display(w) : gloss(w)}
          </Txt>
        </Sticker>
      </View>
    );
  };

  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flexShrink: 1 }}>
          <Txt variant="title" accessibilityRole="header">
            Match the pairs
          </Txt>
          <Txt variant="label" color={p.inkMuted} style={{ fontSize: 15, lineHeight: 20 }}>
            Fill the capsule to pop it.
          </Txt>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <View
            accessibilityRole="timer"
            accessibilityLabel={`Time ${formatClock(now - startedAt)}`}
            style={{ paddingVertical: 2, paddingHorizontal: 10, backgroundColor: p.sunshine, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.pill }}>
            <Txt color={p.onBright} style={{ fontFamily: Font.body900, fontSize: 15, lineHeight: 20, fontVariant: ['tabular-nums'] }}>
              {formatClock(now - startedAt)}
            </Txt>
          </View>
          <View
            accessibilityRole="image"
            accessibilityLabel={`${matched.length} of ${words.length} pairs`}
            style={{ flexDirection: 'row', width: 120, height: 34, overflow: 'hidden', backgroundColor: p.surfaceSunken, borderColor: p.line, borderWidth: Stroke[2], borderRadius: Radius.pill }}>
            {words.map((w, i) => (
              <View key={w.id} style={{ flex: 1, borderRightWidth: i < words.length - 1 ? Stroke[1] : 0, borderColor: p.line }}>
                {i < matched.length && <Animated.View entering={FadeIn.duration(250)} style={{ flex: 1, backgroundColor: segments[i % segments.length] }} />}
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={{ flex: 1, minHeight: 0, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View accessibilityLabel="French" style={{ flex: 1, gap: 14 }}>
          {words.map((w) => tile('left', w))}
        </View>
        <View accessibilityLabel="English" style={{ flex: 1, gap: 14 }}>
          {right.map((w) => tile('right', w))}
        </View>
      </View>
    </>
  );
}
