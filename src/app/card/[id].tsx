import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { ChevronIcon, StatsIcon, WordIcon } from '@/components/icons';
import { WordStatsCard } from '@/components/mastery/word-stats-card';
import { Screen, ScreenHeader, goBack } from '@/components/screen';
import { RoundButton, Sticker } from '@/components/sticker';
import { Txt } from '@/components/text';
import { WordCard } from '@/components/word-card';
import { RarityInfo } from '@/data/rarity';
import type { Word } from '@/data/words';
import { useMyWords } from '@/state/my-words';
import { Space } from '@/theme/tokens';
import { usePalette } from '@/theme/use-palette';
import { progressFor } from '@/utils/word-progress';

type Role = 'prev' | 'current' | 'next';
/** The word side of the card, or its stats on the back. */
type Side = 'word' | 'stats';

/** A card opens on its word, or on its stats with `side=stats` (from My words). Every card in the deck shows the same side. */
export default function WordCardScreen() {
  const p = usePalette();
  const { id, side: startSide } = useLocalSearchParams<{ id: string; side?: string }>();
  const { words, loading } = useMyWords();
  const index = words.findIndex((w) => w.id === id);
  const prev = index > 0 ? words[index - 1] : undefined;
  const next = index >= 0 ? words[index + 1] : undefined;
  const flip = useCardFlip(id, prev?.id, next?.id, (to) => router.setParams({ id: to }));
  const turn = useCardTurn(startSide === 'stats' ? 'stats' : 'word');

  const word = words[index];
  if (!word) {
    return (
      <Screen>
        <ScreenHeader backLabel="Back to my words" fallback="/words" title="Word card" />
        <Txt variant="bodyLg">{loading ? 'Loading…' : "We couldn't find that word."}</Txt>
      </Screen>
    );
  }

  const info = RarityInfo[word.rarity];
  // Keyed by word, so a card carries on as the top card once it has landed or been revealed.
  // Stacked like a real deck: the previous card under this one, the next card above it.
  const stack: { word: Word; role: Role }[] = [
    ...(prev ? [{ word: prev, role: 'prev' as const }] : []),
    { word, role: 'current' },
    ...(next ? [{ word: next, role: 'next' as const }] : []),
  ];

  return (
    <Screen background={p[info.soft]}>
      {/* Fits the screen, no scrolling: the card's art takes whatever height is left. */}
      <GestureDetector gesture={flip.pan}>
        <View style={{ flex: 1, minHeight: 0 }}>
          {stack.map((c) => (
            <StackedCard key={c.word.id} word={c.word} role={c.role} flip={flip} turn={turn} />
          ))}
        </View>
      </GestureDetector>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space[3], paddingBottom: Space[1] }}>
        <NavButton label="Previous word" direction="left" disabled={!prev} onPress={flip.toPrev} />
        <NavButton label="Next word" direction="right" disabled={!next} onPress={flip.toNext} />
      </View>
    </Screen>
  );
}

/** The card a drag started on and its neighbours at that moment. */
type Anchor = { id: string; prevId?: string; nextId?: string };
type FlipValues = { toss: SharedValue<number>; anchor: SharedValue<Anchor | null>; span: number };

/** Off to the right by `x` (a share of `span`), tilted the way a tossed card falls. */
function offRight(x: number, span: number) {
  'worklet';
  return { opacity: 1, transform: [{ translateX: x * span }, { rotate: `${x * 14}deg` }, { translateY: 0 }, { scale: 1 }] };
}

/** Sunk into the deck: at 0 it sits lower and smaller, hidden under the top card; at 1 it's at rest. */
function inDeck(progress: number, opacity = 1) {
  'worklet';
  return { opacity, transform: [{ translateX: 0 }, { rotate: '0deg' }, { translateY: (1 - progress) * 18 }, { scale: 0.93 + 0.07 * progress }] };
}

/**
 * One card in the deck. Going back, the top card is tossed off to the right and the previous
 * card underneath grows into place. Going forward, the next card is pulled in from the right
 * on top, and the card it covers sinks back into the deck.
 */
function StackedCard({ word, role, flip, turn }: { word: Word; role: Role; flip: FlipValues; turn: CardTurn }) {
  const { progress } = useMyWords();
  const { toss, anchor, span } = flip;
  const id = word.id;

  const style = useAnimatedStyle(() => {
    const t = toss.get();
    const a = anchor.get();
    // Matched against the anchor rather than by role: just after the swap, every card keeps the
    // spot it ended the move in until the toss is reset, so nothing jumps.
    if (a && t !== 0) {
      if (id === a.id) {
        if (t > 0) return offRight(t, span);
        // No next card: a little nudge left, as resistance.
        return a.nextId ? inDeck(1 + t) : offRight(t, span);
      }
      if (id === a.nextId && t < 0) return offRight(1 + t, span);
      if (id === a.prevId && t > 0) return inDeck(t);
    }
    return role === 'current' ? inDeck(1) : inDeck(0, 0);
  }, [id, role, span]);

  const hidden = role !== 'current';
  return (
    <Animated.View
      pointerEvents={hidden ? 'none' : 'auto'}
      accessibilityElementsHidden={hidden}
      importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}
      style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, paddingBottom: 6, transformOrigin: '50% 100%' }, style]}>
      <Animated.View style={[{ flex: 1, minHeight: 0 }, turn.style]}>
        {turn.side === 'stats' ? (
          <WordStatsCard
            word={word}
            progress={progressFor(progress, word.id)}
            style={{ flex: 1, minHeight: 0 }}
            leading={<BackButton />}
            trailing={<TurnButton to="word" onPress={turn.toggle} />}
          />
        ) : (
          <WordCard word={word} style={{ flex: 1, minHeight: 0 }} leading={<BackButton />} trailing={<TurnButton to="stats" onPress={turn.toggle} />} />
        )}
      </Animated.View>
    </Animated.View>
  );
}

function BackButton() {
  const p = usePalette();
  return (
    <RoundButton accessibilityLabel="Back to my words" fill={p.paper} size={44} lift={3} onPress={() => goBack('/words')}>
      <ChevronIcon color={p.onBright} />
    </RoundButton>
  );
}

/** Flips the card over, to its stats or back to the word. */
function TurnButton({ to, onPress }: { to: Side; onPress: () => void }) {
  const p = usePalette();
  return (
    <Sticker
      accessibilityRole="button"
      accessibilityLabel={to === 'stats' ? 'Show stats' : 'Show the word'}
      accessibilityHint={to === 'stats' ? 'Flips the card to how well you know it' : 'Flips the card back to the word'}
      fill={p.sunshine}
      lift={3}
      onPress={onPress}
      style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
      {to === 'stats' ? <StatsIcon color={p.onBright} size={20} /> : <WordIcon color={p.onBright} size={22} />}
    </Sticker>
  );
}

const TurnMs = 160;

type CardTurn = { side: Side; toggle: () => void; style: ReturnType<typeof useAnimatedStyle> };

/**
 * Which side the cards show, and the flip between them: the card narrows to its edge, swaps sides and
 * opens again. Reduced motion swaps straight away.
 */
function useCardTurn(start: Side): CardTurn {
  const reduce = useReducedMotion();
  const [side, setSide] = useState<Side>(start);
  /** 1 face on, 0 edge on. */
  const open = useSharedValue(1);
  const busy = useSharedValue(false);

  // Once the other side is showing, open the card back up.
  useEffect(() => {
    if (!busy.get()) return;
    open.set(withTiming(1, { duration: TurnMs, easing: Easing.out(Easing.quad) }, () => busy.set(false)));
  }, [side, open, busy]);

  const toggle = () => {
    const to: Side = side === 'word' ? 'stats' : 'word';
    if (reduce) return setSide(to);
    if (busy.get()) return;
    busy.set(true);
    open.set(
      withTiming(0, { duration: TurnMs, easing: Easing.in(Easing.quad) }, (finished) => {
        if (finished) scheduleOnRN(setSide, to);
      })
    );
  };

  const style = useAnimatedStyle(() => ({ transform: [{ scaleX: Math.max(0.02, open.get()) }] }));
  return { side, toggle, style };
}

const OutMs = 220;
/** How far (as a share of screen width) or how fast (px/s) a swipe must go to turn the card. */
const SwipeDistance = 0.28;
const SwipeVelocity = 800;

/**
 * Swiping or pressing previous/next moves through the deck like real cards. Swipe left (or
 * press next) to pull the next card in from the right; swipe right (or press previous) to toss
 * this card off to the right and reveal the previous one. While dragging, the moving card
 * follows the finger; a short drag springs back, and dragging toward a missing neighbour only
 * gives a little. Input during a move is ignored.
 */
function useCardFlip(id: string, prevId: string | undefined, nextId: string | undefined, open: (id: string) => void) {
  const { width } = useWindowDimensions();
  const span = width * 1.2;
  /** -1 next card pulled fully in, 0 resting, 1 this card tossed off; fractional while dragging. */
  const toss = useSharedValue(0);
  const anchor = useSharedValue<Anchor | null>(null);
  const busy = useSharedValue(false);
  /** Set once the move has finished and the new word has been asked for. */
  const swapped = useSharedValue(false);

  // Once the new word is the top card, the deck settles back to rest around it.
  useEffect(() => {
    if (!swapped.get()) return;
    swapped.set(false);
    toss.set(0);
    anchor.set(null);
    busy.set(false);
  }, [id, toss, anchor, busy, swapped]);

  /** Pulls in the next word (dir -1) or tosses off to the previous one (dir 1). Runs on the UI thread. */
  const tossOut = (dir: 1 | -1) => {
    'worklet';
    const to = dir < 0 ? nextId : prevId;
    if (!to) return;
    busy.set(true);
    anchor.set({ id, prevId, nextId });
    // A dragged card is already partway there, so it finishes the trip faster.
    const duration = Math.max(120, OutMs * (1 - Math.abs(toss.get())));
    // A tossed card speeds up as it leaves; a pulled-in card slows down as it lands.
    const easing = dir > 0 ? Easing.bezier(0.5, 0, 0.9, 0.5) : Easing.bezier(0.1, 0.5, 0.5, 1);
    toss.set(
      withTiming(dir, { duration, easing }, (finished) => {
        if (!finished) return;
        swapped.set(true);
        scheduleOnRN(open, to);
      })
    );
  };

  const press = (dir: 1 | -1) => {
    if (!busy.get()) tossOut(dir);
  };

  const pan = Gesture.Pan()
    // Horizontal drags only, so taps on the buttons inside the card still land.
    .activeOffsetX([-12, 12])
    .failOffsetY([-16, 16])
    .onUpdate((e) => {
      if (busy.get()) return;
      const hasNeighbour = e.translationX < 0 ? !!nextId : !!prevId;
      anchor.set({ id, prevId, nextId });
      toss.set((e.translationX * (hasNeighbour ? 1 : 0.2)) / span);
    })
    .onEnd((e) => {
      if (busy.get()) return;
      const dir = e.translationX < 0 ? -1 : 1;
      const hasNeighbour = dir < 0 ? !!nextId : !!prevId;
      const far = Math.abs(e.translationX) > width * SwipeDistance;
      const flung = Math.abs(e.velocityX) > SwipeVelocity && Math.sign(e.velocityX) === dir;
      if (hasNeighbour && (far || flung)) tossOut(dir);
      else toss.set(withSpring(0, { damping: 16, stiffness: 220 }));
    });

  return { toss, anchor, span, pan, toNext: () => press(-1), toPrev: () => press(1) };
}

function NavButton({
  label,
  direction,
  disabled,
  onPress,
}: {
  label: string;
  direction: 'left' | 'right';
  disabled: boolean;
  onPress: () => void;
}) {
  const p = usePalette();
  return (
    <Sticker
      accessibilityRole="button"
      accessibilityLabel={label}
      fill={p.surfaceRaised}
      disabled={disabled}
      onPress={onPress}
      style={{ flex: 1, height: 56, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.5 : 1 }}>
      <ChevronIcon color={p.ink} size={22} direction={direction} />
    </Sticker>
  );
}
