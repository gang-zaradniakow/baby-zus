import type { ParentStage } from '@/domain/profile/ParentProfile';

export type EventDateQuestion = {
  title: string;
  subtitle: string;
  label: string;
  hint: string;
};

/** Pytanie o datę zależy od etapu wybranego w kroku 1. */
export const EVENT_DATE_QUESTIONS: Record<ParentStage, EventDateQuestion> = {
  planuje: {
    title: 'Kiedy mniej więcej chcielibyście powitać dziecko?',
    subtitle: 'Orientacyjna data wystarczy — policzymy, co warto załatwić wcześniej.',
    label: 'Planowany termin porodu',
    hint: 'Np. 01.09.2027. Zawsze możesz ją zmienić.',
  },
  ciaza: {
    title: 'Kiedy masz termin porodu?',
    subtitle: 'Na tej podstawie policzymy Twoje terminy w urzędach.',
    label: 'Przewidywany termin porodu',
    hint: 'Znajdziesz go w karcie ciąży. Terminy po porodzie będą orientacyjne.',
  },
  dziecko: {
    title: 'Kiedy urodziło się dziecko?',
    subtitle: 'Od daty urodzenia liczą się wszystkie terminy na wnioski.',
    label: 'Data urodzenia',
    hint: 'Np. 05.09.2026',
  },
  adopcja: {
    title: 'Kiedy przyjęliście dziecko?',
    subtitle: 'Terminy liczymy od daty przyjęcia dziecka, nie od porodu.',
    label: 'Data przyjęcia dziecka',
    hint: 'Np. 05.09.2026',
  },
};
