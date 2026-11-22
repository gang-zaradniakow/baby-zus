import { fromPregnancySickness } from './fromPregnancySickness';
import { toPregnancySicknessRequest } from './toPregnancySicknessRequest';

describe('toPregnancySicknessRequest', () => {
  it('pomija wyłączone tytuły i zapisuje kwoty jako Money', () => {
    const request = toPregnancySicknessRequest(
      {
        uop: { on: true, base: 5177.4, atLeastMinWage: true },
        zlec: { on: false, base: 1000, voluntarySickness: true, student: false },
        jdg: { on: true, base: 5652, voluntarySickness: true, startRelief: false, debt: 0 },
        krus: { on: false },
      },
      { days: 60.4, usedDays: -3, age50: false, insuredDays: 400 },
    );

    expect(request).toEqual({
      titles: {
        employment: { base: '5177.40', atLeastMinimumWage: true },
        selfEmployment: { base: '5652.00', voluntarySickness: true, startupRelief: false, debt: '0.00' },
        agriculturalInsurance: false,
      },
      days: 60,
      usedSickPayDays: 0,
      aged50OrMore: false,
      insuredDays: 400,
    });
  });
});

describe('fromPregnancySickness', () => {
  it('zamienia kwoty z tekstu na liczby i poziomy wyjaśnień na małe litery', () => {
    expect(
      fromPregnancySickness({
        checks: [{ level: 'INFO', message: 'Dobrze wiedzieć' }],
        parts: [{ title: 'EMPLOYMENT', label: 'Zasiłek chorobowy', days: 30, rate: 1, amount: '5177.40' }],
        total: '5177.40',
        netTotal: '4556.11',
      }),
    ).toEqual({
      checks: [{ level: 'info', text: 'Dobrze wiedzieć' }],
      parts: [{ label: 'Zasiłek chorobowy', days: 30, rate: 1, amount: 5177.4 }],
      total: 5177.4,
      netTotal: 4556.11,
    });
  });
});
