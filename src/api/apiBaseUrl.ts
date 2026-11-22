/**
 * Adres backendu baby-zus-backend (bez końcowego `/`). Ustawiany przy budowaniu przez
 * `EXPO_PUBLIC_API_URL` (np. `/api/baby-zus-backend` na środowisku TEST); pusty albo brak — lokalnie port 8080.
 */
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/+$/, '');
