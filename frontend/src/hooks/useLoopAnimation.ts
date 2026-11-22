import { useEffect, useState } from 'react';
import { Animated, Easing, Platform } from 'react-native';

/**
 * Wartość animowana zapętlona 0 → 1 w podanym czasie (liniowo), np. do obrotu kół.
 * Na urządzeniach liczy natywny sterownik animacji; web go nie ma, więc tam JS.
 */
export function useLoopAnimation(durationMs: number): Animated.Value {
  const [value] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(value, {
        toValue: 1,
        duration: durationMs,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [value, durationMs]);

  return value;
}
