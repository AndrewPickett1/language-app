import Svg, { Circle, ClipPath, Defs, G, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';

import type { LanguageCode } from '@/data/languages';
import { Font } from '@/theme/fonts';

/** Rounded, chunky icons. All take the stroke colour (usually `ink` or `onBright`). */
type IconProps = { color: string; size?: number };

export const StarPoints =
  '12.0,2.3 14.9,8.8 22.0,9.6 16.8,14.3 18.2,21.3 12.0,17.8 5.8,21.3 7.2,14.3 2.0,9.6 9.1,8.8';

export function ChevronIcon({
  color,
  size = 18,
  direction = 'left',
}: IconProps & { direction?: 'left' | 'right' | 'down' }) {
  const d = { left: 'M15 5l-7 7 7 7', right: 'M9 5l7 7-7 7', down: 'M6 9l6 6 6-6' }[direction];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={d} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ArrowIcon({ color, size = 12, direction = 'up' }: IconProps & { direction?: 'up' | 'down' }) {
  const d = direction === 'up' ? 'M12 20V5M6 11l6-6 6 6' : 'M12 4v15M6 13l6 6 6-6';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={d} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CloseIcon({ color, size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6 6l12 12M18 6L6 18" fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" />
    </Svg>
  );
}

export function CheckIcon({ color, size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={color} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Two sliders: opens filters. `knob` fills the slider handles. */
export function FilterIcon({ color, knob, size = 22 }: IconProps & { knob: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 7h9M18 7h2M4 17h3M12 17h8" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={15.5} cy={7} r={2.5} fill={knob} stroke={color} strokeWidth={3} />
      <Circle cx={9.5} cy={17} r={2.5} fill={knob} stroke={color} strokeWidth={3} />
    </Svg>
  );
}

export function SpeakerIcon({ color, fill, size = 22 }: IconProps & { fill: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill={fill} stroke={color} strokeWidth={2.6} strokeLinejoin="round" />
      <Path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" />
    </Svg>
  );
}

export function StarIcon({ color, fill, size = 16 }: IconProps & { fill: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Polygon points={StarPoints} fill={fill} stroke={color} strokeWidth={2.4} strokeLinejoin="round" />
    </Svg>
  );
}

export function ClockIcon({ color, fill, size = 34 }: IconProps & { fill: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 34 34">
      <Circle cx={17} cy={18} r={13} fill={fill} stroke={color} strokeWidth={3} />
      <Path d="M17 11v7l5 3" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M11 3h12" stroke={color} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

export function FlameIcon({ line, size = 80 }: { line: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="2 0 36 40">
      <Path d="M20 3 C24 10 33 14 33 24 C33 32 27 37 20 37 C13 37 7 32 7 24 C7 17 12 14 13 8 C16 12 17 15 19 15 C20 11 19 7 20 3 Z" fill="#ffcb2e" stroke={line} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M20 20 C23 24 26 26 26 30 C26 33 23 35 20 35 C17 35 14 33 14 30 C14 26 18 25 20 20 Z" fill="#fff6e5" stroke={line} strokeWidth={2.5} strokeLinejoin="round" />
    </Svg>
  );
}

const FlagRed = '#e63b3b';
const FlagYellow = '#ffcb2e';
const FlagBlue = '#2f5fd0';
const FlagGreen = '#2fb35a';
const FlagWhite = '#ffffff';

/** Simplified flags on a 30×30 grid, clipped to a circle. */
const FlagArt: Record<LanguageCode, React.JSX.Element> = {
  ES: (
    <>
      <Rect width={30} height={30} fill={FlagRed} />
      <Rect y={8.5} width={30} height={13} fill={FlagYellow} />
    </>
  ),
  FR: (
    <>
      <Rect width={10.5} height={30} fill={FlagBlue} />
      <Rect x={10.5} width={9} height={30} fill={FlagWhite} />
      <Rect x={19.5} width={10.5} height={30} fill={FlagRed} />
    </>
  ),
  DE: (
    <>
      <Rect width={30} height={10.5} fill="#2a1b4a" />
      <Rect y={10.5} width={30} height={9} fill={FlagRed} />
      <Rect y={19.5} width={30} height={10.5} fill={FlagYellow} />
    </>
  ),
  JA: (
    <>
      <Rect width={30} height={30} fill={FlagWhite} />
      <Circle cx={15} cy={15} r={6} fill={FlagRed} />
    </>
  ),
  IT: (
    <>
      <Rect width={10.5} height={30} fill={FlagGreen} />
      <Rect x={10.5} width={9} height={30} fill={FlagWhite} />
      <Rect x={19.5} width={10.5} height={30} fill={FlagRed} />
    </>
  ),
  PT: (
    <>
      <Rect width={12} height={30} fill={FlagGreen} />
      <Rect x={12} width={18} height={30} fill={FlagRed} />
      <Circle cx={12} cy={15} r={5} fill={FlagYellow} />
    </>
  ),
  KO: (
    <>
      <Rect width={30} height={30} fill={FlagWhite} />
      <Path d="M8 15 A7 7 0 0 1 22 15 Z" fill={FlagRed} />
      <Path d="M8 15 A7 7 0 0 0 22 15 Z" fill={FlagBlue} />
    </>
  ),
  ZH: (
    <>
      <Rect width={30} height={30} fill={FlagRed} />
      <G transform="translate(4 4.5) scale(0.5)">
        <Polygon points={StarPoints} fill={FlagYellow} />
      </G>
    </>
  ),
};

/** A language's flag in an outlined circle. The outline stays 3px at any size. */
export function Flag({ code, line, size = 30 }: { code: LanguageCode; line: string; size?: number }) {
  const stroke = (3 * 30) / size;
  const r = 15 - stroke / 2;
  return (
    <Svg width={size} height={size} viewBox="0 0 30 30">
      <Defs>
        <ClipPath id={`flag-${code}`}>
          <Circle cx={15} cy={15} r={r} />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#flag-${code})`}>{FlagArt[code]}</G>
      <Circle cx={15} cy={15} r={r} fill="none" stroke={line} strokeWidth={stroke} />
    </Svg>
  );
}

/** Two fanned cards: the "My words" tile. */
export function CardsIcon({ line }: { line: string }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 3 58 54">
      <Rect x={8} y={9} width={28} height={38} rx={7} fill="#fff6e5" stroke={line} strokeWidth={3} transform="rotate(-10 22 28)" />
      <Rect x={20} y={10} width={28} height={38} rx={7} fill="#a57bff" stroke={line} strokeWidth={3} transform="rotate(8 34 29)" />
      <Rect x={24} y={28} width={20} height={15} rx={4} fill="#fff6e5" stroke={line} strokeWidth={2.5} transform="rotate(8 34 29)" />
    </Svg>
  );
}

/** A ruled flash card with a reward coin: the "Study" tile. The coin pokes past the bottom edge. */
export function StudyIcon({ line }: { line: string }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 3 58 54" style={{ overflow: 'visible' }}>
      <Rect x={3} y={4} width={44} height={44} rx={9} fill="#fff6e5" stroke={line} strokeWidth={3} />
      <Path d="M12 16h26M12 26h26M12 36h15" stroke={line} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={45} cy={45} r={12.5} fill="#ffcb2e" stroke={line} strokeWidth={3} />
      <G transform="translate(37 37.2) scale(0.66)">
        <Polygon points={StarPoints} fill="#fff6e5" stroke={line} strokeWidth={4.2} strokeLinejoin="round" />
      </G>
    </Svg>
  );
}

/** Three capsules and a star, for the Lotto tile. */
export function CapsulesIcon({ line }: { line: string }) {
  const capsule = (cx: number, cy: number, r: number, top: string, shine: { x: number; y: number; w: number; h: number }) => (
    <G>
      <Path d={`M${cx - r},${cy} A${r},${r} 0 0 0 ${cx + r},${cy} Z`} fill="#fff6e5" />
      <Path d={`M${cx - r},${cy} A${r},${r} 0 0 1 ${cx + r},${cy} Z`} fill={top} />
      <Rect x={shine.x} y={shine.y} width={shine.w} height={shine.h} rx={shine.h / 2} fill="#ffffff" transform={`rotate(-30 ${shine.x + shine.w / 2} ${shine.y + shine.h / 2})`} />
      <Path d={`M${cx - r} ${cy}H${cx + r}`} stroke={line} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={cx} cy={cy} r={r} fill="none" stroke={line} strokeWidth={3} />
    </G>
  );
  return (
    <Svg width="100%" height="100%" viewBox="0 3 58 54" style={{ overflow: 'visible' }}>
      {capsule(33, 19, 12.5, '#ffcb2e', { x: 25.5, y: 10, w: 6.2, h: 2.8 })}
      {capsule(19, 37, 14.5, '#2ec4f0', { x: 10.3, y: 26.6, w: 7.2, h: 3.2 })}
      {capsule(42, 40, 12, '#a57bff', { x: 34.8, y: 31.4, w: 6, h: 2.6 })}
      <G transform="translate(46 4) scale(0.5)">
        <Polygon points={StarPoints} fill="#fff6e5" stroke={line} strokeWidth={3.6} strokeLinejoin="round" />
      </G>
    </Svg>
  );
}

export function TrophyIcon({ line }: { line: string }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 3 58 54">
      <Path d="M17 14 C9 14 7 19 8 23 C9 28 14 30 19 30" fill="none" stroke={line} strokeWidth={3.5} strokeLinecap="round" />
      <Path d="M41 14 C49 14 51 19 50 23 C49 28 44 30 39 30" fill="none" stroke={line} strokeWidth={3.5} strokeLinecap="round" />
      <Path d="M16 9 H42 V22 C42 30 36 36 29 36 C22 36 16 30 16 22 Z" fill="#ffcb2e" stroke={line} strokeWidth={3} strokeLinejoin="round" />
      <Rect x={25} y={35} width={8} height={8} fill="#ffcb2e" stroke={line} strokeWidth={3} />
      <Rect x={17} y={42} width={24} height={9} rx={4.5} fill="#fff6e5" stroke={line} strokeWidth={3} />
      <G transform="translate(21 13) scale(0.66)">
        <Polygon points={StarPoints} fill="#fff6e5" stroke={line} strokeWidth={3.2} strokeLinejoin="round" />
      </G>
    </Svg>
  );
}

/** A small cup for the best streak. */
export function BestStreakIcon({ color, fill, size = 18 }: IconProps & { fill: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M7 4h10v5a5 5 0 0 1-10 0z" fill={fill} stroke={color} strokeWidth={2.3} strokeLinejoin="round" />
      <Path
        d="M7 6H4.5a2.5 2.5 0 0 0 2.6 3.4M17 6h2.5a2.5 2.5 0 0 1-2.6 3.4M12 14v3"
        fill="none"
        stroke={color}
        strokeWidth={2.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M8.5 20.5h7v-1.5a1.5 1.5 0 0 0-1.5-1.5h-4a1.5 1.5 0 0 0-1.5 1.5z" fill={fill} stroke={color} strokeWidth={2.3} strokeLinejoin="round" />
    </Svg>
  );
}

export function CameraIcon({ color, fill, size = 20 }: IconProps & { fill: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 8.5h3l1.6-2.5h6.8L17 8.5h3v10H4z" fill={fill} stroke={color} strokeWidth={2.6} strokeLinejoin="round" />
      <Circle cx={12} cy={13.2} r={3.3} fill="none" stroke={color} strokeWidth={2.6} />
    </Svg>
  );
}

export function PersonIcon({ color, fill, size = 16 }: IconProps & { fill: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={8.5} r={4} fill={fill} stroke={color} strokeWidth={2.6} />
      <Path d="M4.5 20c1-4 4-5.5 7.5-5.5s6.5 1.5 7.5 5.5" fill={fill} stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function MailIcon({ color, fill, size = 16 }: IconProps & { fill: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={3.5} y={6} width={17} height={12.5} rx={3} fill={fill} stroke={color} strokeWidth={2.6} />
      <Path d="M4.5 7.5l7.5 6 7.5-6" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function HelpIcon({ color, size = 16 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={8.5} fill="none" stroke={color} strokeWidth={2.8} />
      <Path d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .9-1 1.7" fill="none" stroke={color} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={12} cy={16.8} r={1.2} fill={color} />
    </Svg>
  );
}

/** A wrapped present: opens streak rewards. */
export function GiftIcon({ line, box, ribbon, size = 16 }: { line: string; box: string; ribbon: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={3} y={9} width={18} height={12} rx={3} fill={box} stroke={line} strokeWidth={2.5} />
      <Rect x={2} y={6} width={20} height={5} rx={2.5} fill={ribbon} stroke={line} strokeWidth={2.5} />
      <Path d="M12 6v15" stroke={line} strokeWidth={2.5} />
      <Path d="M12 6 C9 1 5 3 7 6 M12 6 C15 1 19 3 17 6" fill="none" stroke={line} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

export function LockIcon({ color, fill, size = 14 }: IconProps & { fill: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={5} y={11} width={14} height={10} rx={3} fill={fill} stroke={color} strokeWidth={3} />
      <Path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

/** Two fanned flash cards, the front one asking "?": the Flashcards exercise. */
export function FlashcardsIcon({ line }: { line: string }) {
  return (
    <Svg width={62} height={56} viewBox="0 0 62 56">
      <Rect x={4} y={10} width={34} height={42} rx={8} fill="#fff6e5" stroke={line} strokeWidth={3} transform="rotate(-8 21 31)" />
      <G transform="rotate(6 38 26)">
        <Rect x={20} y={4} width={36} height={44} rx={8} fill="#ffffff" stroke={line} strokeWidth={3} />
        <Path d="M33.5 21.5a4.5 4.5 0 1 1 6.5 4c-1.4.8-2 1.6-2 3v1" fill="none" stroke={line} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx={38} cy={35.5} r={2} fill={line} />
      </G>
    </Svg>
  );
}

/** Four tiles joined by dotted lines: the Matching exercise. */
export function MatchingIcon({ line }: { line: string }) {
  return (
    <Svg width={66} height={56} viewBox="0 0 66 56">
      <Rect x={2} y={6} width={24} height={18} rx={6} fill="#ffffff" stroke={line} strokeWidth={3} />
      <Rect x={2} y={32} width={24} height={18} rx={6} fill="#fff6e5" stroke={line} strokeWidth={3} />
      <Rect x={40} y={6} width={24} height={18} rx={6} fill="#fff6e5" stroke={line} strokeWidth={3} />
      <Rect x={40} y={32} width={24} height={18} rx={6} fill="#ffffff" stroke={line} strokeWidth={3} />
      <Path d="M26 15 L40 41 M26 41 L40 15" stroke={line} strokeWidth={3} strokeLinecap="round" strokeDasharray="1 6" />
      <Circle cx={33} cy={28} r={6} fill="#ffcb2e" stroke={line} strokeWidth={3} />
    </Svg>
  );
}

/** A magnifying glass with a yellow handle: the Explore exercise. */
export function ExploreIcon({ line, width = 60 }: { line: string; width?: number }) {
  return (
    <Svg width={width} height={(width * 56) / 60} viewBox="0 0 60 56">
      <Path d="M34 33 L46 45" fill="none" stroke={line} strokeWidth={13} strokeLinecap="round" />
      <Path d="M34 33 L46 45" fill="none" stroke="#ffcb2e" strokeWidth={6} strokeLinecap="round" />
      <Circle cx={23} cy={22} r={16} fill="#c9f1ff" stroke={line} strokeWidth={4} />
      <Path d="M14 19 a10 10 0 0 1 7 -6" fill="none" stroke="#ffffff" strokeWidth={4} strokeLinecap="round" />
    </Svg>
  );
}

/** A steaming pot on a stove: the Kitchen place. */
export function KitchenIcon({ line }: { line: string }) {
  return (
    <Svg width={72} height={64} viewBox="0 0 72 64">
      <Path d="M26 12 q-4 -4 0 -9 M36 12 q-4 -4 0 -9 M46 12 q-4 -4 0 -9" fill="none" stroke="#fff6e5" strokeWidth={3.5} strokeLinecap="round" />
      <Rect x={4} y={31} width={12} height={8} rx={4} fill="#ffcb2e" stroke={line} strokeWidth={3} />
      <Rect x={56} y={31} width={12} height={8} rx={4} fill="#ffcb2e" stroke={line} strokeWidth={3} />
      <Rect x={12} y={26} width={48} height={28} rx={8} fill="#ffffff" stroke={line} strokeWidth={3} />
      <Rect x={31} y={14} width={10} height={7} rx={3.5} fill={line} />
      <Rect x={12} y={18} width={48} height={8} rx={4} fill="#ffcb2e" stroke={line} strokeWidth={3} />
      <Rect x={8} y={57} width={56} height={5} rx={2.5} fill={line} />
    </Svg>
  );
}

/** A two-door fridge with a magnet and a note: the Refrigerator place. */
export function FridgeIcon({ line }: { line: string }) {
  return (
    <Svg width={56} height={64} viewBox="0 0 56 64">
      <Rect x={10} y={2} width={36} height={60} rx={8} fill="#ffffff" stroke={line} strokeWidth={3} />
      <Path d="M10 24 H46" stroke={line} strokeWidth={3} />
      <Rect x={15} y={9} width={5} height={10} rx={2.5} fill={line} />
      <Rect x={15} y={30} width={5} height={16} rx={2.5} fill={line} />
      <Circle cx={36} cy={13} r={4.5} fill="#ff4f9a" stroke={line} strokeWidth={2.5} />
      <Rect x={29} y={34} width={11} height={9} rx={2} fill="#ffcb2e" stroke={line} strokeWidth={2.5} transform="rotate(8 34.5 38.5)" />
    </Svg>
  );
}

/** A made bed with sleepy z's: the Bedroom place. */
export function BedroomIcon({ line }: { line: string }) {
  return (
    <Svg width={72} height={60} viewBox="0 0 72 60">
      <SvgText x={46} y={16} fontFamily={Font.display700} fontSize={13} fill="#fff6e5">
        z
      </SvgText>
      <SvgText x={55} y={10} fontFamily={Font.display700} fontSize={10} fill="#fff6e5">
        z
      </SvgText>
      <Rect x={12} y={44} width={5} height={12} rx={2.5} fill={line} />
      <Rect x={61} y={44} width={5} height={12} rx={2.5} fill={line} />
      <Rect x={4} y={12} width={14} height={40} rx={6} fill="#ffcb2e" stroke={line} strokeWidth={3} />
      <Rect x={10} y={30} width={58} height={16} rx={6} fill="#ffffff" stroke={line} strokeWidth={3} />
      <Rect x={18} y={22} width={20} height={11} rx={5.5} fill="#fff6e5" stroke={line} strokeWidth={3} />
      <Rect x={34} y={26} width={34} height={20} rx={6} fill="#ff4f9a" stroke={line} strokeWidth={3} />
    </Svg>
  );
}

/** A bathtub with a tap and bubbles: the Bathroom place. */
export function BathroomIcon({ line }: { line: string }) {
  return (
    <Svg width={72} height={60} viewBox="0 0 72 60">
      <Path d="M14 26 V12 a6 6 0 0 1 12 0 v3" fill="none" stroke={line} strokeWidth={4} strokeLinecap="round" />
      <Circle cx={40} cy={20} r={6} fill="#ffffff" stroke={line} strokeWidth={2.5} />
      <Circle cx={52} cy={14} r={5} fill="#ffffff" stroke={line} strokeWidth={2.5} />
      <Circle cx={60} cy={22} r={4} fill="#ffffff" stroke={line} strokeWidth={2.5} />
      <Rect x={14} y={44} width={6} height={12} rx={3} fill={line} />
      <Rect x={52} y={44} width={6} height={12} rx={3} fill={line} />
      <Path d="M4 26 H68 V34 a14 14 0 0 1 -14 14 H18 a14 14 0 0 1 -14 -14 Z" fill="#ffffff" stroke={line} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M12 33 H60" stroke="#c9f1ff" strokeWidth={4} strokeLinecap="round" />
    </Svg>
  );
}

/** A little house with a chimney: the Home place. */
export function HouseIcon({ line }: { line: string }) {
  return (
    <Svg width={64} height={60} viewBox="0 0 64 60">
      <Rect x={42} y={8} width={8} height={16} rx={3} fill="#fff6e5" stroke={line} strokeWidth={3} />
      <Rect x={12} y={26} width={40} height={30} rx={6} fill="#2ec4f0" stroke={line} strokeWidth={3} />
      <Path d="M6 30 L32 6 L58 30 Z" fill="#ffcb2e" stroke={line} strokeWidth={3} strokeLinejoin="round" />
      <Rect x={26} y={38} width={12} height={18} rx={6} fill="#fff6e5" stroke={line} strokeWidth={3} />
      <Rect x={15} y={34} width={8} height={8} rx={2} fill="#fff6e5" stroke={line} strokeWidth={2.5} />
      <Rect x={41} y={34} width={8} height={8} rx={2} fill="#fff6e5" stroke={line} strokeWidth={2.5} />
    </Svg>
  );
}

/** A beach umbrella, the sun and a wave: the Beach place. */
export function BeachIcon({ line }: { line: string }) {
  return (
    <Svg width={72} height={60} viewBox="0 0 72 60">
      <Circle cx={60} cy={12} r={7} fill="#ff8a24" stroke={line} strokeWidth={3} />
      <G transform="rotate(-12 30 22)">
        <Path d="M30 26 V52" stroke={line} strokeWidth={4} strokeLinecap="round" />
        <Path d="M8 26 A22 20 0 0 1 52 26 Z" fill="#ff4f9a" stroke={line} strokeWidth={3} strokeLinejoin="round" />
        <Path d="M22 26 Q23 12 30 6 M38 26 Q37 12 30 6" fill="none" stroke={line} strokeWidth={2.5} />
      </G>
      <Path d="M6 54 q6 -5 12 0 t12 0 t12 0 t12 0 t12 0" fill="none" stroke="#2ec4f0" strokeWidth={4} strokeLinecap="round" />
    </Svg>
  );
}

/** A keyboard with one key lit: the Spelling exercise. */
export function SpellingIcon({ line }: { line: string }) {
  return (
    <Svg width={64} height={54} viewBox="0 0 64 54">
      <Rect x={2} y={6} width={60} height={42} rx={10} fill="#ffffff" stroke={line} strokeWidth={3} />
      <Rect x={9} y={14} width={13} height={11} rx={3} fill="#fff6e5" stroke={line} strokeWidth={2.5} />
      <Rect x={25.5} y={14} width={13} height={11} rx={3} fill="#ff4f9a" stroke={line} strokeWidth={2.5} />
      <Rect x={42} y={14} width={13} height={11} rx={3} fill="#fff6e5" stroke={line} strokeWidth={2.5} />
      <Rect x={14} y={31} width={36} height={9} rx={4.5} fill="#fff6e5" stroke={line} strokeWidth={2.5} />
    </Svg>
  );
}

/** A conjugation table with filled-in cells: the Conjugate exercise. */
export function ConjugateIcon({ line }: { line: string }) {
  return (
    <Svg width={64} height={54} viewBox="0 0 64 54">
      <Rect x={2} y={4} width={60} height={46} rx={10} fill="#ffffff" stroke={line} strokeWidth={3} />
      <Path d="M32 4v46M2 19.5h60M2 34.5h60" stroke={line} strokeWidth={2.5} />
      <Rect x={36} y={9} width={21} height={6} rx={3} fill="#ffcb2e" />
      <Rect x={7} y={24} width={20} height={6} rx={3} fill="#ffcb2e" />
      <Rect x={36} y={39} width={21} height={6} rx={3} fill="#ffcb2e" />
    </Svg>
  );
}

export function PlayIcon({ color, size = 14 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M7 4.5v15l12-7.5z" fill={color} stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
    </Svg>
  );
}
