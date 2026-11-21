import type { AllowanceInstead } from '@/domain/calculator/allowanceInstead';
import { formatMoney } from '@/utils/formatMoney';

import { ResultHero } from './ResultHero';

type Props = {
  allowance: AllowanceInstead;
  /** Np. „Po porodzie: ” przy L4 w ciąży. */
  prefix?: string;
};

/** Świadczenie zamiast zasiłku z ZUS — gmina albo KRUS, 1000 zł/mies. */
export function AllowanceCard({ allowance, prefix = '' }: Props) {
  return (
    <ResultHero
      kind="alt"
      label={`${prefix}${allowance.title}`}
      value={formatMoney(allowance.monthly, 0)}
      unit="/mies."
      caption={`przez ${allowance.weeks} tyg. · bez podatku · ${allowance.payer}`}
    />
  );
}
