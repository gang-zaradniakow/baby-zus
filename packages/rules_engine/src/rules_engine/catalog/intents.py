"""Katalog pytań A–H (§4) jako dane w kodzie.

Etapy przeliczone z numeracji katalogu §4 na U3: kat. E1→E0 (ciąża), E2→E1 (≤ 6 tyg. do porodu),
E3→E2 (po porodzie), E4→E3 (rodzicielski i powrót), E5→flaga ADOPTION, E6→flaga DIFFICULT.
„Wszystkie” = E0–E3 oraz obie flagi.

``stages``/``flags`` mówią, gdzie pytanie PASUJE (wyszukiwarka, klasyfikacja w poziomie 2).
Krótką listę na górze ekranu (5–8 pytań) wybiera ``featured.py`` wg §3.1.
"""

import unicodedata
from typing import Final, NamedTuple

from contracts import AnswerType, Category, Flag, Intent, Stage

W, K, P, I, S = (  # noqa: E741 – litery z §4
    AnswerType.VERDICT,
    AnswerType.CALCULATION,
    AnswerType.PROCEDURE,
    AnswerType.INFORMATION,
    AnswerType.SIMULATION,
)
E0, E1, E2, E3 = Stage.E0, Stage.E1, Stage.E2, Stage.E3
ADOPTION, DIFFICULT = Flag.ADOPTION, Flag.DIFFICULT
ALL_STAGES = (E0, E1, E2, E3)
ALL_FLAGS = (ADOPTION, DIFFICULT)

# Najczęściej wymagane pola (ścieżki z catalog/fields.py)
PERIODS = "applicant.insurance.periods"
SALARIES = "applicant.insurance.salaries"
PAYER = "applicant.insurance.payer"
SICK_LEAVES = "applicant.insurance.sickLeaves"
DEBT = "applicant.insurance.contributionDebt"
EXPECTED = "child.expectedBirthDate"
BIRTH = "child.birthDate"
CHILDREN = "child.childrenCount"
ZA_ZYCIEM = "child.zaZyciem"
PLACEMENT = "child.placement"
PARTNER = "partner"
EVENTS = "specialEvents"
LEAVE_PLAN = "leavePlan"


class _Spec(NamedTuple):
    intent_id: str
    question: str
    types: tuple[AnswerType, ...]
    stages: tuple[Stage, ...] = ()
    flags: tuple[Flag, ...] = ()
    required: tuple[str, ...] = ()


def _build(specs: tuple[_Spec, ...]) -> tuple[Intent, ...]:
    """Intencje z priorytetem wg kolejności w katalogu (mniejszy = wyżej w wyszukiwarce)."""
    return tuple(
        Intent(
            id=spec.intent_id,
            category=Category(spec.intent_id[0]),
            question=spec.question,
            answer_types=list(spec.types),
            stages=list(spec.stages),
            flags=list(spec.flags),
            required_fields=list(spec.required),
            priority=10 * (index + 1),
        )
        for index, spec in enumerate(specs)
    )


# fmt: off
_SPECS: Final[tuple[_Spec, ...]] = (
    # --- A. Uprawnienia do świadczeń ---------------------------------------------------
    _Spec("A.01_prawo_do_macierzynskiego", "Czy przysługuje mi zasiłek macierzyński?",
         (W,), ALL_STAGES, (ADOPTION,), (PERIODS, EXPECTED)),
    _Spec("A.02_chorobowy_w_ciazy", "Czy przysługuje mi zasiłek chorobowy w ciąży?",
         (W,), (E0, E1), (), (PERIODS, SICK_LEAVES)),
    _Spec("A.03_swiadczenie_rehabilitacyjne", "Czy mam prawo do świadczenia rehabilitacyjnego?",
         (W,), (E0, E1), (), (SICK_LEAVES,)),
    _Spec("A.04_zasilek_w_wysokosci_macierzynskiego",
         "Czy przysługuje mi zasiłek w wysokości zasiłku macierzyńskiego?",
         (W,), (E0, E1), (), (PERIODS, EXPECTED)),
    _Spec("A.05_zasilek_opiekunczy", "Czy przysługuje mi zasiłek opiekuńczy?",
         (W, I), (E2, E3), (), (PERIODS, BIRTH)),
    _Spec("A.06_swiadczenia_dzialalnosc",
          "Czy przysługują mi świadczenia przy działalności gospodarczej?",
         (W,), ALL_STAGES, ALL_FLAGS, (PERIODS, DEBT)),
    _Spec("A.07_swiadczenia_umowa_zlecenia", "Czy otrzymam świadczenie na umowie zlecenia?",
         (W,), ALL_STAGES, ALL_FLAGS, (PERIODS,)),
    _Spec("A.08_bez_ubezpieczenia_chorobowego",
         "Czy przysługuje mi świadczenie bez ubezpieczenia chorobowego?",
         (W,), ALL_STAGES, ALL_FLAGS, (PERIODS,)),
    _Spec("A.09_zasilek_po_ustaniu_umowy", "Czy po ustaniu umowy nadal dostanę zasiłek?",
         (W,), (E0, E1, E2), (), (PERIODS, EXPECTED)),
    # --- B. Wysokość świadczeń ---------------------------------------------------------
    _Spec("B.01_wysokosc_macierzynskiego", "Ile wyniesie mój zasiłek macierzyński?",
         (K,), ALL_STAGES, (ADOPTION,), (SALARIES, CHILDREN)),
    _Spec("B.02_wysokosc_chorobowego_w_ciazy", "Ile wyniesie zasiłek chorobowy w ciąży?",
         (K,), (E0, E1), (), (SALARIES, SICK_LEAVES)),
    _Spec("B.03_kwota_miesieczna", "Jaka będzie miesięczna kwota?",
         (K,), (E1, E2, E3), (), (SALARIES,)),
    _Spec("B.04_warianty_urlopu", "Jak zmieni się kwota przy różnych wariantach urlopu?",
         (S,), (E1, E2, E3), (), (SALARIES, CHILDREN)),
    _Spec("B.05_podstawa_wymiaru", "Jak obliczana jest podstawa wymiaru?",
         (I, K), ALL_STAGES, ALL_FLAGS, (SALARIES,)),
    _Spec("B.06_suma_za_caly_okres", "Ile otrzymam łącznie w całym okresie?",
         (K,), (E1, E2, E3), (), (SALARIES, CHILDREN)),
    _Spec("B.07_zmiana_etatu_w_ciazy", "Co się stanie, jeśli zmienię etat lub pensję w ciąży?",
         (S, W), (E0,), (), (SALARIES,)),
    # --- C. Urlopy i czas trwania ------------------------------------------------------
    _Spec("C.01_wymiar_macierzynskiego", "Ile tygodni urlopu macierzyńskiego mi przysługuje?",
         (K,), (E0, E1, E2), (), (CHILDREN,)),
    _Spec("C.02_wymiar_rodzicielskiego", "Ile tygodni urlopu rodzicielskiego mogę wykorzystać?",
         (K,), (E1, E2, E3), (), (CHILDREN, ZA_ZYCIEM)),
    _Spec("C.03_przejecie_urlopu_przez_drugiego_rodzica",
          "Czy drugi rodzic może przejąć część urlopu?",
         (W,), (E1, E2, E3), (), (PARTNER, EVENTS)),
    _Spec("C.04_termin_wniosku", "Ile czasu mam na złożenie wniosku?",
         (P,), (E1, E2, E3), (), (BIRTH,)),
    _Spec("C.05_jak_dlugo_swiadczenie", "Jak długo mogę pobierać świadczenie?",
         (K,), ALL_STAGES, ALL_FLAGS, (CHILDREN,)),
    _Spec("C.06_wiecej_niz_jedno_dziecko", "Jakie uprawnienia przy więcej niż jednym dziecku?",
         (K,), ALL_STAGES, (), (CHILDREN,)),
    _Spec("C.07_urlop_przed_porodem", "Kiedy mogę zacząć urlop przed porodem?",
         (P,), (E0, E1), (), (EXPECTED,)),
    _Spec("C.08_urlop_ojcowski", "Ile mam czasu na urlop ojcowski?",
         (K,), (E2, E3), (ADOPTION,), (BIRTH,)),
    # --- D. Sytuacja drugiego rodzica --------------------------------------------------
    _Spec("D.01_prawa_drugiego_rodzica", "Czy drugi rodzic też ma prawo do świadczeń?",
         (W,), ALL_STAGES, (ADOPTION,), (PARTNER,)),
    _Spec("D.02_podzial_rodzicielskiego", "Jak możemy podzielić urlop rodzicielski?",
         (S,), (E1, E2, E3), (), (PARTNER, LEAVE_PLAN)),
    _Spec("D.03_jednoczesne_korzystanie", "Czy oboje możemy korzystać z urlopu jednocześnie?",
         (W, S), (E2, E3), (), (PARTNER, LEAVE_PLAN)),
    _Spec("D.04_wplyw_podzialu_na_kwote", "Czy podział wpłynie na wysokość świadczeń?",
         (S,), (E1, E2, E3), (), (SALARIES, PARTNER)),
    _Spec("D.05_praca_drugiego_rodzica", "Czy drugi rodzic może pracować na urlopie rodzicielskim?",
         (W, K), (E3,), (), (PARTNER, LEAVE_PLAN)),
    _Spec("D.06_matka_bez_ubezpieczenia", "Co, jeśli matka nie była ubezpieczona w dniu porodu?",
         (W,), (E2,), (), (PERIODS, PARTNER)),
    _Spec("D.07_wczesniejsze_przejecie_macierzynskiego",
         "Czy ojciec może wcześniej przejąć urlop macierzyński?",
         (W,), (E2,), (), (PARTNER, EVENTS)),
    # --- E. Praca podczas pobierania świadczeń -----------------------------------------
    _Spec("E.01_praca_na_rodzicielskim", "Czy mogę pracować podczas urlopu rodzicielskiego?",
         (W,), (E3,), (), (LEAVE_PLAN,)),
    _Spec("E.02_dzialalnosc_podczas_zasilku",
          "Czy mogę prowadzić działalność podczas pobierania zasiłku?",
         (W, I), (E2, E3), (), (PERIODS,)),
    _Spec("E.03_wplyw_pracy_na_kwote", "Jak praca wpłynie na wysokość zasiłku?",
         (K,), (E3,), (), (SALARIES, LEAVE_PLAN)),
    _Spec("E.04_laczenie_pracy_z_czescia_urlopu", "Czy mogę łączyć pracę z częścią urlopu?",
         (W, S), (E3,), (), (LEAVE_PLAN,)),
    _Spec("E.05_wydluzenie_urlopu_przy_pracy", "Jak wydłuży się urlop przy łączeniu z pracą?",
         (K,), (E3,), (), (LEAVE_PLAN,)),
    _Spec("E.06_praca_na_zwolnieniu_w_ciazy", "Czy mogę pracować na zwolnieniu w ciąży?",
         (W, I), (E0,), (), (SICK_LEAVES,)),
    # --- F. Sytuacje szczególne --------------------------------------------------------
    _Spec("F.01_wczesniak", "Co jeśli dziecko urodzi się przedwcześnie?",
         (K, P), (E2,), (), (BIRTH, EVENTS)),
    _Spec("F.02_hospitalizacja_dziecka", "Co jeśli dziecko wymaga hospitalizacji?",
         (K, P), (E2,), (), (BIRTH, EVENTS)),
    _Spec("F.03_wiecej_dzieci_przy_porodzie", "Jakie uprawnienia przy większej liczbie dzieci?",
         (K,), ALL_STAGES, (), (CHILDREN,)),
    _Spec("F.04_rodzice_adopcyjni", "Jakie świadczenia mają rodzice adopcyjni?",
         (K, W), (), (ADOPTION,), (PLACEMENT,)),
    _Spec("F.05_rodzina_zastepcza", "Jakie prawa mają rodzice zastępczy?",
         (K, W), (), (ADOPTION,), (PLACEMENT,)),
    _Spec("F.06_martwe_urodzenie_smierc_dziecka",
         "Co w przypadku martwego urodzenia lub śmierci dziecka?",
         (W, K, P), (), (DIFFICULT,), (EVENTS,)),
    _Spec("F.07_za_zyciem", "Co w przypadku ciężkiej choroby dziecka („Za życiem”)?",
         (K,), (E2, E3), ALL_FLAGS, (ZA_ZYCIEM, CHILDREN)),
    _Spec("F.08_matka_w_szpitalu_zmarla_porzucila",
         "Co jeśli matka jest w szpitalu, zmarła lub porzuciła dziecko?",
         (W, K), (E2, E3), ALL_FLAGS, (EVENTS, PARTNER)),
    _Spec("F.09_poronienie", "Co po poronieniu?",
         (I, W), (), (DIFFICULT,), (EVENTS,)),
    # --- G. Dokumenty, wnioski i terminy -----------------------------------------------
    _Spec("G.01_jakie_dokumenty", "Jakie dokumenty muszę przygotować?",
         (P,), ALL_STAGES, ALL_FLAGS, (PERIODS,)),
    _Spec("G.02_gdzie_zlozyc_wniosek", "Gdzie złożyć wniosek?",
         (P,), ALL_STAGES, ALL_FLAGS, (PAYER,)),
    _Spec("G.03_jaki_formularz", "Jaki formularz ZUS wypełnić?",
         (P,), ALL_STAGES, ALL_FLAGS, (PERIODS,)),
    _Spec("G.04_termin_dokumentow", "Do kiedy złożyć dokumenty?",
         (P,), ALL_STAGES, ALL_FLAGS, (BIRTH,)),
    _Spec("G.05_kto_wyplaca", "Kto wypłaci świadczenie – ZUS czy pracodawca?",
         (W,), ALL_STAGES, ALL_FLAGS, (PAYER,)),
    _Spec("G.06_status_wniosku", "Jak sprawdzić status wniosku?",
         (P,), (E1, E2, E3), (ADOPTION,)),
    _Spec("G.07_akt_urodzenia", "Jak uzyskać akt urodzenia dziecka?",
         (P,), (E2,), (), (BIRTH,)),
    _Spec("G.08_wniosek_o_urlop", "Jak napisać wniosek o urlop do pracodawcy?",
         (P,), (E1, E2, E3), (), (BIRTH,)),
    # --- H. Ryzyka i utrata uprawnień --------------------------------------------------
    _Spec("H.01_utrata_prawa", "Co może spowodować utratę prawa do świadczenia?",
         (I, W), ALL_STAGES, ALL_FLAGS, (PERIODS,)),
    _Spec("H.02_zmiana_zatrudnienia", "Czy zmiana zatrudnienia wpłynie na moje uprawnienia?",
         (S, W), (E0, E1), (), (PERIODS,)),
    _Spec("H.03_przerwa_w_ubezpieczeniu", "Czy przerwa w ubezpieczeniu chorobowym ma znaczenie?",
         (W,), (E0, E1), (), (PERIODS,)),
    _Spec("H.04_zadluzenie", "Czy zadłużenie w ZUS wpłynie na wypłatę?",
         (W,), ALL_STAGES, ALL_FLAGS, (PERIODS, DEBT)),
    _Spec("H.05_spozniony_wniosek", "Jakie konsekwencje ma zbyt późne złożenie wniosku?",
         (I,), (E1, E2, E3), (), (BIRTH,)),
    _Spec("H.06_zakwestionowanie_umowy", "Czy ZUS może zakwestionować moją umowę lub podstawę?",
         (I, W), (E0,), (), (PERIODS, SALARIES)),
    _Spec("H.07_ochrona_przed_zwolnieniem",
          "Czy pracodawca może mnie zwolnić w ciąży lub na urlopie?",
         (I,), ALL_STAGES, (), (PERIODS,)),
)
# fmt: on

INTENTS: Final[tuple[Intent, ...]] = _build(_SPECS)
INTENTS_BY_ID: Final[dict[str, Intent]] = {intent.id: intent for intent in INTENTS}


def get_intent(intent_id: str) -> Intent:
    try:
        return INTENTS_BY_ID[intent_id]
    except KeyError:
        raise KeyError(f"nieznana intencja: {intent_id}") from None


def _normalize(text: str) -> str:
    """Małe litery bez polskich znaków – „zasiłek” i „zasilek” mają się dopasować."""
    decomposed = unicodedata.normalize("NFKD", text.casefold().replace("ł", "l"))
    return "".join(ch for ch in decomposed if not unicodedata.combining(ch))


def search_intents(text: str, limit: int = 8) -> list[Intent]:
    """Proste wyszukiwanie po treści pytania (wyszukiwarka z §4); bez AI."""
    # Polska odmiana zmienia głównie końcówki: „poronienie” ma pasować do „poronieniu”.
    words = [w[: max(4, len(w) - 2)] for w in _normalize(text).split() if len(w) >= 3]
    if not words:
        return []
    scored = []
    for intent in INTENTS:
        haystack = _normalize(intent.question)
        score = sum(word in haystack for word in words)
        if score:
            scored.append((-score, intent.priority, intent))
    scored.sort(key=lambda item: (item[0], item[1]))
    return [intent for _, _, intent in scored[:limit]]
