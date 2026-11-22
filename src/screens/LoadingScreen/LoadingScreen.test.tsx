import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { LoadingScreen } from './LoadingScreen';

describe('LoadingScreen', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('pokazuje postęp ładowania i ciekawostkę', async () => {
    await render(<LoadingScreen onFinish={jest.fn()} />);
    expect(screen.getByText('Ładuję wiedzę z poradnika…')).toBeOnTheScreen();
    expect(screen.getByText('Czy wiesz, że…')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /^Dalej/ })).toBeNull();
  });

  it('po załadowaniu odlicza „Dalej (n)” i samo przechodzi dalej', async () => {
    const onFinish = jest.fn();
    await render(<LoadingScreen onFinish={onFinish} />);

    await act(async () => jest.advanceTimersByTime(3000));
    expect(screen.getByText('Gotowe!')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Dalej (4)' })).toBeOnTheScreen();

    for (let second = 0; second < 4; second += 1) {
      await act(async () => jest.advanceTimersByTime(1000));
    }
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('„Pomiń” kończy od razu', async () => {
    const onFinish = jest.fn();
    await render(<LoadingScreen onFinish={onFinish} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Pomiń ekran ładowania' }));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });
});
