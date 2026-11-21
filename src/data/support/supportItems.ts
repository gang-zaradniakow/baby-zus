/**
 * Co pokazujemy w trybie wsparcia po stracie (z prototypu: `vSupportHome`). Link do kreatora Z-12
 * prowadzi na razie do artykułu Wiedzy (Faza 7).
 */
export type SupportItem = {
  title: string;
  description: string;
  /** Adres w aplikacji. */
  href: string;
};

export type LossKind = 'pregnancyLoss' | 'childDeath';

export const SUPPORT_ITEMS: Record<LossKind, readonly SupportItem[]> = {
  pregnancyLoss: [
    {
      title: 'Zasiłek macierzyński — 8 tygodni',
      description:
        'Przysługuje, gdy dziecko urodziło się martwe — bez względu na tydzień ciąży, na podstawie zaświadczenia o martwym urodzeniu od lekarza ginekologa lub położnej. 100% podstawy.',
      href: '/wiedza/artykul/martwe-urodzenie',
    },
    {
      title: 'Zasiłek pogrzebowy — 7000 zł',
      description: 'Pełna kwota dla rodziców, nawet przy niższych kosztach. Wniosek Z-12 do 12 miesięcy od pochówku.',
      href: '/wiedza/artykul/pogrzebowy',
    },
    {
      title: 'Jeśli nie było zaświadczenia o martwym urodzeniu',
      description: 'Lekarz może wystawić zwolnienie lekarskie. Zapytaj nas — pomożemy ustalić, co Ci przysługuje.',
      href: `/asystent?pytanie=${encodeURIComponent('Straciłam ciążę — co mi przysługuje?')}`,
    },
  ],
  childDeath: [
    {
      title: 'Zasiłek macierzyński',
      description:
        'Przed 8. tygodniem życia: 8 tygodni po porodzie, nie krócej niż 7 dni od śmierci. Później: 7 dni od śmierci. 100% podstawy.',
      href: '/wiedza/artykul/martwe-urodzenie',
    },
    {
      title: 'Zasiłek pogrzebowy — 7000 zł',
      description: 'Wniosek Z-12 w ciągu 12 miesięcy od pochówku.',
      href: '/wiedza/artykul/pogrzebowy',
    },
    {
      title: 'Rozmowa z ekspertem ZUS',
      description:
        'Jeśli coś się nie zgadza w Twojej sprawie — napisz na mama@zus.pl albo umów e-wizytę. Wyjaśnimy to za Ciebie.',
      href: '/wiecej/kontakt',
    },
  ],
};
