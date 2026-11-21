import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { useTheme } from '@/theme';

import { styles } from './Button.styles';
import { resolveButtonColors, type ButtonVariant } from './resolveButtonColors';

type Props = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: LucideIcon;
  disabled?: boolean;
  /** Pokazuje kręciołek zamiast treści i blokuje ponowne kliknięcie. */
  loading?: boolean;
};

/** Pełnej szerokości przycisk-„pigułka” (h-14 rounded-full z prototypu). */
export function Button({ title, onPress, variant = 'primary', icon: Icon, disabled = false, loading = false }: Props) {
  const { colors } = useTheme();
  const tint = resolveButtonColors(variant, colors);
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: tint.background, borderColor: tint.border },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={tint.text} />
      ) : (
        <>
          {Icon ? <Icon color={tint.text} size={20} /> : null}
          <AppText variant="button" color={tint.text}>
            {title}
          </AppText>
        </>
      )}
    </Pressable>
  );
}
