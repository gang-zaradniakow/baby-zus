import { render, screen, userEvent } from '@testing-library/react-native';

import type { OnboardingForm } from '../useOnboardingForm';

import { OnboardingFooter } from './OnboardingFooter';

/** Stopka czyta z formularza tylko autoAdvances, isLastStep, canContinue, goNext i finish. */
function makeForm({ autoAdvances = false, isLastStep = false, canContinue = true } = {}) {
  return { autoAdvances, isLastStep, canContinue, goNext: jest.fn(), finish: jest.fn() } as unknown as OnboardingForm;
}

describe('OnboardingFooter', () => {
  it('krok jednokrotnego wyboru: brak przycisku — wybór karty sam przechodzi dalej', async () => {
    await render(<OnboardingFooter form={makeForm({ autoAdvances: true })} />);
    expect(screen.queryByRole('button')).not.toBeOnTheScreen();
  });

  it('krok pośredni: „Dalej” przechodzi do następnego kroku', async () => {
    const form = makeForm();
    const user = userEvent.setup();
    await render(<OnboardingFooter form={form} />);

    await user.press(screen.getByRole('button', { name: 'Dalej' }));

    expect(form.goNext).toHaveBeenCalledTimes(1);
  });

  it('krok pośredni bez kompletu danych: „Dalej” wyłączony', async () => {
    await render(<OnboardingFooter form={makeForm({ canContinue: false })} />);
    expect(screen.getByRole('button', { name: 'Dalej' })).toBeDisabled();
  });

  it('ostatni krok: przycisk kończy ankietę', async () => {
    const form = makeForm({ isLastStep: true });
    const user = userEvent.setup();
    await render(<OnboardingFooter form={form} />);

    await user.press(screen.getByRole('button', { name: 'Zakończ i uruchom asystenta' }));

    expect(form.finish).toHaveBeenCalledTimes(1);
  });
});
