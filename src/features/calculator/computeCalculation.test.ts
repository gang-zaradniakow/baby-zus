import { day } from '@/testing/dates';

import type { CalculatorForm } from './CalculatorForm';
import { computeCalculation } from './computeCalculation';
import { createCalculatorForm } from './createCalculatorForm';
import { patchZ3Month, toggleTitle } from './personForm';

const today = day(2026, 11, 21);
const baseForm = (patch: Partial<CalculatorForm> = {}): CalculatorForm => ({
  ...createCalculatorForm(null, today),
  ...patch,
});

describe('computeCalculation', () => {
  it('ciąża: L4 z etatu — wynagrodzenie od pracodawcy i zasiłek', () => {
    const result = computeCalculation(baseForm({ situation: 'pregnancy' }), today);

    expect(result.kind).toBe('pregnancy');
    if (result.kind !== 'pregnancy') return;
    expect(result.sickPay.parts.map((p) => p.days)).toEqual([33, 27]);
    expect(result.allowance).toBeNull();
  });

  it('ciąża bez ubezpieczenia — brak zasiłku, po porodzie świadczenie z gminy', () => {
    const form = baseForm({ situation: 'pregnancy' });
    const result = computeCalculation({ ...form, mother: toggleTitle(form.mother, 'none') }, today);

    if (result.kind !== 'pregnancy') throw new Error('oczekiwano ciąży');
    expect(result.sickPay.parts).toEqual([]);
    expect(result.allowance?.kind).toBe('municipal');
    expect(result.checks.some((c) => /Brak ubezpieczenia/.test(c.text))).toBe(false); // pokaże to karta wyniku
  });

  it('poród: symulacja z datą z formularza, wyjaśnienia mamy i taty', () => {
    const result = computeCalculation(baseForm({ dateText: '01.12.2026' }), today);

    if (result.kind !== 'benefit') throw new Error('oczekiwano porodu');
    expect(result.simulation.segments[0].from).toEqual(day(2026, 12, 1));
    expect(result.checks.some((c) => c.text.startsWith('Mama: ubezpieczenie chorobowe'))).toBe(true);
    expect(result.checks.some((c) => c.text.startsWith('Tata: ubezpieczony'))).toBe(true);
  });

  it('Z-3: podstawa etatu ze średniej miesięcy', () => {
    const form = baseForm();
    let mother = { ...form.mother, useZ3: true };
    for (let i = 0; i < 12; i += 1) mother = patchZ3Month(mother, i, { amount: 8000 });

    const result = computeCalculation({ ...form, mother }, today);

    expect(result.mother.z3?.monthsUsed).toBe(12);
    expect(result.mother.resolution.base).toBeCloseTo(8000 * (1 - 0.1371), 2);
  });

  it('mama bez ubezpieczenia — świadczenie zastępcze, bez zdublowanego komunikatu', () => {
    const form = baseForm();
    const result = computeCalculation({ ...form, mother: toggleTitle(form.mother, 'none') }, today);

    expect(result.allowance?.kind).toBe('municipal');
    expect(result.checks.some((c) => /^Mama: brak ubezpieczenia/.test(c.text))).toBe(false);
  });
});
