import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { Easing, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { Capsule } from '@/components/art/capsule';
import { LottoMascot } from '@/components/art/lotto-mascot';
import { goBack, Screen } from '@/components/screen';
import { Panel, PillButton } from '@/components/sticker';
import { Txt } from '@/components/text';
import { display, type LessonWord } from '@/data/lesson';
import { RarityInfo } from '@/data/rarity';
import { Font } from '@/theme/fonts';
import { Radius, Space, Stroke } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';

type Props = {
  unit: number;
  title: string;
  words: LessonWord[];
  bestCombo: number;
  /** 0–100, or null when nothing was asked. */
  accuracy: number | null;
  /** True once the server has granted a pull for finishing. */
  earnedPull: boolean;
};

/** One big moment. Stats never count mistakes. A granted pull shows the capsule; otherwise just Keep going. */
export function ModuleDone({ unit, title, words, bestCombo, accuracy, earnedPull }: Props) {
  const p = usePalette();
  const jump = useSharedValue(0);
  const jumpStyle = useAnimatedStyle(() => ({ transform: [{ translateY: jump.get() }] }));

  useEffect(() => {
    jump.set(withRepeat(withSequence(withTiming(-18, { duration: 320, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 320, easing: Easing.in(Easing.quad) })), -1));
  }, [jump]);

  const stats = [
    { value: String(words.length), label: 'words' },
    { value: `×${bestCombo}`, label: 'best combo' },
    { value: accuracy === null ? '—' : `${accuracy}%`, label: 'accuracy' },
  ];

  return (
    <Screen background={p.grapeSoft} style={{ alignItems: 'center', gap: 18, paddingTop: Space[6] }}>
      <Txt variant="caption" style={{ textAlign: 'center' }}>
        Level {unit} · {title}
      </Txt>
      <Txt variant="displayXl" accessibilityRole="header" style={{ textAlign: 'center' }}>
        Module done!
      </Txt>

      <Animated.View style={jumpStyle}>
        <LottoMascot line={p.line} width={150} pose="cheer" />
      </Animated.View>

      <View style={{ alignSelf: 'stretch', flexDirection: 'row', gap: 10 }}>
        {stats.map((s, i) => (
          <Animated.View key={s.label} entering={FadeInDown.delay(150 + i * 120).duration(300)} style={{ flex: 1 }}>
            <Panel fill={p.white} radius={20} style={{ alignItems: 'center', gap: 2, paddingVertical: 12, paddingHorizontal: 6 }}>
              <Txt style={{ fontFamily: Font.display600, fontSize: 28, lineHeight: 32 }}>{s.value}</Txt>
              <Txt variant="label">{s.label}</Txt>
            </Panel>
          </Animated.View>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityLabel="Words practised" style={{ alignSelf: 'stretch', flexGrow: 0 }} contentContainerStyle={{ gap: Space[2], paddingVertical: 4, paddingHorizontal: 2 }}>
        {words.map((w) => (
          <View
            key={w.id}
            style={{ width: 88, padding: 4, backgroundColor: RarityInfo[w.rarity].color, borderColor: p.line, borderWidth: Stroke[2], borderRadius: 14, boxShadow: `0 3px 0 ${p.line}` }}>
            <View style={{ height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: p.paper, borderColor: p.line, borderWidth: Stroke[1], borderRadius: 9 }}>
              <Capsule color={RarityInfo[w.rarity].color} line={p.line} size={30} shine={false} stroke={3} />
            </View>
            <View style={{ marginTop: 4, paddingVertical: 4, paddingHorizontal: 2, backgroundColor: p.paper, borderColor: p.line, borderWidth: Stroke[1], borderRadius: 8 }}>
              <Txt color={p.onBright} numberOfLines={1} adjustsFontSizeToFit style={{ fontFamily: Font.display600, fontSize: 13, lineHeight: 16, textAlign: 'center' }}>
                {display(w)}
              </Txt>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={{ flex: 1 }} />

      {earnedPull ? (
        <>
          <Animated.View entering={FadeInDown.duration(300)} style={{ alignSelf: 'stretch' }}>
            <Panel fill={p.sunshineSoft} radius={Radius.lg} lift={0} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 }}>
              <Capsule color={p.pink} line={p.line} size={56} />
              <View style={{ flex: 1 }}>
                <Txt style={{ fontFamily: Font.display600, fontSize: 20, lineHeight: 24 }}>You earned a pull!</Txt>
                <Txt variant="label">For finishing this module.</Txt>
              </View>
            </Panel>
          </Animated.View>
          <PillButton label="Pull a capsule" fill={p.sunshine} style={{ alignSelf: 'stretch', minHeight: 60 }} onPress={() => router.replace('/lotto')} />
          <Pressable accessibilityRole="button" onPress={() => goBack('/level-map')} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: Space[4] }}>
            <Txt variant="body" style={{ fontFamily: Font.body800, textDecorationLine: 'underline' }}>
              Later
            </Txt>
          </Pressable>
        </>
      ) : (
        <PillButton label="Keep going" fill={p.pink} style={{ alignSelf: 'stretch', minHeight: 60 }} onPress={() => goBack('/level-map')} />
      )}
    </Screen>
  );
}
