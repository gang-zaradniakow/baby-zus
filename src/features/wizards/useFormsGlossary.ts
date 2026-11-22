import { fetchForms, type FormEntry } from '@/api/content';
import { FORMS_GLOSSARY } from '@/data/wizards/formsGlossary';
import { useFetchedOr } from '@/hooks/useFetchedOr';

/** Słowniczek formularzy z backendu; bez niego — lokalny z `data/wizards/formsGlossary`. */
export function useFormsGlossary(): readonly FormEntry[] {
  return useFetchedOr(fetchForms, FORMS_GLOSSARY);
}
