import type { ZusLinkId } from '@/domain/knowledge/Article';

export type ZusLink = { url: string; label: string };

/** Linki do zus.pl i gov.pl podawane pod artykułami (z prototypu). */
export const ZUS_LINKS: Record<ZusLinkId, ZusLink> = {
  rodzice: {
    url: 'https://www.zus.pl/-/zus-dla-przysz%C5%82ych-mam-i-rodzic%C3%B3w',
    label: 'ZUS dla przyszłych mam i rodziców (zus.pl)',
  },
  macUrodzenie: {
    url: 'https://www.zus.pl/-/jak-uzyskac-zasilek-macierzynski-z-tytulu-urodzenia-dziecka',
    label: 'Jak uzyskać zasiłek macierzyński z tytułu urodzenia dziecka (zus.pl)',
  },
  macRodz: {
    url: 'https://www.zus.pl/-/jak-uzyskac-zasilek-macierzynski-przez-okres-urlopu-rodzicielskiego',
    label: 'Zasiłek macierzyński za okres urlopu rodzicielskiego (zus.pl)',
  },
  macOjc: {
    url: 'https://www.zus.pl/-/jak-uzyskac-zasilek-macierzynski-przez-ojca-dziecka-za-okres-urlopu-ojcowskiego',
    label: 'Zasiłek macierzyński za urlop ojcowski (zus.pl)',
  },
  macWys: {
    url: 'https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/wysokosc',
    label: 'Wysokość zasiłku macierzyńskiego (zus.pl)',
  },
  macOkres: {
    url: 'https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/prawo-do-zasilku-i-okres-przyslugiwania/za-okres-urlopu-macierzynskiego-albo-urlopu-na-warunkach-urlopu-macierzynskiego',
    label: 'Prawo do zasiłku i okres przysługiwania (zus.pl)',
  },
  macPoUstaniu: {
    url: 'https://www.zus.pl/swiadczenia/zasilki/opis-spraw-zasilki/-/publisher/details/1/jak-uzyskac-zasilek-macierzynski-z-tytulu-urodzenia-dziecka-po-ustaniu-tytulu-ubezpieczenia-chorobowego/220471',
    label: 'Zasiłek macierzyński po ustaniu ubezpieczenia (zus.pl)',
  },
  wczesniaki: {
    url: 'https://www.zus.pl/-/d%C5%82u%C5%BCszy-urlop-dla-rodzic%C3%B3w-wcze%C5%9Bniak%C3%B3w-dost%C4%99pny-ju%C5%BC-od-roku',
    label: 'Dłuższy urlop dla rodziców wcześniaków (zus.pl)',
  },
  tata: {
    url: 'https://www.zus.pl/-/tata-na-urlopie-z-dzieckiem-to-ju%C5%BC-nie-rzadko%C5%9B%C4%87',
    label: 'Tata na urlopie z dzieckiem (zus.pl)',
  },
  martwe: {
    url: 'https://www.zus.pl/-/nowe-zasady-sk%C5%82adania-dokument%C3%B3w-do-zasi%C5%82ku-macierzy%C5%84skiego-i-zasi%C5%82ku-pogrzebowego-w-przypadku-gdy-dziecko-urodzi-si%C4%99-martwe',
    label: 'Dokumenty, gdy dziecko urodzi się martwe (zus.pl)',
  },
  pogrzebowy: {
    url: 'https://www.zus.pl/-/zmiana-wysoko%C5%9Bci-zasi%C5%82ku-pogrzebowego-od-1-stycznia-2026-r.',
    label: 'Zasiłek pogrzebowy od 1.01.2026 (zus.pl)',
  },
  ewizyta: {
    url: 'https://www.zus.pl/e-wizyta',
    label: 'Umów e-wizytę (zus.pl)',
  },
  formularze: {
    url: 'https://www.zus.pl',
    label: 'Wzory formularzy — zakładka Zasiłki (zus.pl)',
  },
  mrpips: {
    url: 'https://www.gov.pl/web/rodzina/urlop-rodzicielski',
    label: 'Urlop rodzicielski (Ministerstwo Rodziny, Pracy i Polityki Społecznej)',
  },
  pip: {
    url: 'https://www.pip.gov.pl/dla-pracodawcow/porady-prawne/rodzicielstwo',
    label: 'Rodzicielstwo — porady prawne (Państwowa Inspekcja Pracy)',
  },
  usc: {
    url: 'https://www.gov.pl/web/cyfryzacja/rejestr-stanu-cywilnego',
    label: 'Odpis aktu urodzenia — rejestr stanu cywilnego (gov.pl)',
  },
};
