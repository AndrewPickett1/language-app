import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';

import { StarPoints } from '@/components/icons';
import type { StreakReward } from '@/data/streak-rewards';
import { Font } from '@/theme/fonts';
import { usePalette } from '@/theme/use-palette';

/** The picture on a streak reward card. Physical objects, so the colours are fixed. */
export function RewardArt({ reward }: { reward: StreakReward }) {
  const p = usePalette();
  const line = p.onBright;

  switch (reward.kind) {
    case 'pulls':
      return (
        <Svg width={64} height={64} viewBox="0 0 60 60">
          <Path d="M8,30 A22,22 0 0 0 52,30 Z" fill={p.paper} />
          <Path d="M8,30 A22,22 0 0 1 52,30 Z" fill={p.pink} />
          <Rect x={16} y={14} width={11} height={5} rx={2.5} fill={p.white} transform="rotate(-30 21.5 16.5)" />
          <Line x1={8} y1={30} x2={52} y2={30} stroke={line} strokeWidth={3} />
          <Circle cx={30} cy={30} r={22} fill="none" stroke={line} strokeWidth={3.5} />
          <Rect x={34} y={38} width={26} height={18} rx={9} fill={p.sunshine} stroke={line} strokeWidth={3} />
          <SvgText x={47} y={51.5} textAnchor="middle" fontFamily={Font.display700} fontSize={12} fill={line}>
            {reward.amount}
          </SvgText>
        </Svg>
      );
    case 'freeze':
      return (
        <Svg width={62} height={62} viewBox="0 0 60 60">
          <Rect x={8} y={8} width={44} height={44} rx={12} fill={p.skySoft} stroke={line} strokeWidth={3.5} />
          <Rect x={14} y={13} width={12} height={5} rx={2.5} fill={p.white} transform="rotate(-20 20 15.5)" />
          <Path d="M30 18v24M19.6 24l20.8 12M19.6 36l20.8-12" stroke={p.sky} strokeWidth={4} strokeLinecap="round" />
          <Path d="M30 18v24M19.6 24l20.8 12M19.6 36l20.8-12" stroke={line} strokeWidth={1.6} strokeLinecap="round" />
          <Circle cx={30} cy={30} r={4} fill={p.paper} stroke={line} strokeWidth={2.5} />
        </Svg>
      );
    case 'capsule':
      return (
        <Svg width={66} height={66} viewBox="0 0 60 60">
          <Path d="M8,32 A22,22 0 0 0 52,32 Z" fill={p.paper} />
          <Path d="M8,32 A22,22 0 0 1 52,32 Z" fill={reward.cap ?? p.sky} />
          <Rect x={16} y={16} width={11} height={5} rx={2.5} fill={p.white} transform="rotate(-30 21.5 18.5)" />
          <Line x1={8} y1={32} x2={52} y2={32} stroke={line} strokeWidth={3} />
          <Circle cx={30} cy={32} r={22} fill="none" stroke={line} strokeWidth={3.5} />
          <G transform="translate(39 1) scale(0.8)">
            <Polygon points={StarPoints} fill={p.sunshine} stroke={line} strokeWidth={3} strokeLinejoin="round" />
          </G>
        </Svg>
      );
    case 'hat':
      return (
        <Svg width={62} height={62} viewBox="0 0 60 60">
          <Path d="M30 6 L48 48 H12 Z" fill={p.grape} stroke={line} strokeWidth={3.5} strokeLinejoin="round" />
          <Path d="M22 26 L38 26 M17 38 L43 38" stroke={p.sunshine} strokeWidth={4} strokeLinecap="round" />
          <Rect x={8} y={46} width={44} height={9} rx={4.5} fill={p.pink} stroke={line} strokeWidth={3} />
          <Circle cx={30} cy={6} r={5} fill={p.sunshine} stroke={line} strokeWidth={3} />
        </Svg>
      );
    case 'badge':
      return (
        <Svg width={62} height={62} viewBox="0 0 60 60">
          <Path d="M18 4h10l-4 18h-10z M42 4h-10l4 18h10z" fill={p.sky} stroke={line} strokeWidth={3} strokeLinejoin="round" />
          <Circle cx={30} cy={38} r={18} fill={p.sunshine} stroke={line} strokeWidth={3.5} />
          <Circle cx={30} cy={38} r={11} fill={p.sunshineSoft} stroke={line} strokeWidth={2.5} />
          <SvgText x={30} y={43} textAnchor="middle" fontFamily={Font.display700} fontSize={13} fill={line}>
            {reward.day}
          </SvgText>
        </Svg>
      );
    case 'golden':
      return (
        <Svg width={64} height={64} viewBox="0 0 60 60">
          <Path d="M30 16 C28 10 34 9 31 4" fill="none" stroke={line} strokeWidth={2.5} strokeLinecap="round" />
          <Circle cx={31} cy={5} r={4} fill={p.paper} stroke={line} strokeWidth={2.5} />
          <Path d="M9,34 A21,21 0 0 0 51,34 Z" fill={p.paper} />
          <Path d="M9,34 A21,21 0 0 1 51,34 Z" fill={p.sunshine} />
          <Rect x={17} y={19} width={10} height={5} rx={2.5} fill={p.white} transform="rotate(-30 22 21.5)" />
          <Line x1={9} y1={34} x2={51} y2={34} stroke={line} strokeWidth={3} />
          <Circle cx={30} cy={34} r={21} fill="none" stroke={line} strokeWidth={3.5} />
          <Path d="M23 40 Q26 36 29 40 M31 40 Q34 36 37 40" fill="none" stroke={line} strokeWidth={2.6} strokeLinecap="round" />
          <Ellipse cx={21} cy={46} rx={3.5} ry={2} fill={p.pink} opacity={0.6} />
          <Ellipse cx={39} cy={46} rx={3.5} ry={2} fill={p.pink} opacity={0.6} />
        </Svg>
      );
  }
}
