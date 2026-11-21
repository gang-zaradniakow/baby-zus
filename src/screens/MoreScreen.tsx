import { LogOut } from 'lucide-react-native';

import { Button } from '@/components/atoms/Button';
import { ScreenLayout } from '@/components/templates/ScreenLayout';
import { useSession } from '@/session';

export function MoreScreen() {
  const { isSignedIn, signOut, resetProfile } = useSession();

  return (
    <ScreenLayout title="Więcej" subtitle="Profil, ustawienia i kontakt z ZUS.">
      {isSignedIn ? (
        <Button title="Wyloguj" variant="secondary" icon={LogOut} onPress={signOut} />
      ) : (
        <Button
          title="Usuń moje odpowiedzi i zacznij od nowa"
          variant="secondary"
          icon={LogOut}
          onPress={resetProfile}
        />
      )}
    </ScreenLayout>
  );
}
