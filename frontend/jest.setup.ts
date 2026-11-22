/**
 * Uruchamiany przed każdym plikiem testów.
 * Matchery RNTL (toBeChecked, toBeDisabled, toHaveTextContent…) ładują się same
 * z `@testing-library/react-native`.
 */

// Marginesy bezpieczne (notch) nie istnieją w środowisku testów — biblioteka dostarcza atrapę.
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

// Jest wczytuje .env.development (adres lokalnego backendu). Testy mają działać bez sieci, więc domyślnie
// backend jest „nieskonfigurowany” — aplikacja liczy lokalnie. Testy integracji z API ustawiają adres same.
process.env.EXPO_PUBLIC_API_URL = '';

// Gdyby test ustawił adres, ale nie podmienił `fetch`, zapytanie kończy się błędem sieci (a nie prawdziwym ruchem).
globalThis.fetch = jest.fn(() => Promise.reject(new Error('Brak sieci w testach'))) as jest.Mock;

// Powrót do danych lokalnych to w testach oczekiwana ścieżka — wyciszamy jej ostrzeżenia, resztę przepuszczamy.
const warn = console.warn;
jest.spyOn(console, 'warn').mockImplementation((message?: unknown, ...rest: unknown[]) => {
  if (typeof message === 'string' && /z backendu niedostęp/.test(message)) return;
  warn(message, ...rest);
});
