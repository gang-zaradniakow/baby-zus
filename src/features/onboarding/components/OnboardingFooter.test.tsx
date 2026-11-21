import { render, screen, userEvent } from '@testing-library/react-native';

import type { OnboardingForm, OnboardingStep } from '../useOnboardingForm';

import { OnboardingFooter } from './OnboardingFooter';

/** Stopka czyta z formularza tylko krok, canContinue, goNext i finish. */
function makeForm(step: OnboardingStep, canContinue = true) {
  return { step, canContinue, goNext: jest.fn(), finish: jest.fn() } as unknown as OnboardingForm;
}

describe('OnboardingFooter', () => {
  it('krok 1: brak przycisku — wybór karty sam przechodzi dalej', async () => {
    await render(<OnboardingFooter form={makeForm(1)} />);
    expect(screen.queryByRole('button')).not.toBeOnTheScreen();
  });

  it('krok pośredni: „Dalej” przechodzi do następnego kroku', async () => {
    const form = makeForm(2);
    const user = userEvent.setup();
    await render(<OnboardingFooter form={form} />);

    await user.press(screen.getByRole('button', { name: 'Dalej' }));

    expect(form.goNext).toHaveBeenCalledTimes(1);
  });

  it('krok pośredni bez kompletu danych: „Dalej” wyłączony', async () => {
    await render(<OnboardingFooter form={makeForm(3, false)} />);
    expect(screen.getByRole('button', { name: 'Dalej' })).toBeDisabled();
  });

  it('ostatni krok: przycisk kończy kreator', async () => {
    const form = makeForm(4);
    const user = userEvent.setup();
    await render(<OnboardingFooter form={form} />);

    await user.press(screen.getByRole('button', { name: 'Zakończ i uruchom asystenta' }));

    expect(form.finish).toHaveBeenCalledTimes(1);
  });
});
