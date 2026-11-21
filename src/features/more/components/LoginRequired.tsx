import { router } from 'expo-router';
import { LogIn } from 'lucide-react-native';

import { AppText } from '@/components/atoms/AppText';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';

type Props = { reason: string };

/** Ekran wymaga logowania (dane z eZUS, korespondencja) — wyjaśnienie i przycisk mObywatel. */
export function LoginRequired({ reason }: Props) {
  return (
    <Card tone="info" title="Zaloguj się">
      <AppText>{reason}</AppText>
      <Button title="Zaloguj przez mObywatel" variant="mobywatel" icon={LogIn} onPress={() => router.push('/login')} />
    </Card>
  );
}
