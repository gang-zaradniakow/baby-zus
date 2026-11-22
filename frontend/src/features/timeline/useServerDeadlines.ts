import { useEffect, useState } from 'react';

import { deadlineRuleKey, fetchDeadline } from '@/api/deadlinesApi';
import type { Deadline, DeadlineRule } from '@/domain/deadlines/Deadline';

/**
 * Terminy policzone przez backend dla podanych reguł: `Map<klucz reguły, termin>`. Każdą regułę pytamy raz;
 * gdy serwer nie odpowiada (albo nie jest skonfigurowany), reguły brak w mapie — zostaje wynik lokalny.
 */
export function useServerDeadlines(rules: readonly DeadlineRule[]): ReadonlyMap<string, Deadline> {
  const [deadlines, setDeadlines] = useState<ReadonlyMap<string, Deadline>>(new Map());
  const keys = rules.map(deadlineRuleKey).join(',');

  useEffect(() => {
    let active = true;
    const unique = new Map(rules.map((rule) => [deadlineRuleKey(rule), rule]));
    for (const [key, rule] of unique) {
      fetchDeadline(rule)
        .then((deadline) => {
          if (active) setDeadlines((map) => new Map(map).set(key, deadline));
        })
        // Brak połączenia albo backendu: zostaje termin policzony w aplikacji.
        .catch(() => undefined);
    }
    return () => {
      active = false;
    };
    // Reguły porównujemy po kluczach — nowa tablica z tymi samymi regułami nie odpytuje serwera ponownie.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys]);

  return deadlines;
}
