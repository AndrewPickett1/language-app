import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import { Fixed } from '@/theme/tokens';

type Props = {
  /** Top-half colour, usually a rarity colour. */
  color: string;
  line: string;
  size?: number;
  /** Draw the flat white shine (skip it for tiny capsules). */
  shine?: boolean;
  /** Outline width in viewBox units (viewBox is 60 wide). */
  stroke?: number;
};

/** The master shape: a disc split at the seam, coloured top over paper bottom. */
export function Capsule({ color, line, size = 28, shine = true, stroke = 4 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60">
      <Path d="M6,30 A24,24 0 0 0 54,30 Z" fill={Fixed.paper} />
      <Path d="M6,30 A24,24 0 0 1 54,30 Z" fill={color} />
      {shine && <Rect x={15} y={14} width={13} height={6} rx={3} fill="#ffffff" transform="rotate(-30 21.5 17)" />}
      <Line x1={6} y1={30} x2={54} y2={30} stroke={line} strokeWidth={stroke * 0.85} />
      <Circle cx={30} cy={30} r={24} fill="none" stroke={line} strokeWidth={stroke} />
    </Svg>
  );
}
