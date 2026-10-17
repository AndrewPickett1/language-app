import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Rect } from 'react-native-svg';

import { Bright, Fixed } from '@/theme/tokens';

type ArtProps = { line: string; width: number };

function Cat({ line, width }: ArtProps) {
  return (
    <Svg width={width} height={(width * 170) / 220} viewBox="0 0 220 170">
      <Path d="M150,128 C192,124 198,84 176,68" fill="none" stroke={line} strokeWidth={15} strokeLinecap="round" />
      <Path d="M150,128 C192,124 198,84 176,68" fill="none" stroke={Bright.tangerine} strokeWidth={7} strokeLinecap="round" />
      <Ellipse cx={110} cy={122} rx={50} ry={38} fill={Bright.tangerine} stroke={line} strokeWidth={4} />
      <Ellipse cx={110} cy={132} rx={26} ry={22} fill={Fixed.paper} />
      <Ellipse cx={92} cy={157} rx={13} ry={8} fill={Fixed.paper} stroke={line} strokeWidth={3.5} />
      <Ellipse cx={128} cy={157} rx={13} ry={8} fill={Fixed.paper} stroke={line} strokeWidth={3.5} />
      <Path d="M76,50 L72,14 L106,34 Z" fill={Bright.tangerine} stroke={line} strokeWidth={4} strokeLinejoin="round" />
      <Path d="M144,50 L148,14 L114,34 Z" fill={Bright.tangerine} stroke={line} strokeWidth={4} strokeLinejoin="round" />
      <Path d="M80,40 L78,24 L94,33 Z" fill={Bright.pink} />
      <Path d="M140,40 L142,24 L126,33 Z" fill={Bright.pink} />
      <Circle cx={110} cy={70} r={42} fill={Bright.tangerine} stroke={line} strokeWidth={4} />
      <Path d="M102,31 L104,41 M110,29 L110,41 M118,31 L116,41" fill="none" stroke={line} strokeWidth={3.5} strokeLinecap="round" />
      <Ellipse cx={95} cy={70} rx={5.5} ry={7.5} fill={line} />
      <Circle cx={97} cy={66.5} r={2} fill="#ffffff" />
      <Ellipse cx={125} cy={70} rx={5.5} ry={7.5} fill={line} />
      <Circle cx={127} cy={66.5} r={2} fill="#ffffff" />
      <Ellipse cx={85} cy={85} rx={7} ry={4} fill={Bright.pink} opacity={0.55} />
      <Ellipse cx={135} cy={85} rx={7} ry={4} fill={Bright.pink} opacity={0.55} />
      <Path d="M106,81 L114,81 L110,86 Z" fill={Bright.pink} stroke={line} strokeWidth={2.5} strokeLinejoin="round" />
      <Path d="M110,86 Q110,92 104,92 M110,86 Q110,92 116,92" fill="none" stroke={line} strokeWidth={3} strokeLinecap="round" />
      <Path d="M58,80 L80,83 M58,91 L80,89 M162,80 L140,83 M162,91 L140,89" fill="none" stroke={line} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

function Apple({ line, width }: ArtProps) {
  return (
    <Svg width={width} height={(width * 150) / 160} viewBox="0 0 160 150">
      <Ellipse cx={80} cy={142} rx={44} ry={6} fill={line} opacity={0.12} />
      <Path
        d="M80,44 C62,30 30,34 26,70 C22,104 48,138 70,136 C76,135 78,132 80,132 C82,132 84,135 90,136 C112,138 138,104 134,70 C130,34 98,30 80,44 Z"
        fill={Bright.cherry}
        stroke={line}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <Rect x={40} y={60} width={20} height={10} rx={5} fill="#ffffff" transform="rotate(-50 50 65)" />
      <Path d="M80,44 C80,32 84,24 90,16" fill="none" stroke={line} strokeWidth={5} strokeLinecap="round" />
      <Path d="M88,30 C96,14 116,12 122,20 C114,32 98,36 88,30 Z" fill={Bright.leaf} stroke={line} strokeWidth={3.5} strokeLinejoin="round" />
    </Svg>
  );
}

function House({ line, width }: ArtProps) {
  return (
    <Svg width={width} height={(width * 150) / 160} viewBox="0 0 160 150">
      <Ellipse cx={80} cy={138} rx={56} ry={6} fill={line} opacity={0.12} />
      <Rect x={100} y={30} width={16} height={30} rx={5} fill={Fixed.paper} stroke={line} strokeWidth={3.5} />
      <Rect x={38} y={62} width={84} height={72} rx={12} fill={Bright.sky} stroke={line} strokeWidth={4} />
      <Path d="M26,70 L80,24 L134,70 Z" fill={Bright.pink} stroke={line} strokeWidth={4} strokeLinejoin="round" />
      <Rect x={68} y={96} width={24} height={38} rx={12} fill={Bright.sunshine} stroke={line} strokeWidth={3.5} />
      <Circle cx={86} cy={116} r={2.5} fill={line} />
      <Rect x={46} y={80} width={18} height={16} rx={5} fill={Fixed.paper} stroke={line} strokeWidth={3} />
      <Rect x={96} y={80} width={18} height={16} rx={5} fill={Fixed.paper} stroke={line} strokeWidth={3} />
    </Svg>
  );
}

/** Words without their own drawing get an open capsule with a star popping out. */
function OpenCapsule({ line, width, color }: ArtProps & { color: string }) {
  return (
    // Taller than wide so the dropped bottom half (down to y=122) isn't clipped.
    <Svg width={width} height={(width * 162) / 148} viewBox="-14 -34 148 162">
      <G transform="translate(0,14)">
        <Path d="M12,60 A48,48 0 0 0 108,60 Z" fill={Fixed.paper} stroke={line} strokeWidth={4} strokeLinejoin="round" />
      </G>
      <Line x1={18} y1={46} x2={6} y2={40} stroke={line} strokeWidth={4} strokeLinecap="round" />
      <Line x1={102} y1={46} x2={116} y2={38} stroke={line} strokeWidth={4} strokeLinecap="round" />
      <Line x1={96} y1={26} x2={110} y2={10} stroke={line} strokeWidth={4} strokeLinecap="round" />
      <Polygon
        points="62.0,14.0 70.2,32.7 90.5,34.7 75.3,48.3 79.6,68.3 62.0,58.0 44.4,68.3 48.7,48.3 33.5,34.7 53.8,32.7"
        fill={Bright.sunshine}
        stroke={line}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <G transform="translate(-22,-42) rotate(-26 60 60)">
        <Path d="M12,60 A48,48 0 0 1 108,60 Z" fill={color} stroke={line} strokeWidth={4} strokeLinejoin="round" />
        <Rect x={30} y={24} width={22} height={10} rx={5} fill="#ffffff" transform="rotate(-30 41 29)" />
      </G>
      <Polygon
        points="118.0,65.0 119.8,69.6 124.7,69.8 120.9,72.9 122.1,77.7 118.0,75.0 113.9,77.7 115.1,72.9 111.3,69.8 116.2,69.6"
        fill={Fixed.paper}
        stroke={line}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const Drawings: Record<string, (props: ArtProps) => React.JSX.Element> = {
  gato: Cat,
  manzana: Apple,
  casa: House,
};

/** The illustration for a word, falling back to an open capsule in `color`. */
export function WordArt({ id, color, line, width }: ArtProps & { id: string; color: string }) {
  const Drawing = Drawings[id];
  return Drawing ? <Drawing line={line} width={width} /> : <OpenCapsule line={line} width={width * 0.75} color={color} />;
}

export { OpenCapsule };
