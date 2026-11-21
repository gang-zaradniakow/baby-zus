/**
 * Organizacje i telefony wsparcia oraz przydatne strony — z prototypu (js/data.js:
 * SUPPORT_ORGS, HELPLINES, LINKS). Dane kontaktowe do weryfikacji przez ZUS przed wdrożeniem.
 */
export type SupportOrganization = {
  name: string;
  topic: string;
  /** Brak adresu — pokazujemy samą nazwę (do uzupełnienia przez ZUS). */
  url?: string;
};

export type Helpline = { number: string; description: string };

export type UsefulLink = { label: string; url: string };

export const SUPPORT_ORGANIZATIONS: readonly SupportOrganization[] = [
  { name: 'Fundacja Rodzić po Ludzku', topic: 'Poronienie, strata ciąży, prawa pacjentki', url: 'https://rodzicpoludzku.pl' },
  { name: 'Stowarzyszenie Rodziców po Poronieniu', topic: 'Wsparcie po poronieniu i martwym urodzeniu' },
  { name: 'Bractwo Małych Stópek', topic: 'Wsparcie rodziców po stracie dziecka' },
  { name: 'Fundacja Wcześniak Rodzice-Rodzicom', topic: 'Wcześniaki: informacje, grupy wsparcia', url: 'https://wczesniak.pl' },
  {
    name: 'Fundacja Gajusz (hospicjum perinatalne, Łódź)',
    topic: 'Ciężka, nieuleczalna choroba dziecka, opieka perinatalna',
    url: 'https://gajusz.org.pl',
  },
  { name: 'Fundacja Warszawskie Hospicjum dla Dzieci', topic: 'Hospicjum perinatalne i domowe' },
  { name: 'Pomorze Dzieciom', topic: 'Hospicjum perinatalne, centrum wsparcia po stracie' },
  {
    name: 'Lista hospicjów perinatalnych (pacjent.gov.pl)',
    topic: 'Hospicja perinatalne wg województw',
    url: 'https://pacjent.gov.pl',
  },
];

export const HELPLINES: readonly Helpline[] = [
  { number: '116 123', description: 'Telefon zaufania dla dorosłych w kryzysie emocjonalnym' },
  { number: '800 120 002', description: 'Niebieska Linia — przemoc w rodzinie' },
  { number: '112', description: 'Numer alarmowy' },
];

export const USEFUL_LINKS: readonly UsefulLink[] = [
  { label: 'ZUS — świadczenia dla rodziców', url: 'https://www.zus.pl' },
  { label: 'Ministerstwo Rodziny — urlop rodzicielski', url: 'https://www.gov.pl/web/rodzina/urlop-rodzicielski' },
  {
    label: 'Państwowa Inspekcja Pracy — rodzicielstwo',
    url: 'https://www.pip.gov.pl/dla-pracodawcow/porady-prawne/rodzicielstwo',
  },
  {
    label: 'Rejestr stanu cywilnego — odpis aktu urodzenia',
    url: 'https://www.gov.pl/web/cyfryzacja/rejestr-stanu-cywilnego',
  },
  { label: 'ZUS dla przyszłych mam i rodziców', url: 'https://www.zus.pl/-/zus-dla-przysz%C5%82ych-mam-i-rodzic%C3%B3w' },
];
