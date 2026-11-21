import { CheckboxRow } from '@/components/molecules/CheckboxRow';
import { SliderField } from '@/components/molecules/SliderField';
import type { FatherPlan } from '@/domain/calculator/BenefitSimulation';
import { useLegalParams } from '@/params';

type Props = {
  plan: FatherPlan;
  /** Wymiar urlopów dla tej sytuacji (z wyniku symulacji). */
  maternityWeeks: number;
  parentalWeeks: number;
  /** Przejęcie macierzyńskiego tylko przy porodzie. */
  canTakeOverMaternity: boolean;
  onChange: (patch: Partial<FatherPlan>) => void;
};

/** Plan taty: ojcowski, ile tygodni rodzicielskiego i ile macierzyńskiego przejmuje. */
export function FatherPlanFields({ plan, maternityWeeks, parentalWeeks, canTakeOverMaternity, onChange }: Props) {
  const { params } = useLegalParams();
  const maxParental = Math.max(0, parentalWeeks - params.nonTransferableWeeks);
  const maxTakeover = Math.max(0, maternityWeeks - params.motherOnlyMaternityWeeks);

  return (
    <>
      <CheckboxRow
        label={`Urlop ojcowski (${params.paternityWeeks} tyg.)`}
        checked={plan.paternity}
        onToggle={() => onChange({ paternity: !plan.paternity })}
      />
      <SliderField
        label="Rodzicielski taty"
        unit="tyg."
        value={Math.min(plan.parentalWeeks, maxParental)}
        min={0}
        max={maxParental}
        onChange={(parentalWeeks) => onChange({ parentalWeeks })}
      />
      {canTakeOverMaternity ? (
        <SliderField
          label="Przejmuje część macierzyńskiego"
          unit="tyg."
          value={Math.min(plan.maternityTakeover, maxTakeover)}
          min={0}
          max={maxTakeover}
          onChange={(maternityTakeover) => onChange({ maternityTakeover })}
        />
      ) : null}
    </>
  );
}
