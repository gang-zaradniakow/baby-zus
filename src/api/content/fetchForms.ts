import { fetchJson } from '../fetchJson';

import type { FormEntry, ContentFormsResponse } from './ContentFormsResponse';

/** Słowniczek formularzy ZUS (kod + opis prostym językiem). */
export async function fetchForms(): Promise<readonly FormEntry[]> {
  const response = await fetchJson<ContentFormsResponse>('/api/v1/content/forms');
  return response.forms;
}
