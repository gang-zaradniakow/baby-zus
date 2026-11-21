import { render, screen, userEvent } from '@testing-library/react-native';

import { NamesStep } from './NamesStep';

async function renderStep(asksChildName: boolean) {
  const onChangeName = jest.fn();
  const onChangeChildName = jest.fn();
  await render(
    <NamesStep
      name=""
      childName=""
      asksChildName={asksChildName}
      onChangeName={onChangeName}
      onChangeChildName={onChangeChildName}
    />,
  );
  return { onChangeName, onChangeChildName };
}

describe('NamesStep', () => {
  it('pyta o imię rodzica i dziecka', async () => {
    await renderStep(true);

    expect(screen.getByRole('header', { name: 'Jak masz na imię?' })).toBeOnTheScreen();
    expect(screen.getByLabelText('Twoje imię')).toBeOnTheScreen();
    expect(screen.getByLabelText('Imię dziecka')).toBeOnTheScreen();
  });

  it('w ciąży nie pyta o imię dziecka', async () => {
    await renderStep(false);
    expect(screen.queryByLabelText('Imię dziecka')).not.toBeOnTheScreen();
  });

  it('wpisywanie przekazuje tekst dalej', async () => {
    const { onChangeName, onChangeChildName } = await renderStep(true);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Twoje imię'), 'A');
    await user.type(screen.getByLabelText('Imię dziecka'), 'B');

    expect(onChangeName).toHaveBeenCalledWith('A');
    expect(onChangeChildName).toHaveBeenCalledWith('B');
  });
});
