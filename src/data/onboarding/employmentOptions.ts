import type { EmploymentId } from '@/domain/profile/ParentProfile';

export type EmploymentOption = {
  id: EmploymentId;
  label: string;
  hint: string;
};

export const EMPLOYMENT_OPTIONS: readonly EmploymentOption[] = [
  { id: 'uop', label: 'Umowa o pracę', hint: 'Masz obowiązkowe ubezpieczenie chorobowe.' },
  { id: 'jdg', label: 'Własna firma (JDG)', hint: 'Zasiłki wypłaca ZUS, jeśli płacisz chorobowe.' },
  { id: 'zlec', label: 'Umowa zlecenie', hint: 'Chorobowe na zleceniu jest dobrowolne.' },
  { id: 'brak', label: 'Brak ubezpieczenia', hint: 'Nie pracuję, studiuję lub jestem bez pracy.' },
];
