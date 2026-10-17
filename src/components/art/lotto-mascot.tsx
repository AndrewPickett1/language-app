import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Rect } from 'react-native-svg';

import { Bright, Fixed } from '@/theme/tokens';

type Limb = { d: string; end: { cx: number; cy: number; rx: number; ry: number } };

const CheerLimbs: Limb[] = [
  { d: 'M86,170 C74,178 70,188 78,196', end: { cx: 76, cy: 200, rx: 12, ry: 7 } },
  { d: 'M114,170 C126,178 130,188 122,196', end: { cx: 124, cy: 200, rx: 12, ry: 7 } },
  { d: 'M50,120 C32,104 28,82 38,60', end: { cx: 38, cy: 56, rx: 9, ry: 9 } },
  { d: 'M150,120 C168,104 172,82 162,60', end: { cx: 162, cy: 56, rx: 9, ry: 9 } },
];

const WaveLegs: Limb[] = [
  { d: 'M86,170 C86,182 84,192 84,200', end: { cx: 80, cy: 204, rx: 12, ry: 7 } },
  { d: 'M114,170 C114,182 116,192 116,200', end: { cx: 120, cy: 204, rx: 12, ry: 7 } },
];

const WaveArms: Limb[] = [
  { d: 'M48,130 C36,142 34,158 40,170', end: { cx: 40, cy: 172, rx: 9, ry: 9 } },
  { d: 'M152,126 C172,118 178,96 170,72', end: { cx: 170, cy: 68, rx: 9, ry: 9 } },
];

const ThinkLegs: Limb[] = [
  WaveLegs[0],
  { d: 'M114,170 C112,184 104,194 98,200', end: { cx: 94, cy: 204, rx: 12, ry: 7 } },
];

const ThinkLeftArm: Limb[] = [WaveArms[0]];

/** Drawn over the body so the hand rests on the chin. */
const ThinkChinArm: Limb[] = [{ d: 'M152,132 C170,152 152,174 126,166', end: { cx: 122, cy: 164, rx: 9, ry: 9 } }];

function Limbs({ limbs, line }: { limbs: Limb[]; line: string }) {
  return limbs.map((limb) => (
    <G key={limb.d}>
      <Path d={limb.d} fill="none" stroke={line} strokeWidth={15} strokeLinecap="round" />
      <Path d={limb.d} fill="none" stroke={Bright.pink} strokeWidth={8} strokeLinecap="round" />
      <Ellipse {...limb.end} fill={Bright.pink} stroke={line} strokeWidth={4} />
    </G>
  ));
}

/** Antenna, capsule body and a happy or thinking face. */
function Body({ line, face = 'happy' }: { line: string; face?: 'happy' | 'think' }) {
  return (
    <>
      <Path d="M100,66 C96,52 110,48 104,36" fill="none" stroke={line} strokeWidth={4.5} strokeLinecap="round" />
      <Polygon
        points="104.0,19.0 106.9,26.0 114.5,26.6 108.8,31.5 110.5,38.9 104.0,35.0 97.5,38.9 99.2,31.5 93.5,26.6 101.1,26.0"
        fill={Bright.sunshine}
        stroke={line}
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
      <Path d="M44,120 A56,56 0 0 0 156,120 Z" fill={Fixed.paper} />
      <Path d="M44,120 A56,56 0 0 1 156,120 Z" fill={Bright.pink} />
      <Rect x={62} y={78} width={24} height={11} rx={5.5} fill="#ffffff" transform="rotate(-32 74 83)" />
      <Line x1={44} y1={120} x2={156} y2={120} stroke={line} strokeWidth={4} strokeLinecap="round" />
      <Circle cx={100} cy={120} r={56} fill="none" stroke={line} strokeWidth={4.5} />
      <Ellipse cx={67} cy={150} rx={8} ry={4.5} fill={Bright.pink} opacity={0.55} />
      <Ellipse cx={133} cy={150} rx={8} ry={4.5} fill={Bright.pink} opacity={0.55} />
      {face === 'think' ? <ThinkFace line={line} /> : <HappyFace line={line} />}
    </>
  );
}

function HappyFace({ line }: { line: string }) {
  return (
    <>
      <Path d="M77,140 Q84,130 91,140" fill="none" stroke={line} strokeWidth={5} strokeLinecap="round" />
      <Path d="M109,140 Q116,130 123,140" fill="none" stroke={line} strokeWidth={5} strokeLinecap="round" />
      <Path d="M90,151 Q100,170 110,151 Z" fill={line} stroke={line} strokeWidth={3} strokeLinejoin="round" />
      <Ellipse cx={100} cy={160.5} rx={5} ry={3} fill={Bright.pink} />
    </>
  );
}

function ThinkFace({ line }: { line: string }) {
  return (
    <>
      <Ellipse cx={87} cy={134} rx={6.5} ry={8.5} fill={line} />
      <Circle cx={89.5} cy={130} r={2.4} fill="#ffffff" />
      <Ellipse cx={119} cy={134} rx={6.5} ry={8.5} fill={line} />
      <Circle cx={121.5} cy={130} r={2.4} fill="#ffffff" />
      <Path d="M94,156 L107,153" fill="none" stroke={line} strokeWidth={4.5} strokeLinecap="round" />
    </>
  );
}

type Props = { line: string; width?: number; pose?: 'cheer' | 'wave' | 'think' };

/** Lotto, the pink capsule mascot: cheering with both arms up, waving hello, or thinking. */
export function LottoMascot({ line, width = 112, pose = 'cheer' }: Props) {
  const height = (width * 220) / 200;

  if (pose === 'think') {
    return (
      <Svg width={width} height={height} viewBox="0 0 200 220" style={{ overflow: 'visible' }} accessibilityLabel="Lotto thinking">
        <Ellipse cx={100} cy={210} rx={40} ry={6} fill={line} opacity={0.16} />
        <Limbs limbs={ThinkLegs} line={line} />
        <G transform="rotate(-6 100 140)">
          <Limbs limbs={ThinkLeftArm} line={line} />
          <Body line={line} face="think" />
          <Limbs limbs={ThinkChinArm} line={line} />
        </G>
        <Circle cx={150} cy={62} r={4} fill={Fixed.paper} stroke={line} strokeWidth={3} />
        <Circle cx={162} cy={46} r={6} fill={Fixed.paper} stroke={line} strokeWidth={3} />
        <Circle cx={180} cy={26} r={9} fill={Fixed.paper} stroke={line} strokeWidth={3} />
      </Svg>
    );
  }

  if (pose === 'wave') {
    return (
      <Svg width={width} height={height} viewBox="0 0 200 220" accessibilityLabel="Lotto waving">
        <Ellipse cx={100} cy={210} rx={40} ry={6} fill={line} opacity={0.14} />
        <Limbs limbs={WaveLegs} line={line} />
        <G transform="rotate(-4 100 140)">
          <Limbs limbs={WaveArms} line={line} />
          <Body line={line} />
        </G>
        <Path d="M186,58 Q194,70 186,82" fill="none" stroke={line} strokeWidth={3.5} strokeLinecap="round" />
      </Svg>
    );
  }

  return (
    <Svg width={width} height={height} viewBox="0 0 200 220" accessibilityLabel="Lotto cheering">
      <Ellipse cx={100} cy={210} rx={26} ry={6} fill={line} opacity={0.18} />
      <G transform="translate(0,-18)">
        <Limbs limbs={CheerLimbs} line={line} />
        <Body line={line} />
      </G>
      <Polygon
        points="22.0,23.0 24.9,30.0 32.5,30.6 26.8,35.5 28.5,42.9 22.0,39.0 15.5,42.9 17.2,35.5 11.5,30.6 19.1,30.0"
        fill={Bright.sunshine}
        stroke={line}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Polygon
        points="180.0,17.0 182.4,22.8 188.6,23.2 183.8,27.2 185.3,33.3 180.0,30.0 174.7,33.3 176.2,27.2 171.4,23.2 177.6,22.8"
        fill={Bright.sunshine}
        stroke={line}
        strokeWidth={3}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
