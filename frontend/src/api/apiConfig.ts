import { Platform } from 'react-native';

/**
 * Adres backendu. Kolejność źródeł:
 * 1. web z serwerem frontendu (TEST/PROD) — `/config.json`: nginx zapisuje go przy starcie kontenera ze
 *    zmiennej `API_URL`, więc ten sam obraz Dockera ma inny adres na TEST i na PROD. Jeśli `/config.json`
 *    istnieje, liczy się **tylko on** (także pusty) — żeby frontend z TEST nigdy nie trafił do PROD przez
 *    adres zapasowy z `.env.production`;
 * 2. `EXPO_PUBLIC_API_URL` z plików `.env*` — lokalnie (`expo start`, brak `/config.json`) i w aplikacji
 *    mobilnej (wpisywany przy budowaniu);
 * 3. brak — aplikacja liczy wszystko lokalnie (jak przed podłączeniem backendu).
 */

type RuntimeConfig = { apiUrl?: string };

/** Pusty, „nieuzupełniony” przez envsubst albo z końcowym ukośnikiem adres → null / bez ukośnika. */
export function normalizeApiUrl(value: string | undefined | null): string | null {
  const trimmed = (value ?? '').trim();
  if (!trimmed || trimmed.includes('${')) return null;
  return trimmed.replace(/\/+$/, '');
}

/** `/config.json` serwera frontendu; `null` — nie ma go (aplikacja mobilna albo lokalny serwer developerski). */
async function readRuntimeConfig(): Promise<RuntimeConfig | null> {
  if (Platform.OS !== 'web') return null;
  try {
    const response = await fetch('/config.json', { cache: 'no-store' });
    if (!response.ok) return null;
    return (await response.json()) as RuntimeConfig;
  } catch {
    // Lokalny serwer developerski nie ma /config.json (albo zwraca HTML) — wtedy bierzemy adres z .env.
    return null;
  }
}

let cached: Promise<string | null> | null = null;

/** Adres API albo `null`, gdy backend nie jest skonfigurowany. Wynik zapamiętujemy na czas działania aplikacji. */
export function resolveApiBaseUrl(): Promise<string | null> {
  cached ??= readRuntimeConfig().then((runtime) =>
    runtime
      ? normalizeApiUrl(runtime.apiUrl)
      : // Literalnie `process.env.EXPO_PUBLIC_API_URL` — tylko tak Expo wpisuje wartość przy bundlowaniu.
        normalizeApiUrl(process.env.EXPO_PUBLIC_API_URL),
  );
  return cached;
}

/** Tylko do testów: zapomina zapamiętany adres. */
export function resetApiConfigForTests(): void {
  cached = null;
}
