import { LogOut } from 'lucide-react-native';

import { Button } from '@/components/atoms/Button';
import { ScreenLayout } from '@/components/templates/ScreenLayout';
import { useSession } from '@/session';

export function MoreScreen() {
  const { signOut } = useSession();

  return (
    <ScreenLayout title="Więcej" subtitle="Profil, ustawienia i kontakt z ZUS.">
      <Button title="Wyloguj i zacznij od nowa" variant="secondary" icon={LogOut} onPress={signOut} />
    </ScreenLayout>
  );
}
