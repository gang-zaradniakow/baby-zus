import { render, screen } from '@testing-library/react-native';
import type { ComponentType } from 'react';

import { AssistantScreen } from './AssistantScreen';
import { CalculatorScreen } from './CalculatorScreen';
import { MessagesScreen } from './MessagesScreen';

/** Ekrany-zaślepki zakładek: na razie tylko nagłówek i opis, treść dojdzie w kolejnych krokach. */
describe.each<[string, ComponentType, string]>([
  ['AssistantScreen', AssistantScreen, 'Asystent'],
  ['CalculatorScreen', CalculatorScreen, 'Kalkulator'],
  ['MessagesScreen', MessagesScreen, 'Wiadomości'],
])('%s', (_name, Screen, title) => {
  it(`pokazuje nagłówek „${title}”`, async () => {
    await render(<Screen />);
    expect(screen.getByRole('header', { name: title })).toBeOnTheScreen();
  });
});
