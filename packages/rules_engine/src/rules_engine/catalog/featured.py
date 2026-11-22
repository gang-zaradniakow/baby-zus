"""Krótka lista pytań na górze ekranu dla etapu i flag (§3.1 „Co asystent eksponuje”).

Reguły:
- DIFFICULT ma pierwszeństwo i ZASTĘPUJE listę etapu (§9.3: bez treści o „szczęśliwym
  rodzicielstwie”, najpierw to, co niezbędne),
- ADOPTION dokłada swoje pytania PRZED pytaniami etapu,
- nieznany etap (brak dat) → lista ogólna,
- zawsze najwyżej ``MAX_FEATURED`` pozycji; pozostałe pytania są w wyszukiwarce.
"""

from typing import Final

from contracts import Flag, Intent, Stage, StageInfo
from rules_engine.catalog.intents import get_intent

MAX_FEATURED: Final = 8
MIN_FEATURED: Final = 5

FEATURED: Final[dict[Stage | Flag | None, tuple[str, ...]]] = {
    # Ciąża: zasiłek chorobowy 100% (kod B), e-ZLA, ochrona przed zwolnieniem, umowa terminowa
    Stage.E0: (
        "A.02_chorobowy_w_ciazy",
        "B.02_wysokosc_chorobowego_w_ciazy",
        "E.06_praca_na_zwolnieniu_w_ciazy",
        "H.07_ochrona_przed_zwolnieniem",
        "A.09_zasilek_po_ustaniu_umowy",
        "A.01_prawo_do_macierzynskiego",
        "C.07_urlop_przed_porodem",
        "H.06_zakwestionowanie_umowy",
    ),
    # ≤ 6 tyg. do porodu: urlop przed porodem, wniosek jednorazowy, wybór 81,5% vs 100%/70%
    Stage.E1: (
        "C.07_urlop_przed_porodem",
        "G.08_wniosek_o_urlop",
        "B.04_warianty_urlopu",
        "B.01_wysokosc_macierzynskiego",
        "C.01_wymiar_macierzynskiego",
        "A.01_prawo_do_macierzynskiego",
        "G.02_gdzie_zlozyc_wniosek",
        "C.04_termin_wniosku",
    ),
    # Po porodzie: termin 21 dni (81,5%), dokumenty, akt urodzenia, ojcowski, uzupełniający
    Stage.E2: (
        "C.04_termin_wniosku",
        "B.04_warianty_urlopu",
        "G.01_jakie_dokumenty",
        "G.07_akt_urodzenia",
        "C.08_urlop_ojcowski",
        "F.01_wczesniak",
        "G.05_kto_wyplaca",
        "B.01_wysokosc_macierzynskiego",
    ),
    # Rodzicielski i powrót: podział 41/43 i 9 tyg., łączenie z pracą ≤ ½, 5 części do 6. r.ż.
    Stage.E3: (
        "D.02_podzial_rodzicielskiego",
        "C.02_wymiar_rodzicielskiego",
        "E.01_praca_na_rodzicielskim",
        "E.05_wydluzenie_urlopu_przy_pracy",
        "D.03_jednoczesne_korzystanie",
        "A.05_zasilek_opiekunczy",
        "H.05_spozniony_wniosek",
    ),
    # Adopcja / rodzina zastępcza: urlop na warunkach macierzyńskiego, limity wieku, ojcowski
    Flag.ADOPTION: (
        "F.04_rodzice_adopcyjni",
        "F.05_rodzina_zastepcza",
        "A.01_prawo_do_macierzynskiego",
        "B.01_wysokosc_macierzynskiego",
        "C.08_urlop_ojcowski",
        "D.01_prawa_drugiego_rodzica",
    ),
    # Sytuacja trudna: minimum kroków; organizacje wsparcia dokłada karta odpowiedzi
    Flag.DIFFICULT: (
        "F.06_martwe_urodzenie_smierc_dziecka",
        "F.09_poronienie",
        "F.08_matka_w_szpitalu_zmarla_porzucila",
        "F.07_za_zyciem",
        "G.01_jakie_dokumenty",
    ),
    # Etap nieznany (brak dat): pytania ogólne
    None: (
        "A.01_prawo_do_macierzynskiego",
        "B.01_wysokosc_macierzynskiego",
        "C.01_wymiar_macierzynskiego",
        "G.05_kto_wyplaca",
        "G.02_gdzie_zlozyc_wniosek",
    ),
}


def featured_intents(info: StageInfo) -> list[Intent]:
    """Lista pytań na ekran dla etapu i flag użytkownika."""
    if Flag.DIFFICULT in info.flags:
        ids: tuple[str, ...] = FEATURED[Flag.DIFFICULT]
    elif Flag.ADOPTION in info.flags:
        ids = FEATURED[Flag.ADOPTION] + FEATURED[info.stage]
    else:
        ids = FEATURED[info.stage]
    unique = list(dict.fromkeys(ids))[:MAX_FEATURED]
    return [get_intent(intent_id) for intent_id in unique]
