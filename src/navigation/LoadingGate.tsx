import { useCallback, useRef, useState, type ReactNode } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';

import { LoadingScreen } from '@/screens/LoadingScreen';

type Props = { children: ReactNode };

const FADE_OUT_MS = 350;

/**
 * Przy starcie aplikacji kładzie ekran ładowania NAD nawigacją (która w tym czasie już się wczytuje),
 * a po zakończeniu go wygasza i usuwa.
 */
export function LoadingGate({ children }: Props) {
  const [visible, setVisible] = useState(true);
  const [opacity] = useState(() => new Animated.Value(1));
  const finishing = useRef(false);

  const finish = useCallback(() => {
    if (finishing.current) return;
    finishing.current = true;
    Animated.timing(opacity, { toValue: 0, duration: FADE_OUT_MS, useNativeDriver: Platform.OS !== 'web' }).start(() =>
      setVisible(false),
    );
  }, [opacity]);

  return (
    <View style={StyleSheet.absoluteFill}>
      {children}
      {visible ? (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
          <LoadingScreen onFinish={finish} />
        </Animated.View>
      ) : null}
    </View>
  );
}
