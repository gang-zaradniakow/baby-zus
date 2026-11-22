import { Animated, View } from 'react-native';

import { styles } from './StrollerLoader.styles';
import { ROAD_PERIOD, STAGE } from './strollerGeometry';

type Props = {
  color: string;
  /** Wartość 0 → 1; jezdnia przesuwa się o jeden okres kreski w lewo. */
  shift: Animated.Value;
};

/** Kreski z zapasem o jeden okres, żeby przesuwanie było płynne bez „dziury” na końcu. */
const DASH_COUNT = Math.ceil(STAGE.width / ROAD_PERIOD) + 1;
const DASHES = Array.from({ length: DASH_COUNT }, (_, index) => index);

/** Przerywana jezdnia pod wózkiem — przesuwa się, więc wózek „jedzie”. */
export function RoadLine({ color, shift }: Props) {
  const translateX = shift.interpolate({ inputRange: [0, 1], outputRange: [0, -ROAD_PERIOD] });

  return (
    <View style={styles.road}>
      <Animated.View style={[styles.roadDashes, { transform: [{ translateX }] }]}>
        {DASHES.map((index) => (
          <View key={index} style={[styles.roadDash, { backgroundColor: color }]} />
        ))}
      </Animated.View>
    </View>
  );
}
