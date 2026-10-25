import { View } from 'react-native';
import Animated, { Easing, ZoomIn } from 'react-native-reanimated';

import { CheckIcon } from '@/components/icons';
import { Txt } from '@/components/text';
import type { StreakDay } from '@/state/streak';
import { Font } from '@/theme/fonts';
import { Bounce, Radius, Stroke } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';

const DayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const StatusLabels = { done: 'streak kept', missed: 'missed', pending: 'today, not done yet' } as const;

/** The weekday of a server date (`YYYY-MM-DD`), read in UTC so the device's timezone can't shift it. */
function dayName(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  return DayNames[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

type Props = {
  /** Oldest first, ending with today. Empty while loading, which shows blank dots. */
  days: StreakDay[];
  size?: number;
  /** Pops today's dot in, for the moment the streak is saved. */
  popToday?: boolean;
};

/** The last 7 days as dots: done is tangerine with a check, missed is `locked`, today before it's done is an empty outline. */
export function StreakDays({ days, size = 32, popToday = false }: Props) {
  const p = usePalette();
  const items: (StreakDay | null)[] = days.length > 0 ? days : Array(7).fill(null);

  return (
    <View accessibilityLabel="Last 7 days" style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {items.map((day, i) => {
        const isToday = i === items.length - 1;
        const name = day ? dayName(day.date) : null;
        const status = day?.status;
        const dot = (
          <View
            style={{
              width: size,
              height: size,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: status === 'done' ? p.tangerine : status === 'missed' ? p.locked : 'transparent',
              borderColor: p.line,
              borderWidth: Stroke[2],
              borderStyle: status === 'pending' ? 'dashed' : 'solid',
              borderRadius: Radius.pill,
              opacity: day ? 1 : 0.3,
            }}>
            {status === 'done' && <CheckIcon color={p.onBright} size={Math.round(size * 0.5)} />}
          </View>
        );
        return (
          <View
            key={day?.date ?? i}
            accessible
            accessibilityLabel={name && status ? `${isToday ? 'Today' : name}: ${StatusLabels[status]}` : 'Loading'}
            style={{ flex: 1, alignItems: 'center', gap: 6 }}>
            <Txt variant="caption" color={p.onBrightMuted} style={{ fontFamily: Font.body900 }}>
              {name ? name[0] : ' '}
            </Txt>
            {isToday && popToday ? <Animated.View entering={ZoomIn.duration(380).easing(Easing.bezier(...Bounce).factory())}>{dot}</Animated.View> : dot}
          </View>
        );
      })}
    </View>
  );
}
