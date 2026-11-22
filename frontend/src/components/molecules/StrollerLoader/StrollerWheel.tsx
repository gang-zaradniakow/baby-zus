import { Animated } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import { SCALE, WHEEL_RADIUS } from './strollerGeometry';

type Props = {
  color: string;
  /** Wartość 0 → 1 (pełny obrót); wspólna dla obu kół. */
  turn: Animated.Value;
  left: number;
  top: number;
};

const SIZE = (WHEEL_RADIUS + 1) * 2 * SCALE;
const C = SIZE / 2;
const R = WHEEL_RADIUS * SCALE;

/** Koło wózka ze szprychami „na krzyż”, obracające się zgodnie z kierunkiem jazdy. */
export function StrollerWheel({ color, turn, left, top }: Props) {
  const rotate = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View style={{ position: 'absolute', left, top, width: SIZE, height: SIZE, transform: [{ rotate }] }}>
      <Svg width={SIZE} height={SIZE}>
        <Circle cx={C} cy={C} r={R - SCALE} stroke={color} strokeWidth={SCALE * 1.5} fill="none" />
        <Line x1={C - R} y1={C} x2={C + R} y2={C} stroke={color} strokeWidth={SCALE} />
        <Line x1={C} y1={C - R} x2={C} y2={C + R} stroke={color} strokeWidth={SCALE} />
      </Svg>
    </Animated.View>
  );
}
