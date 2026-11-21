import type { EmploymentId } from './ParentProfile';

/**
 * Czy rodzic ma płatnika składek innego niż on sam (umowa o pracę albo zlecenie).
 * Tylko wtedy pytamy o wielkość płatnika — od niej zależy, kto wypłaci zasiłek.
 */
export function hasExternalPayer(employment: readonly EmploymentId[]): boolean {
  return employment.includes('uop') || employment.includes('zlec');
}
