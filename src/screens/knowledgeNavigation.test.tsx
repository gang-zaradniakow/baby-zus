import { Stack } from 'expo-router';
import { userEvent } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';

import { ThemeProvider } from '@/theme';

import { ArticleScreen } from './ArticleScreen';
import { ChapterScreen } from './ChapterScreen';
import { KnowledgeScreen } from './KnowledgeScreen';

/** Prawdziwy routing expo-router z ekranami Wiedzy — jak w `src/app/(tabs)/wiedza/`. */
async function renderKnowledge(initialUrl = '/wiedza') {
  return renderRouter(
    {
      _layout: () => (
        <ThemeProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </ThemeProvider>
      ),
      'wiedza/index': KnowledgeScreen,
      'wiedza/[chapterId]': ChapterScreen,
      'wiedza/artykul/[articleId]': ArticleScreen,
    },
    { initialUrl },
  );
}

describe('Wiedza — nawigacja', () => {
  it('lista rozdziałów → rozdział → artykuł → wróć do rozdziału', async () => {
    const user = userEvent.setup();
    const app = await renderKnowledge();

    expect(screen.getByRole('header', { name: 'Wiedza' })).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: /^W ciąży\./ }));

    expect(app).toHavePathname('/wiedza/ciaza');
    expect(screen.getByRole('header', { name: 'W ciąży' })).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: /^Zwolnienie lekarskie w ciąży/ }));

    expect(app).toHavePathname('/wiedza/artykul/l4-ciaza');
    expect(screen.getByText('WAŻNE!')).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'W ciąży' }));

    expect(app).toHavePathname('/wiedza/ciaza');
  });

  it('wyszukiwarka pokazuje pasujące artykuły zamiast rozdziałów', async () => {
    const user = userEvent.setup();
    await renderKnowledge();

    await user.type(screen.getByLabelText('Szukaj w poradniku'), 'ojcowski');

    expect(screen.getByRole('button', { name: /^Za okres urlopu ojcowskiego/ })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /^Zanim zaczniesz/ })).not.toBeOnTheScreen();
  });

  it('brak wyników — podpowiedź zamiast pustej listy', async () => {
    const user = userEvent.setup();
    await renderKnowledge();

    await user.type(screen.getByLabelText('Szukaj w poradniku'), 'xyzxyz');

    expect(screen.getByText(/Nic nie znaleźliśmy/)).toBeOnTheScreen();
  });

  it('artykuł otwarty prosto z linku: „Wróć” prowadzi do jego rozdziału', async () => {
    const user = userEvent.setup();
    const app = await renderKnowledge('/wiedza/artykul/ojcowski');

    await user.press(screen.getByRole('button', { name: 'Po narodzinach i przyjęciu dziecka' }));

    expect(app).toHavePathname('/wiedza/po');
  });

  it('nieznany artykuł — komunikat zamiast pustego ekranu', async () => {
    await renderKnowledge('/wiedza/artykul/nie-ma');
    expect(screen.getByRole('header', { name: 'Nie ma takiego artykułu' })).toBeOnTheScreen();
  });
});
