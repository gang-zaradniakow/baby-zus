import { useState } from 'react';

import { today } from '@/domain/dates/calendarDate';

/** Dzisiejsza data (12:00), stała przez czas życia komponentu. */
export function useToday(): Date {
  const [value] = useState(today);
  return value;
}
