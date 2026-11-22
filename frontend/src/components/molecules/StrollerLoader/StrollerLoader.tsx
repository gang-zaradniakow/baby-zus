import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useLoopAnimation } from '@/hooks/useLoopAnimation';
import { useTheme } from '@/theme';

import { RoadLine } from './RoadLine';
import { styles } from './StrollerLoader.styles';
import { StrollerWheel } from './StrollerWheel';
import { DRAWING_OFFSET, SCALE, VIEWBOX, WHEEL_CENTERS, WHEEL_RADIUS, WHEEL_TURN_MS } from './strollerGeometry';

const WHEEL_BOX_HALF = (WHEEL_RADIUS + 1) * SCALE;

/** Animowany wózek „w drodze” — ilustracja ekranu ładowania. Dla czytnika ekranu ukryty (ozdoba). */
export function StrollerLoader() {
  const { colors } = useTheme();
  const turn = useLoopAnimation(WHEEL_TURN_MS);

  return (
    <View style={styles.stage} testID="stroller-loader" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <View testID="stroller-halo" style={[styles.halo, { backgroundColor: colors.accentSoft }]} />
      <RoadLine color={colors.borderStrong} shift={turn} />
      <Svg
        style={styles.drawing}
        width={VIEWBOX.width * SCALE}
        height={VIEWBOX.height * SCALE}
        viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
      >
        {/* Budka: ćwiartka koła. */}
        <Path d="M11 26 A15 15 0 0 1 26 11 L26 26 Z" fill={colors.accent} />
        {/* Gondola. */}
        <Path d="M9 26 H47 Q45 36 34 36 H21 Q11 36 9 26 Z" fill={colors.primary} />
        {/* Rączka. */}
        <Path
          d="M45 27 L52 15 H57"
          stroke={colors.primary}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
      {WHEEL_CENTERS.map((center) => (
        <StrollerWheel
          key={center.x}
          color={colors.textPrimary}
          turn={turn}
          left={DRAWING_OFFSET.left + center.x * SCALE - WHEEL_BOX_HALF}
          top={DRAWING_OFFSET.top + center.y * SCALE - WHEEL_BOX_HALF}
        />
      ))}
    </View>
  );
}
