import type { BenefitSegment } from '@/domain/calculator/BenefitSimulation';
import type { ThemeColors } from '@/theme';

export type SegmentColors = { background: string; text: string };

/**
 * Kolor odcinka na osi czasu: 100% — zieleń, 81,5% — niebieski, 70% — jasna zieleń,
 * praca na urlopie (zasiłek pomniejszony) — brzoskwinia. Jak w prototypie, ale z tokenów motywu.
 */
export function resolveSegmentColors(segment: Pick<BenefitSegment, 'rate' | 'factor'>, colors: ThemeColors): SegmentColors {
  if (segment.factor < 1) return { background: colors.accentSoft, text: colors.textPrimary };
  if (segment.rate >= 1) return { background: colors.primary, text: colors.onPrimary };
  if (segment.rate > 0.75) return { background: colors.info, text: colors.onPrimary };
  return { background: colors.primarySoft, text: colors.primary };
}
