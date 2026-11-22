/** Kanały kontaktu z ZUS dla rodziców (z prototypu, `K.INFOLINIA` / `K.COT` / `K.MAMA`). */
export const ZUS_CONTACT = {
  hotline: '22 560 16 00',
  hotlineEmail: 'cot@zus.pl',
  parentsEmail: 'mama@zus.pl',
} as const;

/** Tematy i godziny e-wizyty (zaślepka rezerwacji z prototypu). */
export const E_VISIT_TOPICS: readonly string[] = [
  'Zasiłek macierzyński',
  'Urlopy rodzicielskie',
  'L4 w ciąży',
  'Ubezpieczenie chorobowe',
  'Inne',
];

export const E_VISIT_HOURS: readonly string[] = ['9:00', '10:30', '12:00', '13:30', '15:00'];

/** Stan prawny kalkulatora i treści (`K.STAN_PRAWNY`). */
export const LEGAL_BASIS =
  'ustawa zasiłkowa (Dz.U. 2026 poz. 854), Kodeks pracy (Dz.U. 2026 poz. 1245), rozporządzenie z 27.09.2026 (Dz.U. 2026 poz. 1316), Poradnik ZUS 2026';
