import { Card } from '@/components/atoms/Card';
import { SegmentedControl } from '@/components/molecules/SegmentedControl';
import type { BenefitVariant } from '@/domain/calculator/BenefitSimulation';

type Props = {
  value: BenefitVariant;
  onChange: (variant: BenefitVariant) => void;
};

const OPTIONS: { value: BenefitVariant; label: string }[] = [
  { value: 'standard', label: '100% + 70%' },
  { value: 'averaged', label: '81,5%' },
];

/** Wariant zasiłku: 100% za macierzyński + 70% za rodzicielski albo 81,5% przez cały okres. */
export function VariantPicker({ value, onChange }: Props) {
  return (
    <Card>
      <SegmentedControl label="Wariant" options={OPTIONS} value={value} onChange={onChange} />
    </Card>
  );
}
