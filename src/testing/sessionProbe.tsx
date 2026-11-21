import { useSession } from '@/session';

type Session = ReturnType<typeof useSession>;

/**
 * Niewidoczny komponent, który odsłania stan sesji w teście ekranu.
 * Renderuj `<Probe />` obok ekranu (w tym samym providerze) i czytaj `session()`.
 */
export function createSessionProbe() {
  let latest: Session | null = null;

  function Probe() {
    latest = useSession();
    return null;
  }

  function session(): Session {
    if (!latest) throw new Error('SessionProbe nie został wyrenderowany.');
    return latest;
  }

  return { Probe, session };
}
