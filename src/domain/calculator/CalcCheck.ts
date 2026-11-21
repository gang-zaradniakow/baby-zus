/**
 * Wyjaśnienie z kalkulatora dla rodzica: `ok` — warunek spełniony, `info` — dobrze wiedzieć,
 * `no` — coś blokuje albo obniża świadczenie.
 */
export type CalcCheck = {
  level: 'ok' | 'info' | 'no';
  text: string;
};
