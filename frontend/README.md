# mZUS dla Rodzica — aplikacja mobilna (React Native / Expo)

Mobilna wersja prototypu „mZUS dla Rodzica”, w kolorystyce i stylu prototypu ZUS baby.
Zasady pisania kodu: **[KONWENCJE.md](KONWENCJE.md)**.

## Uruchomienie

Wymagany Node.js **22.13+** (Expo SDK 58).

```bash
npm install
npm start        # zeskanuj kod QR w aplikacji Expo Go
npm run web      # podgląd w przeglądarce
npm run typecheck
```

## Backend

Dane i parametry pochodzą z [baby-zus-backend](../baby-zus-backend) (kontrakt: `openapi.yaml`).
Adres ustawia zmienna `EXPO_PUBLIC_API_URL` (domyślnie `http://localhost:8080`), np.:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.10:8080 npm start
```

Gdy backend jest niedostępny, aplikacja działa na danych lokalnych z `src/data/`.
Przy `npm run web` backend musi wpuszczać origin podglądu w CORS (`CORS_ALLOWED_ORIGINS=http://localhost:8081`).
