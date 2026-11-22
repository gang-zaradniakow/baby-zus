import type { ViewStyle } from 'react-native';

/** Cienie w składni `boxShadow` (wspierane przez RN na iOS, Androidzie i web). */
export const shadows = {
  soft: { boxShadow: '0px 12px 24px rgba(0, 0, 0, 0.05)' },
  navBar: { boxShadow: '0px -10px 20px rgba(0, 0, 0, 0.02)' },
} satisfies Record<string, ViewStyle>;
