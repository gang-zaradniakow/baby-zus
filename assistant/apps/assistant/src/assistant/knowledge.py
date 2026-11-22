"""Odpowiedź na pytanie spoza katalogu z bazy wiedzy (ZUS-55, TL-37…TL-38).

1. fragmenty o trafności ≥ progu – bez nich eskalacja („Brak źródła w bazie wiedzy”),
2. LLM pisze odpowiedź tylko z fragmentów i wskazuje, których użył; „nie wynika
   z fragmentów” albo brak wskazanych źródeł → eskalacja (T11: nic nie zmyślamy),
3. walidator: liczby i przepisy wyłącznie z użytych fragmentów (+ rejestr silnika),
   do 2 ponowień; potem odpowiedź-szablon z samymi linkami,
4. ``legalBasis`` z użytych fragmentów przepisów (link do aktu, TL-37).
"""

from dataclasses import dataclass
from typing import Final

from pydantic import ValidationError

from assistant.answer import Source
from assistant.llm.base import LLMClient, LLMError, Message
from assistant.prompts.knowledge import KnowledgeOut, knowledge_messages, knowledge_retry
from assistant.validation import REGISTRY_ARTICLES, Allowed, check_text
from contracts import LegalRef

TEMPLATE: Final = (
    "Na to pytanie nie ma gotowego wyliczenia. Poniżej znajdziesz fragmenty przepisów "
    "i poradników z linkami do źródeł."
)
NO_ANSWER_REASON: Final = "Baza wiedzy nie odpowiada na to pytanie."


@dataclass(frozen=True, slots=True)
class KnowledgeResult:
    answerable: bool
    message: str
    sources: list[Source]
    legal_basis: list[LegalRef]
    llm_written: bool


def allowed_from_sources(sources: list[Source]) -> Allowed:
    allowed = Allowed(articles=set(REGISTRY_ARTICLES))
    for source in sources:
        allowed.add_text(f"{source.title} {source.excerpt}")
        if source.article:
            allowed.add_text(source.article)
    return allowed


def legal_basis(sources: list[Source]) -> list[LegalRef]:
    refs: list[LegalRef] = []
    for source in sources:
        if source.act and source.article:
            try:
                ref = LegalRef(act=source.act, article=source.article, url=str(source.url))
            except ValidationError:
                continue  # adres spoza zus.pl / gov.pl – zostaje tylko jako link źródła
            if ref not in refs:
                refs.append(ref)
    return refs


def _template(sources: list[Source]) -> KnowledgeResult:
    return KnowledgeResult(True, TEMPLATE, sources, legal_basis(sources), llm_written=False)


async def answer_from_sources(
    llm: LLMClient, question: str, sources: list[Source], *, retries: int = 2
) -> KnowledgeResult:
    messages: list[Message] = knowledge_messages(question, sources)
    for _ in range(retries + 1):
        try:
            out = await llm.complete_json(messages, KnowledgeOut, max_tokens=500)
        except LLMError:
            return _template(sources)
        used = [sources[n - 1] for n in dict.fromkeys(out.sources) if 1 <= n <= len(sources)]
        if not out.answerable or not used or not out.answer.strip():
            return KnowledgeResult(False, NO_ANSWER_REASON, [], [], llm_written=False)
        problems = check_text(out.answer, allowed_from_sources(used))
        if not problems:
            return KnowledgeResult(True, out.answer, used, legal_basis(used), llm_written=True)
        messages = [*messages, Message("assistant", out.answer), knowledge_retry(problems)]
    return _template(sources)
