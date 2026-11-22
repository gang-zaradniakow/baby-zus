"""Kiedy czat proponuje kontakt z urzędnikiem (§8.1, ZUS-44, TA-28…TA-30).

- asystent nie potrafi odpowiedzieć (niska pewność, brak źródła, błąd narzędzia),
- dwa kolejne werdykty NEED_INFO w rozmowie,
- sprawa sporna (odwołanie, odmowa wypłaty, kwestionowanie umowy),
- sytuacja trudna – możliwość rozmowy z człowiekiem.
Przycisk „Zapytaj urzędnika” jest zawsze dostępny (``POST /escalations/draft``) – reguły
decydują tylko o tym, kiedy kontakt jest aktywnie proponowany.
"""

import re
from typing import Final

from assistant.answer import ChatAnswer
from contracts import Verdict

DISPUTE: Final = re.compile(
    r"odwoła|odwołan|odmów\w* wypłat|odmow\w* wypłat|nie wypłac|kwestionuj|zakwestion|"
    r"sprzeciw|skarg|reklamac|sprzeczn",
    re.IGNORECASE,
)
TWO_NEED_INFO: Final = (
    "Dwa kolejne pytania wymagają danych, których brakuje – urzędnik pomoże je ustalić."
)
DISPUTE_REASON: Final = "Sprawa sporna – rozstrzygnięcie wyjaśni urzędnik ZUS."
DIFFICULT_REASON: Final = "Sytuacja trudna – możesz porozmawiać z człowiekiem."
DEFAULT_REASON: Final = "Asystent nie potrafi rzetelnie odpowiedzieć na to pytanie."


def escalation_reason(answer: ChatAnswer, question: str, *, previous_need_info: bool) -> str | None:
    if answer.kind == "ESCALATE":
        return answer.escalation_reason or DEFAULT_REASON
    if answer.card is not None and answer.card.verdict is Verdict.NEED_INFO and previous_need_info:
        return TWO_NEED_INFO
    if DISPUTE.search(question):
        return DISPUTE_REASON
    if answer.difficult:
        return DIFFICULT_REASON
    return None
