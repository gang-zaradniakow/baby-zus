import { useState } from 'react';

import { useZusData } from '@/features/zus/useZusData';
import { useToday } from '@/hooks/useToday';
import { useLegalParams } from '@/params';
import { useSession } from '@/session';

import { applyZusAccount } from './applyZusAccount';
import type { CalculatorForm, CalculatorSituation, FormParent, PersonForm } from './CalculatorForm';
import { computeCalculation } from './computeCalculation';
import { createCalculatorForm } from './createCalculatorForm';

type Patch<K extends keyof CalculatorForm> = Partial<CalculatorForm[K]>;

/**
 * Stan kalkulatora: formularz wypełniony z ankiety, nazwane zmiany pól i wynik liczony na bieżąco.
 * `initialSituation` — np. z przycisku „Policz” w artykule.
 */
export function useCalculatorForm(initialSituation?: CalculatorSituation) {
  const today = useToday();
  const { profile, isSignedIn } = useSession();
  const zus = useZusData();
  const { params } = useLegalParams();

  /** Formularz z ankiety; po zalogowaniu moja osoba dostaje podstawy z eZUS. */
  const initialForm = (situation?: CalculatorSituation): CalculatorForm => {
    const form = createCalculatorForm(profile, today, situation, params);
    if (!isSignedIn || !zus) return form;
    const me: FormParent = profile?.role === 'tata' ? 'father' : 'mother';
    return { ...form, [me]: applyZusAccount(form[me], zus.account, params) };
  };

  const [form, setForm] = useState<CalculatorForm>(() => initialForm(initialSituation));

  // Zakładka zostaje zamontowana — nowa ankieta, osoba z Panelu demo albo logowanie wypełniają formularz od nowa.
  const [source, setSource] = useState({ profile, isSignedIn });
  if (source.profile !== profile || source.isSignedIn !== isSignedIn) {
    setSource({ profile, isSignedIn });
    setForm(initialForm(form.situation));
  }

  const set = <K extends keyof CalculatorForm>(key: K, value: CalculatorForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const patch = <K extends 'preterm' | 'adoption' | 'fatherPlan' | 'work' | 'pregnancy'>(key: K, value: Patch<K>) =>
    setForm((f) => ({ ...f, [key]: { ...f[key], ...value } }));

  return {
    form,
    result: computeCalculation(form, today, params),
    setSituation: (situation: CalculatorSituation) => set('situation', situation),
    setDateText: (dateText: string) => set('dateText', dateText),
    setChildrenCount: (childrenCount: number) => set('childrenCount', childrenCount),
    setZaZyciem: (zaZyciem: boolean) => set('zaZyciem', zaZyciem),
    setVariant: (variant: CalculatorForm['variant']) => set('variant', variant),
    patchPreterm: (value: Patch<'preterm'>) => patch('preterm', value),
    patchAdoption: (value: Patch<'adoption'>) => patch('adoption', value),
    patchFatherPlan: (value: Patch<'fatherPlan'>) => patch('fatherPlan', value),
    patchWork: (value: Patch<'work'>) => patch('work', value),
    patchPregnancy: (value: Patch<'pregnancy'>) => patch('pregnancy', value),
    /** Zmiana osoby czystą funkcją z `personForm.ts` (toggleTitle, patchTitle, patchZ3Month…). */
    updatePerson: (who: FormParent, update: (person: PersonForm) => PersonForm) =>
      setForm((f) => ({ ...f, [who]: update(f[who]) })),
    /** Wraca do danych z ankiety (i z eZUS po zalogowaniu). */
    reset: () => setForm(initialForm(form.situation)),
  };
}

export type CalculatorFormApi = ReturnType<typeof useCalculatorForm>;
