import { LEGAL_PARAMS } from '@/data/legalParams';
import { addDays, toISODate } from '@/domain/dates/calendarDate';
import { formatDate } from '@/domain/dates/formatDate';
import type { ParentProfile } from '@/domain/profile/ParentProfile';
import type { ZusAccountExtras } from '@/domain/zus/ZusAccount';
import type { ZusDocument } from '@/domain/zus/ZusDocument';

/**
 * Przykładowe osoby do Panelu demo (z prototypu, js/data.js: PERSONAS + persona-specyficzne dane
 * w `zusData` i `makeDocs`). Daty liczymy względem dzisiaj. Dane fikcyjne.
 * Zofia ma w prototypie drugą ciążę — profil obsługuje jedno dziecko, więc zostaje Zosia.
 */
export type Persona = {
  id: string;
  name: string;
  label: string;
  description: string;
  profile: (today: Date) => ParentProfile;
  zus: (today: Date) => ZusAccountExtras;
  /** Pisma konkretne dla tej osoby (ogólne dokłada `buildZusDocuments`). */
  documents: (today: Date) => ZusDocument[];
};

const iso = (today: Date, days: number) => toISODate(addDays(today, days));

export const PERSONAS: readonly Persona[] = [
  {
    id: 'anna',
    name: 'Anna',
    label: 'Anna — 28. tydzień ciąży, etat + mała firma',
    description: 'L4 z kodem B, zbieg UoP i JDG, duży pracodawca.',
    profile: (today) => ({
      name: 'Anna',
      role: 'mama',
      stage: 'ciaza',
      eventDate: iso(today, 84),
      childrenCount: 1,
      employment: ['uop', 'jdg'],
      payerSize: 'duzy',
      partner: 'track',
      special: [],
    }),
    zus: (today) => ({
      contributionBase: 9000,
      debt: 0,
      certificates: [
        {
          number: 'ZLA-2026-4418201',
          from: addDays(today, -14),
          to: addDays(today, 16),
          code: 'B',
          indication: '2 — może chodzić',
          status: 'przyjęte, wypłaca pracodawca',
        },
      ],
    }),
    documents: (today) => [
      {
        id: 'anna-ezla',
        title: 'Potwierdzenie przyjęcia zaświadczenia lekarskiego e-ZLA (kod B)',
        date: iso(today, -13),
        from: 'ZUS',
        summary: `Masz zwolnienie z kodem B od ${formatDate(addDays(today, -14))} do ${formatDate(addDays(today, 16))} — przysługuje Ci 100% podstawy. Pierwsze 33 dni w roku płaci pracodawca, potem zasiłek — też wypłaca go Twój pracodawca, bo zatrudnia ponad 20 osób.`,
        todo: 'Nic nie musisz robić. Pamiętaj: na L4 nie wykonuj pracy zarobkowej (także w firmie) — czynności incydentalne są dozwolone.',
        body: `Zakład Ubezpieczeń Społecznych\n\nPotwierdzamy przyjęcie zaświadczenia lekarskiego e-ZLA.\nOkres niezdolności do pracy: ${formatDate(addDays(today, -14))} – ${formatDate(addDays(today, 16))}\nKod literowy: B (niezdolność do pracy przypadająca w okresie ciąży)\nWskazanie lekarskie: 2 – chory może chodzić\nPłatnik zasiłku: pracodawca (powyżej 20 ubezpieczonych)`,
      },
    ],
  },
  {
    id: 'kasia',
    name: 'Kasia',
    label: 'Kasia — JDG, synek ma 16 dni',
    description: 'Termin 81,5% za 5 dni, zaległość w składkach 62,40 zł.',
    profile: (today) => ({
      name: 'Kasia',
      role: 'mama',
      stage: 'dziecko',
      eventDate: iso(today, -16),
      childrenCount: 1,
      employment: ['jdg'],
      partner: 'track',
      special: [],
      childName: 'Staś',
    }),
    zus: () => ({ contributionBase: LEGAL_PARAMS.businessStandardBase, debt: 62.4, certificates: [] }),
    documents: (today) => [
      {
        id: 'kasia-dlug',
        title: 'Informacja o braku wypłaty zasiłku do czasu spłaty zaległości',
        date: iso(today, -2),
        from: 'ZUS Oddział w Warszawie',
        summary:
          'Masz zaległość w składkach: 62,40 zł. Dopóki jej nie spłacisz, ZUS nie wypłaci zasiłku macierzyńskiego. Spłać ją jak najszybciej — jeśli nie zrobisz tego w ciągu 6 miesięcy od porodu, prawo do zasiłku przepadnie.',
        todo: 'Zapłać 62,40 zł na swój numer rachunku składkowego (eZUS → Płatności). Zasiłek wypłacimy z wyrównaniem.',
        body: 'Zakład Ubezpieczeń Społecznych Oddział w Warszawie\n\nNa podstawie art. 2a ust. 1 ustawy z dnia 25 czerwca 1999 r. o świadczeniach pieniężnych z ubezpieczenia społecznego w razie choroby i macierzyństwa informujemy, że w dniu powstania prawa do zasiłku macierzyńskiego na Pani koncie płatnika składek występowało zadłużenie z tytułu składek na ubezpieczenia społeczne w kwocie przekraczającej 1% minimalnego wynagrodzenia (48,06 zł).\nZadłużenie: 62,40 zł.\nZasiłek nie przysługuje do czasu spłaty całości zadłużenia. Prawo do zasiłku przedawnia się, jeżeli zadłużenie nie zostanie uregulowane w ciągu 6 miesięcy od dnia powstania prawa do świadczenia (art. 2a ust. 2).',
      },
    ],
  },
  {
    id: 'ola',
    name: 'Ola',
    label: 'Ola — samodzielna mama wcześniaczki',
    description: '27. tc, 950 g, 7 tyg. w szpitalu: urlop uzupełniający do 15 tyg.',
    profile: (today) => ({
      name: 'Ola',
      role: 'mama',
      stage: 'dziecko',
      eventDate: iso(today, -42),
      childrenCount: 1,
      employment: ['uop'],
      payerSize: 'maly',
      partner: 'single',
      special: ['preterm'],
      childName: 'Lena',
    }),
    zus: () => ({ contributionBase: 5200, debt: 0, certificates: [] }),
    documents: () => [],
  },
  {
    id: 'marek',
    name: 'Marek',
    label: 'Marek — tata, córka ma 10,5 mies.',
    description: 'Urlop ojcowski wygasa za ~5 tygodni, 9 nieprzenoszalnych tygodni rodzicielskiego.',
    profile: (today) => ({
      name: 'Marek',
      role: 'tata',
      stage: 'dziecko',
      eventDate: iso(today, -330),
      childrenCount: 1,
      employment: ['uop'],
      payerSize: 'duzy',
      partner: 'track',
      special: [],
      childName: 'Hania',
    }),
    zus: () => ({ contributionBase: 8200, debt: 0, certificates: [] }),
    documents: () => [],
  },
  {
    id: 'ewa',
    name: 'Ewa',
    label: 'Ewa — rodzina zastępcza, Kuba (2 lata)',
    description: 'Przyjęcie 5 dni temu: wniosek o urlop w ciągu 7 dni.',
    profile: (today) => ({
      name: 'Ewa',
      role: 'opiekun',
      stage: 'adopcja',
      eventDate: iso(today, -5),
      childBirthDate: iso(today, -760),
      childrenCount: 1,
      employment: ['uop'],
      payerSize: 'duzy',
      partner: 'track',
      special: [],
      childName: 'Kuba',
    }),
    zus: () => ({ contributionBase: 6100, debt: 0, certificates: [] }),
    documents: () => [],
  },
  {
    id: 'zofia',
    name: 'Zofia',
    label: 'Zofia — Zosia (14 mies.)',
    description: 'Zasiłek opiekuńczy (e-ZLA kod C), sprawy zakończone w archiwum.',
    profile: (today) => ({
      name: 'Zofia',
      role: 'mama',
      stage: 'dziecko',
      eventDate: iso(today, -425),
      childrenCount: 1,
      employment: ['uop'],
      payerSize: 'duzy',
      partner: 'track',
      special: [],
      childName: 'Zosia',
    }),
    zus: (today) => ({
      contributionBase: 7400,
      debt: 0,
      certificates: [
        {
          number: 'ZLA-2026-2210450',
          from: addDays(today, -68),
          to: addDays(today, -64),
          code: 'C',
          indication: 'opieka nad chorym dzieckiem',
          status: 'zasiłek opiekuńczy 80%',
        },
      ],
    }),
    documents: (today) => [
      {
        id: 'zofia-mac',
        title: 'Informacja o wysokości zasiłku macierzyńskiego (Zosia)',
        date: iso(today, -405),
        from: 'ZUS',
        archived: true,
        read: true,
        summary: 'Zasiłek macierzyński za urlop macierzyński i rodzicielski — 81,5% podstawy. Sprawa zakończona.',
        todo: '—',
        body: 'Dokument archiwalny.',
      },
      {
        id: 'zofia-koniec',
        title: 'Informacja o zakończeniu wypłaty zasiłku macierzyńskiego',
        date: iso(today, -60),
        from: 'ZUS',
        archived: true,
        read: true,
        summary: 'Wypłata zasiłku zakończyła się po wykorzystaniu urlopu rodzicielskiego.',
        todo: '—',
        body: 'Dokument archiwalny.',
      },
    ],
  },
];

export const findPersona = (id: string | null) => PERSONAS.find((p) => p.id === id) ?? null;
