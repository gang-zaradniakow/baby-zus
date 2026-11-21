import { act, userEvent } from '@testing-library/react-native';
import { Slot } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';

import { LegalParamsProvider } from '@/params';
import { SessionProvider } from '@/session';
import { makeProfile } from '@/testing/profiles';
import { createSessionProbe } from '@/testing/sessionProbe';
import { ThemeProvider } from '@/theme';

import { KnowledgeScreen } from '../KnowledgeScreen';

import { AssistantScreen } from './AssistantScreen';

async function renderAssistant(initialUrl = '/asystent') {
  const probe = createSessionProbe();
  const app = await renderRouter(
    {
      _layout: () => (
        <ThemeProvider>
          <LegalParamsProvider>
            <SessionProvider>
              <Slot />
              <probe.Probe />
            </SessionProvider>
          </LegalParamsProvider>
        </ThemeProvider>
      ),
      asystent: AssistantScreen,
      'wiedza/index': KnowledgeScreen,
    },
    { initialUrl },
  );
  return { app, session: probe.session };
}

describe('AssistantScreen', () => {
  it('pytanie → odpowiedź z bazy wiedzy ze źródłem i oceną', async () => {
    const user = userEvent.setup();
    await renderAssistant();

    await user.type(screen.getByLabelText('Twoje pytanie'), 'Ile dostanę na L4 w ciąży?');
    await user.press(screen.getByRole('button', { name: 'Wyślij' }));

    expect(screen.getByText('Ile dostanę na L4 w ciąży?')).toBeOnTheScreen();
    expect(screen.getByText(/Okres zasiłkowy w ciąży to/)).toBeOnTheScreen();
    expect(screen.getByText('Źródło: Poradnik, s. 23–25')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Pomocne' }));
    expect(screen.getByRole('button', { name: '✓ Pomocne' })).toBeOnTheScreen();
  });

  it('podpowiedzi na start zależą od etapu z ankiety, a „Dla Ciebie” od profilu', async () => {
    const user = userEvent.setup();
    const { session } = await renderAssistant();
    await act(() => session().completeOnboarding(makeProfile({ eventDate: '2026-11-01', name: 'Ola' })));

    expect(screen.getByText(/Cześć, Ola!/)).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Urlop ojcowski — ile i do kiedy?' }));

    expect(screen.getByText(/urlop ojcowski musi się skończyć przed 01\.11\.2027/)).toBeOnTheScreen();
  });

  it('podobne pytanie zadaje się jednym dotknięciem', async () => {
    const user = userEvent.setup();
    await renderAssistant();

    await user.press(screen.getByRole('button', { name: 'Ile trwa urlop macierzyński?' }));
    expect(screen.getByText('Podobne pytania')).toBeOnTheScreen();
    const sourcesBefore = screen.getAllByText(/^Źródło:/).length;

    // Pierwsze podobne pytanie — przycisk z pytaniem pod odpowiedzią.
    const related = screen.getAllByRole('button').find((b) => /\?$/.test(b.props.accessibilityLabel ?? ''));
    await user.press(related!);

    expect(screen.getAllByText(/^Źródło:/)).toHaveLength(sourcesBefore + 1);
  });

  it('bez pewnej odpowiedzi — uczciwe „nie wiem” i kontakt z ZUS', async () => {
    const user = userEvent.setup();
    await renderAssistant();

    await user.type(screen.getByLabelText('Twoje pytanie'), 'xyz qwerty');
    await user.press(screen.getByRole('button', { name: 'Wyślij' }));

    expect(screen.getByText(/wolę nie zgadywać/)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Kontakt z ZUS' })).toBeOnTheScreen();
  });

  it('?pytanie= w adresie zadaje pytanie od razu', async () => {
    await renderAssistant(`/asystent?pytanie=${encodeURIComponent('Ile wynosi zasiłek pogrzebowy?')}`);
    expect(screen.getByText('Ile wynosi zasiłek pogrzebowy?')).toBeOnTheScreen();
    expect(screen.getAllByText(/7000 zł/).length).toBeGreaterThan(0);
  });

  it('Wiedza bez wyników → „Zapytaj asystenta” z tym samym pytaniem', async () => {
    const user = userEvent.setup();
    const { app } = await renderAssistant('/wiedza');

    await user.type(screen.getByLabelText('Szukaj w poradniku'), 'xyzxyz');
    await user.press(screen.getByRole('button', { name: 'Zapytaj asystenta' }));

    expect(app).toHavePathname('/asystent');
    expect(screen.getByText('xyzxyz')).toBeOnTheScreen();
  });
});
