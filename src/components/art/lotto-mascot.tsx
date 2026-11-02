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

/** One arm down, the other scratching the top of the head. */
const OopsArms: Limb[] = [WaveArms[0], { d: 'M152,126 C178,112 176,82 152,74', end: { cx: 148, cy: 72, rx: 9, ry: 9 } }];

/** One arm down, the other held out to the right, towards what's being explained. */
const PointArms: Limb[] = [WaveArms[0], { d: 'M152,124 C166,118 178,112 188,106', end: { cx: 192, cy: 104, rx: 9, ry: 9 } }];

/** Both arms flung up in surprise. */
const WhoaArms: Limb[] = [
  { d: 'M50,126 C25,114 16,86 22,62', end: { cx: 22, cy: 56, rx: 9, ry: 9 } },
  { d: 'M150,126 C175,114 184,86 178,62', end: { cx: 178, cy: 56, rx: 9, ry: 9 } },
];

/** Elbows out, hands up at the sides. */
const ShrugArms: Limb[] = [
  { d: 'M50,129 C28,129 16,117 13,98', end: { cx: 13, cy: 92, rx: 9, ry: 9 } },
  { d: 'M150,129 C172,129 184,117 187,98', end: { cx: 187, cy: 92, rx: 9, ry: 9 } },
];

function Limbs({ limbs, line }: { limbs: Limb[]; line: string }) {
  return limbs.map((limb) => (
    <G key={limb.d}>
      <Path d={limb.d} fill="none" stroke={line} strokeWidth={15} strokeLinecap="round" />
      <Path d={limb.d} fill="none" stroke={Bright.pink} strokeWidth={8} strokeLinecap="round" />
      <Ellipse {...limb.end} fill={Bright.pink} stroke={line} strokeWidth={4} />
    </G>
  ));
}

type Face = 'happy' | 'think' | 'oops' | 'bright' | 'whoa' | 'shrug';

/** Antenna, capsule body and a face. */
function Body({ line, face = 'happy' }: { line: string; face?: Face }) {
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
      {face === 'think' ? (
        <ThinkFace line={line} />
      ) : face === 'oops' ? (
        <OopsFace line={line} />
      ) : face === 'bright' || face === 'whoa' || face === 'shrug' ? (
        <OpenEyesFace line={line} mouth={face} />
      ) : (
        <HappyFace line={line} />
      )}
    </>
  );
}

/** Wide-open eyes with an open smile (bright), a round "oh" (whoa) or a wobbly mouth (shrug). */
function OpenEyesFace({ line, mouth }: { line: string; mouth: 'bright' | 'whoa' | 'shrug' }) {
  return (
    <>
      <Ellipse cx={87} cy={134} rx={6.5} ry={8.5} fill={line} />
      <Circle cx={89.5} cy={130} r={2.4} fill="#ffffff" />
      <Ellipse cx={119} cy={134} rx={6.5} ry={8.5} fill={line} />
      <Circle cx={121.5} cy={130} r={2.4} fill="#ffffff" />
      {mouth === 'whoa' ? (
        <Ellipse cx={100} cy={157} rx={7.5} ry={8.5} fill={line} />
      ) : mouth === 'shrug' ? (
        <Path d="M86,157 Q93,151 100,157 Q107,163 114,157" fill="none" stroke={line} strokeWidth={4.5} strokeLinecap="round" />
      ) : (
        <>
          <Path d="M90,151 Q100,170 110,151 Z" fill={line} stroke={line} strokeWidth={3} strokeLinejoin="round" />
          <Ellipse cx={100} cy={160.5} rx={5} ry={3} fill={Bright.pink} />
        </>
      )}
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

/** Eyes squeezed shut and a wobbly smile. */
function OopsFace({ line }: { line: string }) {
  return (
    <>
      <Path d="M78,128 L91,135 L78,142" fill="none" stroke={line} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M122,128 L109,135 L122,142" fill="none" stroke={line} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M86,157 Q93,151 100,157 Q107,163 114,157" fill="none" stroke={line} strokeWidth={4.5} strokeLinecap="round" />
    </>
  );
}

export type MascotPose = 'cheer' | 'wave' | 'think' | 'oops' | 'point' | 'whoa' | 'shrug';

type Props = { line: string; width?: number; pose?: MascotPose };

/**
 * Lotto, the pink capsule mascot: cheering with both arms up, waving hello, thinking, embarrassed (oops),
 * pointing at something, surprised (whoa) or shrugging.
 */
export function LottoMascot({ line, width = 112, pose = 'cheer' }: Props) {
  const height = (width * 220) / 200;

  if (pose === 'point') {
    return (
      <Svg width={width} height={height} viewBox="0 0 200 220" style={{ overflow: 'visible' }} accessibilityLabel="Lotto pointing">
        <Ellipse cx={100} cy={210} rx={40} ry={6} fill={line} opacity={0.14} />
        <Limbs limbs={WaveLegs} line={line} />
        <Limbs limbs={PointArms} line={line} />
        <Body line={line} face="bright" />
      </Svg>
    );
  }

  if (pose === 'whoa') {
    return (
      <Svg width={width} height={height} viewBox="0 0 200 220" style={{ overflow: 'visible' }} accessibilityLabel="Lotto looking amazed">
        <Ellipse cx={100} cy={210} rx={40} ry={6} fill={line} opacity={0.14} />
        <Limbs limbs={WaveLegs} line={line} />
        <Limbs limbs={WhoaArms} line={line} />
        <Body line={line} face="whoa" />
        <Path d="M4,34 Q-2,46 4,58" fill="none" stroke={line} strokeWidth={3.5} strokeLinecap="round" />
        <Path d="M196,34 Q202,46 196,58" fill="none" stroke={line} strokeWidth={3.5} strokeLinecap="round" />
      </Svg>
    );
  }

  if (pose === 'shrug') {
    return (
      <Svg width={width} height={height} viewBox="0 0 200 220" style={{ overflow: 'visible' }} accessibilityLabel="Lotto shrugging">
        <Ellipse cx={100} cy={210} rx={40} ry={6} fill={line} opacity={0.14} />
        <Limbs limbs={WaveLegs} line={line} />
        <Limbs limbs={ShrugArms} line={line} />
        <Body line={line} face="shrug" />
        <Path d="M162,52 C162,52 153,64 153,70 A9,9 0 0 0 171,70 C171,64 162,52 162,52 Z" fill={Bright.sky} stroke={line} strokeWidth={3.5} strokeLinejoin="round" />
      </Svg>
    );
  }

  if (pose === 'oops') {
    return (
      <Svg width={width} height={height} viewBox="0 0 200 220" style={{ overflow: 'visible' }} accessibilityLabel="Lotto looking embarrassed">
        <Ellipse cx={100} cy={210} rx={40} ry={6} fill={line} opacity={0.14} />
        <Limbs limbs={WaveLegs} line={line} />
        <G transform="rotate(5 100 140)">
          <Limbs limbs={OopsArms} line={line} />
          <Body line={line} face="oops" />
        </G>
        <Path d="M36,62 C28,74 28,84 36,86 C44,84 44,74 36,62 Z" fill={Bright.sky} stroke={line} strokeWidth={3.5} strokeLinejoin="round" />
      </Svg>
    );
  }

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
