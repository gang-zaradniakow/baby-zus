import { render, screen, userEvent } from '@testing-library/react-native';
import { Baby } from 'lucide-react-native';

import { lightColors } from '@/theme';

import { ChoiceCard } from './ChoiceCard';

const NAME = 'Spodziewam się dziecka. Jestem w ciąży';

function renderCard(props: { selected: boolean; onPress?: () => void; tone?: 'primary' | 'accent' }) {
  return render(
    <ChoiceCard
      icon={Baby}
      title="Spodziewam się dziecka"
      subtitle="Jestem w ciąży"
      onPress={props.onPress ?? jest.fn()}
      selected={props.selected}
      tone={props.tone}
    />,
  );
}

describe('ChoiceCard', () => {
  it('jest opcją radio z tytułem i podpisem w nazwie', async () => {
    await renderCard({ selected: true });
    expect(screen.getByRole('radio', { name: NAME })).toBeChecked();
  });

  it('niewybrana: niezaznaczona, z neutralną ramką', async () => {
    await renderCard({ selected: false });

    const card = screen.getByRole('radio', { name: NAME });
    expect(card).not.toBeChecked();
    expect(card).toHaveStyle({ borderColor: lightColors.border, backgroundColor: lightColors.surface });
  });

  it('wybrana: ramka i tło w kolorach tonu', async () => {
    await renderCard({ selected: true, tone: 'accent' });
    expect(screen.getByRole('radio', { name: NAME })).toHaveStyle({
      borderColor: lightColors.accent,
      backgroundColor: lightColors.accentSoft,
    });
  });

  it('dotknięcie wywołuje onPress', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await renderCard({ selected: false, onPress });

    await user.press(screen.getByRole('radio', { name: NAME }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
