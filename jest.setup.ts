/**
 * Uruchamiany przed każdym plikiem testów.
 * Matchery RNTL (toBeChecked, toBeDisabled, toHaveTextContent…) ładują się same
 * z `@testing-library/react-native`.
 */

// Marginesy bezpieczne (notch) nie istnieją w środowisku testów — biblioteka dostarcza atrapę.
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

// Testy nie łączą się z backendem: każde zapytanie kończy się błędem sieci, więc aplikacja zostaje
// przy danych lokalnych. Test, który sprawdza integrację z API, podmienia `fetch` u siebie.
globalThis.fetch = jest.fn(() => Promise.reject(new Error('Brak sieci w testach'))) as jest.Mock;
const warn = console.warn;
jest.spyOn(console, 'warn').mockImplementation((message?: unknown, ...rest: unknown[]) => {
  if (typeof message === 'string' && /z backendu niedostępne/.test(message)) return;
  warn(message, ...rest);
});
