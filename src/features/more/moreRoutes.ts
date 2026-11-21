/** Adresy podekranów zakładki „Więcej” — w jednym miejscu, żeby ekrany nie sklejały ścieżek same. */
export const moreRoutes = {
  home: '/wiecej',
  contact: '/wiecej/kontakt',
  support: '/wiecej/wsparcie',
  about: '/wiecej/o-aplikacji',
  settings: '/wiecej/ustawienia',
  zusData: '/wiecej/dane-zus',
  messages: '/wiecej/wiadomosci',
  document: (documentId: string) => `/wiecej/pismo/${documentId}`,
  demo: '/wiecej/demo',
  admin: '/wiecej/admin',
  situation: '/wiecej/sytuacja',
  loss: '/wiecej/strata',
  children: '/wiecej/dzieci',
} as const;
