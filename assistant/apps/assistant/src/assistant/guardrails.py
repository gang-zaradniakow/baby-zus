"""Guardrails poziomu 2 (§9.2, ZUS-54, TL-29…TL-33) – reguły, nie model.

- **medycyna** – pytania o zdrowie, leki, dietę w ciąży → „zapytaj lekarza prowadzącego”
  (pytania o zwolnienie lekarskie i zasiłki to nie medycyna),
- **„optymalizacja”** – umowa dla pozoru, sztuczne podwyższenie podstawy → zamiast porady
  informacja o ryzyku (ZUS może zakwestionować tytuł ubezpieczenia),
- **temat** – pytania spoza świadczeń związanych z ciążą i rodzicielstwem → zus.pl,
- **wstrzyknięte polecenia** – tylko flaga do logów: tekst użytkownika zawsze jest danymi,
  a liczby i tak pochodzą z silnika i przechodzą walidator (T12).

Ton w sytuacji trudnej (§9.3) ustawia ``difficult_situation`` – na podstawie flag etapu
i zdarzeń w profilu albo słów w pytaniu.
"""

import re
from dataclasses import dataclass
from enum import StrEnum
from typing import Final

from assistant.rag.corpus import Situation
from contracts import Profile, SpecialEventKind

INSTRUCTION_PATTERNS: Final = tuple(
    re.compile(p, re.IGNORECASE)
    for p in (
        r"(zignoruj|pomiń|ignoruj|ignore|disregard).{0,40}(instrukc|polece|zasad|instruction)",
        r"(jesteś teraz|you are now|system prompt|prompt systemowy)",
        r"(napisz|odpowiedz|powiedz|write|say)\s*,?\s*że",
    )
)

MEDICAL: Final = re.compile(
    r"czy (?:w ciąży )?(?:mogę|można|wolno)(?: w ciąży)? (?:jeść|pić|brać|przyjmować|ćwiczyć|"
    r"latać|biegać|farbować)|jakie leki|lek(?:i|ów|iem) na|objaw|krwawi|boli|ból|dawk|szczepi|"
    r"sushi|alkohol|kofein|witamin|suplement|poronić|zagrożon",
    re.IGNORECASE,
)
OPTIMIZATION: Final = re.compile(
    r"dla pozoru|fikcyjn|na niby|zawyż|podnieść (?:mi )?(?:pensj|wynagrodz|podstaw)|"
    r"podwyższ\w* (?:pensj|wynagrodz|podstaw)|obejść przepis|oszukać|wyłudz|"
    r"zatrudni\w* (?:się )?u (?:męża|żony|mamy|taty|rodziny|teściow)",
    re.IGNORECASE,
)
DOMAIN: Final = re.compile(
    r"ciąż|macierzyń|rodzicielsk|ojcowsk|zasił|urlop|dzieck|dzieci|poród|porod|urodz|adopc|"
    r"przysposob|zastępcz|wcześniak|zus|e-?zla|zwolnieni|l4|składk|płatnik|wniosek|świadczen|"
    r"poronien|żałob|niemowl|noworod|bliźni|trojacz|wyprawk",
    re.IGNORECASE,
)
LOSS_WORDS: Final = re.compile(
    r"martw[eoy]\w* urodz|urodził\w* się martw|poronien|poronił|stracił\w* dzieck|"
    r"śmierć dziecka|zmarł\w* (?:dziecko|synek|córeczka|syn|córka)|żałob",
    re.IGNORECASE,
)

LOSS_EVENTS: Final = {
    SpecialEventKind.MISCARRIAGE: Situation.MISCARRIAGE,
    SpecialEventKind.STILLBIRTH: Situation.STILLBIRTH,
    SpecialEventKind.CHILD_DEATH: Situation.CHILD_DEATH,
}


class Guard(StrEnum):
    MEDICAL = "MEDICAL"
    OPTIMIZATION = "OPTIMIZATION"
    OFF_TOPIC = "OFF_TOPIC"


GUARD_MESSAGES: Final = {
    Guard.MEDICAL: (
        "Nie udzielam porad medycznych. Z pytaniami o zdrowie, leki czy dietę w ciąży zwróć się "
        "do lekarza prowadzącego albo położnej. Chętnie pomogę w sprawach zasiłków i urlopów."
    ),
    Guard.OPTIMIZATION: (
        "Nie doradzam w sprawie zawierania umów „dla pozoru” ani sztucznego podwyższania "
        "podstawy zasiłku. ZUS może zakwestionować taki tytuł ubezpieczenia albo wysokość "
        "podstawy – wtedy trzeba zwrócić wypłacone świadczenia. Mogę wyjaśnić, od czego zależy "
        "wysokość zasiłku przy rzeczywistym zatrudnieniu."
    ),
    Guard.OFF_TOPIC: (
        "Pomagam w sprawach świadczeń związanych z ciążą i rodzicielstwem (zasiłki, urlopy, "
        "dokumenty). Z innymi sprawami zajrzyj na zus.pl albo skontaktuj się z ZUS."
    ),
}
#: Pytanie z katalogu, które pokazuje ryzyko zamiast porady („optymalizacja”).
RISK_INTENT: Final = "H.06_zakwestionowanie_umowy"

DIFFICULT_OPENING: Final = (
    "Bardzo nam przykro z powodu Twojej straty. Nie musisz niczego załatwiać od razu – "
    "poniżej jest tylko to, co najważniejsze, gdy będziesz gotowa lub gotowy."
)


def guard_before_classification(question: str) -> Guard | None:
    """Pytania, na które asystent nie odpowiada merytorycznie – bez wywołania modelu."""
    if MEDICAL.search(question) and not re.search(r"zwolnieni|l4|e-?zla|zasił", question, re.I):
        return Guard.MEDICAL
    if OPTIMIZATION.search(question):
        return Guard.OPTIMIZATION
    return None


def off_topic(question: str) -> bool:
    """Pytanie spoza katalogu bez żadnego słowa z dziedziny świadczeń rodzicielskich."""
    return DOMAIN.search(question) is None


def possible_injection(text: str) -> bool:
    return any(pattern.search(text) for pattern in INSTRUCTION_PATTERNS)


@dataclass(frozen=True, slots=True)
class Difficult:
    situation: Situation


def difficult_situation(profile: Profile | None, question: str) -> Difficult | None:
    """Sytuacja trudna (§9.3): zdarzenie w profilu, „Za życiem” albo strata opisana w pytaniu."""
    if profile is not None:
        for event in profile.special_events:
            if event.kind in LOSS_EVENTS:
                return Difficult(LOSS_EVENTS[event.kind])
        if profile.child.za_zyciem:
            return Difficult(Situation.SEVERE_ILLNESS)
    if LOSS_WORDS.search(question):
        miscarriage = re.search(r"poronien|poronił", question, re.IGNORECASE)
        return Difficult(Situation.MISCARRIAGE if miscarriage else Situation.STILLBIRTH)
    return None
