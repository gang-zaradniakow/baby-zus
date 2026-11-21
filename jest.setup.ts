/**
 * Uruchamiany przed każdym plikiem testów.
 * Matchery RNTL (toBeChecked, toBeDisabled, toHaveTextContent…) ładują się same
 * z `@testing-library/react-native`.
 */

// Marginesy bezpieczne (notch) nie istnieją w środowisku testów — biblioteka dostarcza atrapę.
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
