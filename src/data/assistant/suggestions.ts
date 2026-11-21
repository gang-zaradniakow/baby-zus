import type { ParentStage } from '@/domain/profile/ParentProfile';

/** Podpowiedzi pytań na start rozmowy (z prototypu, js/kb.js: SUGGESTIONS). */
export const SUGGESTIONS: Record<ParentStage | 'general' | 'support', readonly string[]> = {
  general: ['Ile wyniesie mój zasiłek macierzyński?', 'Ile trwa urlop macierzyński?', '81,5% czy 100% + 70%?', 'Gdzie złożyć wniosek?'],
  ciaza: [
    'Ile dostanę na L4 w ciąży?',
    'Co lepiej wybrać: 81,5% czy 100% + 70%?',
    'Czy mogę zacząć macierzyński przed porodem?',
    'Mam firmę — czy dostanę zasiłek macierzyński?',
  ],
  dziecko: [
    'Urlop ojcowski — ile i do kiedy?',
    'Czy mogę pracować na urlopie rodzicielskim?',
    'Gdzie złożyć wniosek o zasiłek macierzyński?',
    'Dziecko zachorowało — czy dostanę zasiłek opiekuńczy?',
  ],
  adopcja: [
    'Adoptujemy dziecko / jesteśmy rodziną zastępczą — co nam przysługuje?',
    'Gdzie złożyć wniosek o zasiłek macierzyński?',
  ],
  support: [
    'Straciłam ciążę — co mi przysługuje?',
    'Ile wynosi zasiłek pogrzebowy i jak go dostać?',
    'Jak porozmawiać z człowiekiem z ZUS?',
  ],
};
