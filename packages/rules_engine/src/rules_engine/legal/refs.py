"""Rejestr podstaw prawnych: przepis → akt, artykuł, URL (ZUS-19, blok 5 karty).

- ``to_legal_ref`` zamienia ``LegalBasis`` z reguł silnika na ``LegalRef`` z kontraktu,
- ``INTENT_LEGAL_BASIS`` to domyślna podstawa dla KAŻDEJ intencji katalogu – używana, gdy
  silnik nie ma reguły (poziom 2: RAG/LLM cytuje tylko przepisy z rejestru i z bazy wiedzy),
- linki prowadzą do ISAP (isap.sejm.gov.pl) – kontrakt dopuszcza tylko zus.pl i gov.pl.

Podstawy z ``to_verify=True`` wskazują przepis ogólnie; listę do przeglądu przez osobę
znającą przepisy daje ``unverified_refs()``.
"""

from collections.abc import Iterable, Iterator
from typing import Final

from contracts import LegalRef
from rules_engine.params import Act, LegalBasis
from rules_engine.params.base import ACT_URLS, kp, usus, uz

SUPPLEMENTARY: Final = kp("przepisy o uzupełniającym urlopie macierzyńskim", to_verify=True)
DOCUMENTS: Final = LegalBasis(
    Act.ROZPORZADZENIE_ZASILKOWE, "przepisy rozporządzenia", to_verify=True
)

INTENT_LEGAL_BASIS: Final[dict[str, tuple[LegalBasis, ...]]] = {
    # A. Uprawnienia
    "A.01_prawo_do_macierzynskiego": (uz("art. 29"),),
    "A.02_chorobowy_w_ciazy": (uz("art. 4"), uz("art. 11")),
    "A.03_swiadczenie_rehabilitacyjne": (uz("art. 18"), uz("art. 8")),
    "A.04_zasilek_w_wysokosci_macierzynskiego": (uz("art. 30"),),
    "A.05_zasilek_opiekunczy": (uz("art. 32", to_verify=True),),
    "A.06_swiadczenia_dzialalnosc": (uz("art. 29"), uz("art. 49", to_verify=True)),
    "A.07_swiadczenia_umowa_zlecenia": (uz("art. 29"),),
    "A.08_bez_ubezpieczenia_chorobowego": (uz("art. 29"),),
    "A.09_zasilek_po_ustaniu_umowy": (uz("art. 30"), uz("art. 7", to_verify=True)),
    # B. Wysokość
    "B.01_wysokosc_macierzynskiego": (uz("art. 31"),),
    "B.02_wysokosc_chorobowego_w_ciazy": (uz("art. 11"),),
    "B.03_kwota_miesieczna": (uz("art. 31"),),
    "B.04_warianty_urlopu": (uz("art. 31"),),
    "B.05_podstawa_wymiaru": (uz("art. 36"), uz("art. 3")),
    "B.06_suma_za_caly_okres": (uz("art. 31"),),
    "B.07_zmiana_etatu_w_ciazy": (uz("art. 36"), uz("art. 38", to_verify=True)),
    # C. Okresy i terminy
    "C.01_wymiar_macierzynskiego": (kp("art. 180"),),
    "C.02_wymiar_rodzicielskiego": (kp("art. 182¹a"),),
    "C.03_przejecie_urlopu_przez_drugiego_rodzica": (kp("art. 180"),),
    "C.04_termin_wniosku": (uz("art. 31"),),
    "C.05_jak_dlugo_swiadczenie": (kp("art. 180"), kp("art. 182¹a")),
    "C.06_wiecej_niz_jedno_dziecko": (kp("art. 180"), kp("art. 182¹a")),
    "C.07_urlop_przed_porodem": (kp("art. 180"),),
    "C.08_urlop_ojcowski": (kp("art. 182³"),),
    # D. Drugi rodzic
    "D.01_prawa_drugiego_rodzica": (kp("art. 182¹a"), kp("art. 182³")),
    "D.02_podzial_rodzicielskiego": (kp("art. 182¹a"), kp("art. 182¹b")),
    "D.03_jednoczesne_korzystanie": (kp("art. 182¹a"), kp("art. 182¹b")),
    "D.04_wplyw_podzialu_na_kwote": (uz("art. 31"),),
    "D.05_praca_drugiego_rodzica": (kp("art. 182¹e"),),
    "D.06_matka_bez_ubezpieczenia": (uz("art. 29", to_verify=True),),
    "D.07_wczesniejsze_przejecie_macierzynskiego": (kp("art. 180"),),
    # E. Praca na urlopie
    "E.01_praca_na_rodzicielskim": (kp("art. 182¹e"),),
    "E.02_dzialalnosc_podczas_zasilku": (uz("art. 17", to_verify=True),),
    "E.03_wplyw_pracy_na_kwote": (kp("art. 182¹e"), uz("art. 31")),
    "E.04_laczenie_pracy_z_czescia_urlopu": (kp("art. 182¹e"),),
    "E.05_wydluzenie_urlopu_przy_pracy": (kp("art. 182¹e"), kp("art. 182¹f")),
    "E.06_praca_na_zwolnieniu_w_ciazy": (uz("art. 17", to_verify=True),),
    # F. Sytuacje szczególne
    "F.01_wczesniak": (SUPPLEMENTARY,),
    "F.02_hospitalizacja_dziecka": (SUPPLEMENTARY,),
    "F.03_wiecej_dzieci_przy_porodzie": (kp("art. 180"), kp("art. 182¹a")),
    "F.04_rodzice_adopcyjni": (kp("art. 183"),),
    "F.05_rodzina_zastepcza": (kp("art. 183"),),
    "F.06_martwe_urodzenie_smierc_dziecka": (kp("art. 180¹ § 1"),),
    "F.07_za_zyciem": (kp("art. 182¹a"),),
    "F.08_matka_w_szpitalu_zmarla_porzucila": (kp("art. 180 § 12"), kp("art. 180 § 13")),
    "F.09_poronienie": (kp("art. 180¹", to_verify=True),),
    # G. Formalności
    "G.01_jakie_dokumenty": (DOCUMENTS,),
    "G.02_gdzie_zlozyc_wniosek": (uz("art. 61"),),
    "G.03_jaki_formularz": (DOCUMENTS,),
    "G.04_termin_dokumentow": (uz("art. 31"),),
    "G.05_kto_wyplaca": (uz("art. 61"),),
    "G.06_status_wniosku": (uz("art. 61"), usus("art. 83", to_verify=True)),
    "G.07_akt_urodzenia": (LegalBasis(Act.PRAWO_ASC, "art. 52", to_verify=True),),
    "G.08_wniosek_o_urlop": (kp("art. 180"), kp("art. 182¹a")),
    # H. Ryzyka
    "H.01_utrata_prawa": (uz("art. 17", to_verify=True),),
    "H.02_zmiana_zatrudnienia": (uz("art. 4"), uz("art. 36")),
    "H.03_przerwa_w_ubezpieczeniu": (uz("art. 4"),),
    "H.04_zadluzenie": (uz("art. 49", to_verify=True),),
    "H.05_spozniony_wniosek": (uz("art. 31"),),
    "H.06_zakwestionowanie_umowy": (usus("art. 83", to_verify=True), uz("art. 36")),
    "H.07_ochrona_przed_zwolnieniem": (kp("art. 177"),),
}


def to_legal_ref(basis: LegalBasis) -> LegalRef:
    return LegalRef(act=str(basis.act), article=basis.article, url=basis.url)


def legal_refs(bases: Iterable[LegalBasis]) -> list[LegalRef]:
    """Podstawy bez powtórzeń (ten sam akt i artykuł), w kolejności pierwszego wystąpienia."""
    seen: set[tuple[Act, str]] = set()
    refs: list[LegalRef] = []
    for basis in bases:
        key = (basis.act, basis.article)
        if key not in seen:
            seen.add(key)
            refs.append(to_legal_ref(basis))
    return refs


def intent_basis(intent_id: str) -> tuple[LegalBasis, ...]:
    return INTENT_LEGAL_BASIS[intent_id]


def registered_urls() -> set[str]:
    return set(ACT_URLS.values())


def unverified_refs() -> Iterator[tuple[str, LegalBasis]]:
    """Pary (intencja, przepis) do przeglądu prawnego."""
    for intent_id, bases in INTENT_LEGAL_BASIS.items():
        for basis in bases:
            if basis.to_verify:
                yield intent_id, basis
