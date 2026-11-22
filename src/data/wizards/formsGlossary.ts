/**
 * Słowniczek formularzy ZUS (z prototypu, js/data.js: FORMS). Źródłem jest backend (`GET /api/v1/content/forms`);
 * ta lista to zapas, gdy backend jest niedostępny.
 */
export const FORMS_GLOSSARY: readonly { code: string; description: string }[] = [
  { code: 'ZAM', description: 'Wniosek o zasiłek macierzyński — za urlop macierzyński, rodzicielski i ojcowski (od 24.10.2026 zastępuje też ZUR i ZAO)' },
  { code: 'ZAS-53', description: 'Wniosek o zasiłek chorobowy — np. osoba prowadząca firmę (do ZUS)' },
  { code: 'Z-3', description: 'Zaświadczenie płatnika składek dla pracownika (przekazuje pracodawca)' },
  { code: 'Z-3a', description: 'Zaświadczenie płatnika składek dla zleceniobiorcy (przekazuje zleceniodawca)' },
  { code: 'ZAS-12', description: 'Zaświadczenie płatnika składek na dalszy okres zasiłku' },
  { code: 'Z-15A', description: 'Wniosek o zasiłek opiekuńczy na dziecko' },
  { code: 'Z-12', description: 'Wniosek o zasiłek pogrzebowy' },
  { code: 'ZUS ZUA', description: 'Zgłoszenie do ubezpieczeń (np. ponowne do dobrowolnego chorobowego)' },
  { code: 'ZUS ZCNA', description: 'Zgłoszenie członka rodziny (dziecka) do ubezpieczenia zdrowotnego' },
  { code: 'e-ZLA', description: 'Elektroniczne zwolnienie lekarskie („L4”); kod B = ciąża' },
  { code: 'Z-3b', description: 'Zlikwidowany od 24.10.2026 — przedsiębiorca nie składa już tego zaświadczenia' },
];
