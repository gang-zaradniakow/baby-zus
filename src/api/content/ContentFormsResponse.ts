/** Kontrakt `GET /api/v1/content/forms` (openapi.yaml: ContentForms, FormEntry). */
export type FormEntry = { code: string; description: string };

export type ContentFormsResponse = { forms: FormEntry[] };
