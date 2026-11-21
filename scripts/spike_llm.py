"""Spike ZUS-05: pomiary LLM i embeddingów na API zgodnym z OpenAI.

Domyślnie: OVHcloud AI Endpoints i model Olala-v1.0-mini-7A1B. Inny dostawca: --base-url.

Co sprawdza (wyniki trafiają do ADR 0002):
  1. GET /models – jakie modele są dostępne (czat i embeddingi).
  2. Structured output – czy model zwraca JSON zgodny ze schematem w trybach:
     json_schema (wymuszony), json_object, sam prompt. Przy okazji: trafność rozpoznania intencji.
  3. Wyjaśnianie wyniku silnika – opóźnienie, tokeny i czy model nie dopisuje obcych liczb.
  4. Każdy z punktów 2–3 dla kilku poziomów reasoning_effort (domyślnie none, low, medium) –
     ile rozumowania potrzeba, żeby było trafnie, i ile to kosztuje czasu.
  5. Opóźnienia (p50/p95), czas do pierwszego tokenu, tokeny rozumowania, limity, test serii.
  6. Embeddingi – trafność wyszukiwania po polsku (top-1, top-3, MRR) na małym korpusie.
  7. Szacunek kosztu na pytanie i na 1000 pytań (ceny podajesz w argumentach).

Użycie (Windows PowerShell, z katalogu repozytorium):
  .venv\\Scripts\\python scripts\\spike_llm.py --list-only --anonymous
  .venv\\Scripts\\python scripts\\spike_llm.py --anonymous

Z kluczem (wyższe limity): wpisz LLM_API_KEY=... do pliku .env i pomiń --anonymous.
Linux/macOS: .venv/bin/python zamiast .venv\\Scripts\\python.

Skrypt nigdy nie wypisuje klucza. Wszystkie pytania i dane są syntetyczne –
do API nie trafiają dane osobowe.
"""

import argparse
import asyncio
import json
import math
import os
import re
import statistics
import sys
import time
from collections.abc import Awaitable, Callable
from dataclasses import asdict, dataclass, field
from datetime import UTC, datetime
from decimal import Decimal, InvalidOperation
from enum import StrEnum
from functools import partial
from pathlib import Path
from typing import Any

from openai import APIError, APIStatusError, AsyncOpenAI, DefaultAsyncHttpxClient, RateLimitError
from pydantic import BaseModel, ConfigDict, Field, ValidationError

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BASE_URL = "https://oai.endpoints.kepler.ai.cloud.ovh.net/v1"  # OVHcloud AI Endpoints
DEFAULT_CHAT_NEEDLES = ["olala", "bielik", "pllum"]
# Modele wyspecjalizowane (np. streszczanie dokumentów) nie pasują do naszych zadań.
EXCLUDED_CHAT_NEEDLES = ["summar"]
MODES = ("json_schema", "json_object", "prompt")
DEFAULT_OUT = ROOT / "docs" / "spikes" / "zus-05-llm"

# --------------------------------------------------------------------------------------
# Dane testowe (syntetyczne)
# --------------------------------------------------------------------------------------

INTENTS: dict[str, str] = {
    "A.01_prawo_do_macierzynskiego": "Czy przysługuje mi zasiłek macierzyński?",
    "A.02_chorobowy_w_ciazy": "Czy przysługuje mi zasiłek chorobowy w ciąży?",
    "B.01_wysokosc_macierzynskiego": "Ile wyniesie mój zasiłek macierzyński?",
    "C.01_wymiar_macierzynskiego": "Ile tygodni urlopu macierzyńskiego mi przysługuje?",
    "C.02_wymiar_rodzicielskiego": "Ile tygodni urlopu rodzicielskiego mogę wykorzystać?",
    "C.08_urlop_ojcowski": "Ile mam czasu na urlop ojcowski?",
    "D.02_podzial_rodzicielskiego": "Jak możemy podzielić urlop rodzicielski?",
    "E.01_praca_na_rodzicielskim": "Czy mogę pracować podczas urlopu rodzicielskiego?",
    "F.06_martwe_urodzenie": "Co w przypadku martwego urodzenia lub śmierci dziecka?",
    "G.02_gdzie_zlozyc_wniosek": "Gdzie złożyć wniosek?",
}
OUT_OF_CATALOG = "OUT_OF_CATALOG"

# (pytanie użytkownika, oczekiwana intencja, oczekiwana liczba dzieci albo None)
QUESTIONS: list[tuple[str, str, int | None]] = [
    (
        "ile będę dostawać na macierzyńskim jak zarabiam 7 tys brutto?",
        "B.01_wysokosc_macierzynskiego",
        None,
    ),
    (
        "Urodziłam bliźniaki, ile tygodni macierzyńskiego mi się należy?",
        "C.01_wymiar_macierzynskiego",
        2,
    ),
    ("czy na zleceniu dostanę macierzyński?", "A.01_prawo_do_macierzynskiego", None),
    ("Jestem w ciąży i lekarz dał mi L4, ile płacą?", "A.02_chorobowy_w_ciazy", None),
    (
        "mąż chce wziąć część rodzicielskiego, jak to rozdzielić?",
        "D.02_podzial_rodzicielskiego",
        None,
    ),
    ("Do kiedy tata może wziąć ojcowskie?", "C.08_urlop_ojcowski", None),
    ("Czy na rodzicielskim mogę pracować na pół etatu?", "E.01_praca_na_rodzicielskim", None),
    ("Moje dziecko urodziło się martwe. Co mi przysługuje?", "F.06_martwe_urodzenie", None),
    (
        "Gdzie mam zanieść wniosek o zasiłek, do ZUS czy do szefa?",
        "G.02_gdzie_zlozyc_wniosek",
        None,
    ),
    ("ile trwa rodzicielski przy jednym dziecku", "C.02_wymiar_rodzicielskiego", 1),
    (
        "Prowadzę działalność i płacę chorobowe, czy dostanę kasę po porodzie?",
        "A.01_prawo_do_macierzynskiego",
        None,
    ),
    ("Mam trojaczki!!! ile urlopu?", "C.01_wymiar_macierzynskiego", 3),
    ("Jaka kwota zasiłku jak wybiorę 81,5%?", "B.01_wysokosc_macierzynskiego", None),
    ("czy mogę dorabiać na rodzicielskim u innego pracodawcy", "E.01_praca_na_rodzicielskim", None),
    ("Straciłam dziecko tydzień po porodzie, co dalej z urlopem?", "F.06_martwe_urodzenie", None),
    ("ile dni ma urlop ojcowski i czy można go podzielić", "C.08_urlop_ojcowski", None),
    ("Jak obliczyć wysokość mojej przyszłej emerytury?", OUT_OF_CATALOG, None),
    ("Jaki wózek dziecięcy polecacie?", OUT_OF_CATALOG, None),
    ("Czy w ciąży mogę jeść sushi?", OUT_OF_CATALOG, None),
    ("Kiedy dostanę zwrot podatku za ulgę na dziecko?", OUT_OF_CATALOG, None),
]

# Wyniki „silnika” do wyjaśnienia – model ma użyć wyłącznie tych liczb.
ENGINE_CARDS: list[dict[str, Any]] = [
    {
        "pytanie": "Ile wyniesie mój zasiłek macierzyński?",
        "werdykt": "TAK",
        "fakty": {
            "podstawa wymiaru": "6000,00 zł",
            "stawka": "81,5%",
            "kwota miesięczna": "4890,00 zł",
            "okres": "52 tygodnie",
        },
        "termin": "wniosek o wariant 81,5% do 03.12.2026",
    },
    {
        "pytanie": "Czy przysługuje mi zasiłek chorobowy w ciąży?",
        "werdykt": "NIE",
        "fakty": {
            "tytuł": "umowa zlecenia",
            "dobrowolne ubezpieczenie chorobowe od": "01.10.2026",
            "wymagany okres wyczekiwania": "90 dni",
            "dni ubezpieczenia do dnia zwolnienia": "40",
        },
        "termin": None,
    },
    {
        "pytanie": "Ile tygodni urlopu macierzyńskiego mi przysługuje?",
        "werdykt": "TAK",
        "fakty": {
            "liczba dzieci przy porodzie": "2",
            "wymiar urlopu macierzyńskiego": "31 tygodni",
            "w tym obowiązkowo dla matki": "14 tygodni",
        },
        "termin": None,
    },
    {
        "pytanie": "Czy mogę pracować podczas urlopu rodzicielskiego?",
        "werdykt": "TAK",
        "fakty": {
            "maksymalny wymiar pracy": "1/2 etatu",
            "część urlopu objęta pracą": "8 tygodni",
            "wydłużenie tej części": "do 16 tygodni",
        },
        "termin": None,
    },
    {
        "pytanie": "Kto wypłaci zasiłek?",
        "werdykt": "TAK",
        "fakty": {
            "liczba ubezpieczonych u pracodawcy na 30.11.2025": "45",
            "próg": "więcej niż 20",
            "płatnik zasiłku": "pracodawca",
        },
        "termin": None,
    },
    {
        "pytanie": "Ile mam czasu na urlop ojcowski?",
        "werdykt": "TAK",
        "fakty": {
            "wymiar": "14 dni",
            "data urodzenia dziecka": "12.11.2026",
            "termin wykorzystania": "do 12.11.2027",
            "liczba części": "1 lub 2 części, każda co najmniej 7 dni",
        },
        "termin": None,
    },
]

# Mały polski korpus (własne sformułowania, nie cytaty z ustaw) + zapytania z oczekiwanym fragmentem.
CORPUS: dict[str, str] = {
    "mac_wymiar": "Urlop macierzyński przy urodzeniu jednego dziecka trwa 20 tygodni, przy bliźniętach 31 tygodni, a przy trojaczkach 33 tygodnie.",
    "mac_przed": "Przed przewidywaną datą porodu można wykorzystać nie więcej niż 6 tygodni urlopu macierzyńskiego.",
    "rodz_wymiar": "Urlop rodzicielski wynosi 41 tygodni przy jednym dziecku i 43 tygodnie przy porodzie mnogim; po 9 tygodni przysługuje wyłącznie każdemu z rodziców.",
    "wariant_815": "Jeśli wniosek o urlop rodzicielski złożysz w ciągu 21 dni po porodzie, zasiłek za cały okres wynosi 81,5% podstawy wymiaru.",
    "ojcowski": "Ojciec dziecka ma prawo do 2 tygodni urlopu ojcowskiego, który trzeba wykorzystać do ukończenia przez dziecko 12 miesięcy, jednorazowo albo w dwóch częściach.",
    "wyczekiwanie": "Przy dobrowolnym ubezpieczeniu chorobowym prawo do zasiłku chorobowego powstaje dopiero po 90 dniach nieprzerwanego ubezpieczenia.",
    "platnik": "Zasiłki wypłaca pracodawca, który według stanu na 30 listopada poprzedniego roku zgłaszał do ubezpieczenia chorobowego więcej niż 20 osób; w pozostałych przypadkach wypłaca ZUS.",
    "praca_rodz": "W czasie urlopu rodzicielskiego można pracować u swojego pracodawcy w wymiarze nie większym niż połowa etatu; urlop wydłuża się wtedy proporcjonalnie.",
    "martwe": "W razie urodzenia martwego dziecka lub jego zgonu przed ukończeniem 8 tygodni życia matce przysługuje 8 tygodni urlopu macierzyńskiego po porodzie, nie mniej niż 7 dni od zgonu.",
    "adopcja": "Osoba, która przyjęła dziecko na wychowanie i wystąpiła do sądu o przysposobienie, ma prawo do urlopu na warunkach urlopu macierzyńskiego, jeśli dziecko nie ukończyło 14 lat.",
    "zadluzenie": "Osoba prowadząca działalność, która ma zaległości w składkach w dniu powstania prawa do zasiłku, otrzyma go dopiero po spłacie całego zadłużenia.",
    "chorobowy_ciaza": "Za okres niezdolności do pracy przypadający w czasie ciąży zasiłek chorobowy wynosi 100% podstawy wymiaru; na zwolnieniu lekarz wpisuje kod B.",
}
EMBEDDING_QUERIES: list[tuple[str, str]] = [
    ("ile tygodni macierzyńskiego przy bliźniakach", "mac_wymiar"),
    ("kiedy najwcześniej mogę iść na urlop przed porodem", "mac_przed"),
    ("ile tygodni rodzicielskiego może wziąć tata tylko dla siebie", "rodz_wymiar"),
    ("do kiedy złożyć wniosek żeby dostać 81,5 procent", "wariant_815"),
    ("do kiedy mąż musi wykorzystać ojcowskie", "ojcowski"),
    ("dlaczego nie dostanę chorobowego, płacę dobrowolnie od miesiąca", "wyczekiwanie"),
    ("czy zasiłek wypłaci mi firma czy ZUS", "platnik"),
    ("czy mogę pracować na pół etatu będąc na rodzicielskim", "praca_rodz"),
    ("dziecko zmarło po porodzie, ile urlopu mi zostaje", "martwe"),
    ("adoptujemy dziewięcioletnią dziewczynkę, czy mam urlop", "adopcja"),
    ("mam zaległości w ZUS na działalności, czy dostanę zasiłek", "zadluzenie"),
    ("ile procent płacą na L4 w ciąży", "chorobowy_ciaza"),
]

# Instrukcje dla zapytań wymagane przez modele embeddingów „instruct” (dokumenty bez prefiksu).
QUERY_INSTRUCTIONS: dict[str, str] = {
    "e5-mistral": "Instruct: Given a question, retrieve passages that answer the question\nQuery: {q}",
    "bge-multilingual-gemma2": "<instruct>Given a question, retrieve passages that answer the question.\n<query>{q}",
}

# --------------------------------------------------------------------------------------
# Schemat klasyfikacji (to samo zadanie, które w ZUS-51 wykona orkiestrator)
# --------------------------------------------------------------------------------------

IntentLabel = StrEnum("IntentLabel", {k: k for k in [*INTENTS, OUT_OF_CATALOG]})  # type: ignore[misc]


class Classification(BaseModel):
    model_config = ConfigDict(extra="forbid")

    intent: IntentLabel
    confidence: float = Field(ge=0, le=1)
    children_count: int | None = Field(ge=1, le=10)


CLASSIFICATION_SCHEMA = Classification.model_json_schema()

CLASSIFY_SYSTEM = (
    "Jesteś klasyfikatorem pytań rodziców o zasiłki ZUS. Przypisz pytanie do jednej intencji "
    "z listy albo OUT_OF_CATALOG, jeśli żadna nie pasuje lub pytanie nie dotyczy świadczeń "
    "związanych z ciążą i rodzicielstwem.\n\nIntencje:\n"
    + "\n".join(f"- {k}: {v}" for k, v in INTENTS.items())
    + "\n\nPole children_count wypełnij tylko, gdy pytanie wprost podaje liczbę dzieci "
    "z jednego porodu; w przeciwnym razie null. confidence to pewność od 0 do 1."
)
SCHEMA_IN_PROMPT = (
    "\n\nOdpowiedz WYŁĄCZNIE obiektem JSON zgodnym z tym schematem, bez komentarzy:\n"
    + json.dumps(CLASSIFICATION_SCHEMA, ensure_ascii=False)
)
EXPLAIN_SYSTEM = (
    "Jesteś asystentem ZUS. Na podstawie wyniku silnika reguł napisz 1–2 krótkie zdania "
    "prostym językiem, zwracając się do użytkownika na „ty”. Używaj WYŁĄCZNIE liczb, dat "
    "i kwot z danych – nie licz niczego sam i nie dodawaj nowych liczb."
)

# --------------------------------------------------------------------------------------
# Pomocnicze
# --------------------------------------------------------------------------------------


@dataclass
class Call:
    kind: str
    model: str
    seconds: float
    ok: bool
    prompt_tokens: int | None = None
    completion_tokens: int | None = None
    reasoning_tokens: int | None = None
    error: str | None = None


@dataclass
class Report:
    started_at: str
    base_url: str
    models_available: list[str] = field(default_factory=list)
    chat_models: list[str] = field(default_factory=list)
    targets: list[str] = field(default_factory=list)
    anonymous: bool = False
    embedding_models: list[str] = field(default_factory=list)
    calls: list[Call] = field(default_factory=list)
    structured: dict[str, dict[str, dict[str, Any]]] = field(default_factory=dict)
    explain: dict[str, list[dict[str, Any]]] = field(default_factory=dict)
    ttft: dict[str, list[float]] = field(default_factory=dict)
    rate_limit_headers: dict[str, dict[str, str]] = field(default_factory=dict)
    throttled: dict[str, int] = field(default_factory=dict)
    burst: dict[str, dict[str, Any]] = field(default_factory=dict)
    embeddings: dict[str, dict[str, Any]] = field(default_factory=dict)
    cost: dict[str, Any] = field(default_factory=dict)
    errors: list[str] = field(default_factory=list)


def anonymous_http_client(timeout: float) -> DefaultAsyncHttpxClient:
    """Klient HTTP, który nie wysyła nagłówka Authorization (dostęp bez klucza)."""

    async def drop_auth(request: Any) -> None:
        request.headers.pop("Authorization", None)

    return DefaultAsyncHttpxClient(timeout=timeout, event_hooks={"request": [drop_auth]})


def load_dotenv(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, _, value = line.partition("=")
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def percentile(values: list[float], pct: float) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    index = max(0, math.ceil(pct / 100 * len(ordered)) - 1)
    return ordered[index]


MAX_ATTEMPTS = 6
BURST_PAUSE_S = 5.0


def retry_delay(exc: RateLimitError, attempt: int) -> float:
    header = exc.response.headers.get("retry-after") if exc.response is not None else None
    try:
        return min(float(header), 30.0) if header else min(2.0**attempt, 30.0)
    except ValueError:
        return min(2.0**attempt, 30.0)


def short_error(exc: BaseException) -> str:
    if isinstance(exc, APIStatusError):
        return f"HTTP {exc.status_code}: {str(exc.message)[:200]}"
    return f"{type(exc).__name__}: {str(exc)[:200]}"


THINK_RE = re.compile(r"<think>.*?(?:</think>|$)", re.DOTALL | re.IGNORECASE)


def strip_reasoning(text: str) -> str:
    """Usuwa blok rozumowania <think>…</think> (modele „reasoning”), zostawia odpowiedź."""
    return THINK_RE.sub("", text).strip()


def parse_json_loose(text: str) -> Any:
    """JSON z odpowiedzi; toleruje bloki ```json ... ``` (tryb „sam prompt”)."""
    cleaned = strip_reasoning(text)
    fenced = re.search(r"```(?:json)?\s*(.*?)```", cleaned, re.DOTALL)
    if fenced:
        cleaned = fenced.group(1).strip()
    return json.loads(cleaned)


DATE_RE = re.compile(r"\b\d{1,2}\.\d{1,2}\.\d{4}\b")
NUMBER_RE = re.compile(r"\d+(?:[  ]\d{3})*(?:[.,]\d+)?")


def normalize_number(raw: str) -> str | None:
    try:
        value = Decimal(raw.replace(" ", "").replace(" ", "").replace(",", "."))
    except InvalidOperation:
        return None
    return format(value.normalize(), "f")


def extract_numbers(text: str) -> set[str]:
    dates = set(DATE_RE.findall(text))
    rest = DATE_RE.sub(" ", text)
    numbers = {n for raw in NUMBER_RE.findall(rest) if (n := normalize_number(raw))}
    return dates | numbers


def allowed_numbers(card: dict[str, Any]) -> set[str]:
    return extract_numbers(json.dumps(card, ensure_ascii=False))


def cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b, strict=True))
    norm = math.sqrt(sum(x * x for x in a)) * math.sqrt(sum(y * y for y in b))
    return dot / norm if norm else 0.0


def find_models(available: list[str], needles: list[str]) -> list[str]:
    lowered = [(m, m.lower()) for m in available]
    return [m for m, low in lowered if any(n in low for n in needles)]


# --------------------------------------------------------------------------------------
# Pomiary
# --------------------------------------------------------------------------------------


@dataclass(frozen=True)
class Target:
    """Model + poziom rozumowania (``reasoning_effort``); None = domyślny serwera."""

    model: str
    effort: str | None = None

    @property
    def label(self) -> str:
        return f"{self.model} [effort={self.effort}]" if self.effort else self.model

    def extra(self) -> dict[str, Any]:
        return {"reasoning_effort": self.effort} if self.effort else {}


class Spike:
    def __init__(self, client: AsyncOpenAI, report: Report, args: argparse.Namespace) -> None:
        self.client = client
        self.report = report
        self.args = args

    async def retrying[T](self, model: str, make: Callable[[], Awaitable[T]]) -> tuple[T, float]:
        """Wywołanie z ponawianiem po 429. Zwraca wynik i czas OSTATNIEJ (udanej) próby.

        429 to informacja o limitach, nie wynik pomiaru – liczymy je osobno w ``throttled``.
        """
        for attempt in range(MAX_ATTEMPTS):
            start = time.perf_counter()
            try:
                return await make(), time.perf_counter() - start
            except RateLimitError as exc:
                self.report.throttled[model] = self.report.throttled.get(model, 0) + 1
                if attempt == MAX_ATTEMPTS - 1:
                    raise
                await asyncio.sleep(retry_delay(exc, attempt))
        raise AssertionError("unreachable")

    async def chat(
        self, kind: str, target: Target, messages: list[dict[str, str]], **kwargs: Any
    ) -> str | None:
        start = time.perf_counter()
        try:
            raw, seconds = await self.retrying(
                target.model,
                lambda: self.client.chat.completions.with_raw_response.create(
                    model=target.model,
                    messages=messages,  # type: ignore[arg-type]
                    temperature=0,
                    **target.extra(),
                    **kwargs,
                ),
            )
        except (APIError, OSError) as exc:
            self._fail(kind, target.label, start, exc)
            return None
        self._remember_limits(target.model, dict(raw.headers))
        completion = raw.parse()
        usage = completion.usage
        details = usage.completion_tokens_details if usage else None
        self.report.calls.append(
            Call(
                kind,
                target.label,
                seconds,
                ok=True,
                prompt_tokens=usage.prompt_tokens if usage else None,
                completion_tokens=usage.completion_tokens if usage else None,
                reasoning_tokens=details.reasoning_tokens if details else None,
            )
        )
        # Treść odpowiedzi jest w `content`; rozumowanie (pole `reasoning`) pomijamy.
        return completion.choices[0].message.content or ""

    def tokens(self, base: int) -> int:
        """Limit tokenów odpowiedzi; modele „reasoning” zużywają tokeny na rozumowanie."""
        return int(base * self.args.max_tokens_multiplier)

    def _fail(self, kind: str, model: str, start: float, exc: BaseException) -> None:
        self.report.calls.append(
            Call(kind, model, time.perf_counter() - start, ok=False, error=short_error(exc))
        )

    def _remember_limits(self, model: str, headers: dict[str, str]) -> None:
        found = {
            k: v
            for k, v in headers.items()
            if "ratelimit" in k.lower() or k.lower() in {"retry-after", "x-request-id"}
        }
        if found:
            self.report.rate_limit_headers[model] = found

    async def list_models(self) -> None:
        page = await self.client.models.list()
        self.report.models_available = sorted(m.id for m in page.data)

    async def structured_output(self, target: Target) -> None:
        questions = QUESTIONS[: self.args.questions]
        modes: dict[str, dict[str, Any]] = {
            "json_schema": {
                "response_format": {
                    "type": "json_schema",
                    "json_schema": {
                        "name": "classification",
                        "schema": CLASSIFICATION_SCHEMA,
                        "strict": True,
                    },
                }
            },
            "json_object": {"response_format": {"type": "json_object"}},
            "prompt": {},
        }
        results: dict[str, dict[str, Any]] = {}
        for mode, extra in modes.items():
            if mode not in self.args.modes:
                continue
            stats: dict[str, Any] = {"calls": 0, "errors": 0, "json_valid": 0}
            stats |= {"schema_valid": 0, "intent_correct": 0, "children_correct": 0}
            stats["mistakes"] = []
            system = (
                CLASSIFY_SYSTEM if mode == "json_schema" else CLASSIFY_SYSTEM + SCHEMA_IN_PROMPT
            )
            for question, expected, children in questions:
                stats["calls"] += 1
                text = await self.chat(
                    f"classify:{mode}",
                    target,
                    [{"role": "system", "content": system}, {"role": "user", "content": question}],
                    max_tokens=self.tokens(150),
                    **extra,
                )
                if text is None:
                    stats["errors"] += 1
                    continue
                try:
                    data = parse_json_loose(text)
                    stats["json_valid"] += 1
                    result = Classification.model_validate(data)
                except json.JSONDecodeError, ValidationError:
                    stats["mistakes"].append({"question": question, "raw": text[:300]})
                    continue
                stats["schema_valid"] += 1
                if result.intent == expected:
                    stats["intent_correct"] += 1
                else:
                    stats["mistakes"].append(
                        {"question": question, "expected": expected, "got": str(result.intent)}
                    )
                if result.children_count == children:
                    stats["children_correct"] += 1
            results[mode] = stats
            progress(
                f"    {mode:<12} schema OK {stats['schema_valid']}/{stats['calls']}, "
                f"intencja OK {stats['intent_correct']}/{stats['calls']}"
            )
        self.report.structured[target.label] = results

    async def explain(self, target: Target) -> None:
        outputs: list[dict[str, Any]] = []
        for card in ENGINE_CARDS:
            text = await self.chat(
                "explain",
                target,
                [
                    {"role": "system", "content": EXPLAIN_SYSTEM},
                    {"role": "user", "content": json.dumps(card, ensure_ascii=False)},
                ],
                max_tokens=self.tokens(200),
            )
            if text is None:
                continue
            answer = strip_reasoning(text)
            foreign = sorted(extract_numbers(answer) - allowed_numbers(card))
            outputs.append(
                {
                    "question": card["pytanie"],
                    "text": answer,
                    "had_reasoning_block": answer != text.strip(),
                    "foreign_numbers": foreign,
                }
            )
        self.report.explain[target.label] = outputs

    async def time_to_first_token(self, target: Target, runs: int = 3) -> None:
        card = ENGINE_CARDS[0]

        async def first_token() -> float | None:
            start = time.perf_counter()
            stream = await self.client.chat.completions.create(
                model=target.model,
                **target.extra(),
                messages=[
                    {"role": "system", "content": EXPLAIN_SYSTEM},
                    {"role": "user", "content": json.dumps(card, ensure_ascii=False)},
                ],
                temperature=0,
                max_tokens=self.tokens(120),
                stream=True,
            )
            first: float | None = None
            async for chunk in stream:
                if first is None and chunk.choices and chunk.choices[0].delta.content:
                    first = time.perf_counter() - start
            return first

        values: list[float] = []
        for _ in range(runs):
            try:
                first, _seconds = await self.retrying(target.model, first_token)
            except (APIError, OSError) as exc:
                self.report.errors.append(f"[{target.label}] streaming: {short_error(exc)}")
                break
            if first is not None:
                values.append(first)
        self.report.ttft[target.label] = values

    async def burst(self, model: str, size: int) -> None:
        async def one() -> str:
            try:
                await self.client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": "Odpowiedz jednym słowem: tak."}],
                    max_tokens=3,
                )
            except APIStatusError as exc:
                return str(exc.status_code)
            except (APIError, OSError) as exc:
                return type(exc).__name__
            return "200"

        start = time.perf_counter()
        statuses = await asyncio.gather(*(one() for _ in range(size)))
        counts: dict[str, int] = {}
        for status in statuses:
            counts[status] = counts.get(status, 0) + 1
        self.report.burst[model] = {
            "requests": size,
            "seconds": round(time.perf_counter() - start, 2),
            "statuses": counts,
        }

    async def embeddings(self, model: str) -> None:
        ids = list(CORPUS)
        try:
            docs, doc_seconds = await self.retrying(
                model,
                lambda: self.client.embeddings.create(model=model, input=[CORPUS[i] for i in ids]),
            )
        except (APIError, OSError) as exc:
            self.report.embeddings[model] = {"error": short_error(exc)}
            return
        doc_vectors = [d.embedding for d in docs.data]
        variants = {"bez instrukcji": "{q}"}
        for key, template in QUERY_INSTRUCTIONS.items():
            if key in model.lower():
                variants["z instrukcją"] = template
        result: dict[str, Any] = {
            "dimensions": len(doc_vectors[0]) if doc_vectors else None,
            "corpus_seconds": round(doc_seconds, 3),
            "corpus_tokens": docs.usage.prompt_tokens if docs.usage else None,
            "variants": {},
        }
        for name, template in variants.items():
            queries = [template.format(q=q) for q, _ in EMBEDDING_QUERIES]
            try:
                response, query_seconds = await self.retrying(
                    model, partial(self.client.embeddings.create, model=model, input=queries)
                )
            except (APIError, OSError) as exc:
                result["variants"][name] = {"error": short_error(exc)}
                continue
            top1 = top3 = 0
            reciprocal: list[float] = []
            misses: list[dict[str, str]] = []
            for (question, expected), item in zip(EMBEDDING_QUERIES, response.data, strict=True):
                scores = [cosine(item.embedding, d) for d in doc_vectors]
                ranking = [ids[i] for i in sorted(range(len(ids)), key=lambda i: -scores[i])]
                rank = ranking.index(expected) + 1
                top1 += rank == 1
                top3 += rank <= 3
                reciprocal.append(1 / rank)
                if rank > 1:
                    misses.append({"query": question, "expected": expected, "got": ranking[0]})
            total = len(EMBEDDING_QUERIES)
            result["variants"][name] = {
                "top1": f"{top1}/{total}",
                "top3": f"{top3}/{total}",
                "mrr": round(statistics.mean(reciprocal), 3),
                "queries_seconds": round(query_seconds, 3),
                "misses": misses,
            }
        self.report.embeddings[model] = result


def progress(message: str) -> None:
    print(message, flush=True)


# --------------------------------------------------------------------------------------
# Koszt i raport
# --------------------------------------------------------------------------------------


def latency_table(report: Report) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    groups: dict[tuple[str, str], list[Call]] = {}
    for call in report.calls:
        groups.setdefault((call.model, call.kind), []).append(call)
    for (model, kind), calls in sorted(groups.items()):
        ok = [c.seconds for c in calls if c.ok]
        rows.append(
            {
                "model": model,
                "kind": kind,
                "calls": len(calls),
                "errors": sum(not c.ok for c in calls),
                "p50_s": round(statistics.median(ok), 2) if ok else None,
                "p95_s": round(p, 2) if (p := percentile(ok, 95)) is not None else None,
                "max_s": round(max(ok), 2) if ok else None,
                "reasoning_tokens_avg": round(statistics.mean(r))
                if (r := [c.reasoning_tokens for c in calls if c.reasoning_tokens is not None])
                else None,
            }
        )
    return rows


def best_mode(modes: dict[str, dict[str, Any]]) -> str:
    """Tryb, którego użyłby orkiestrator: najbardziej rygorystyczny z działających."""
    for mode in ("json_schema", "json_object", "prompt"):
        if modes.get(mode, {}).get("schema_valid", 0) > 0:
            return mode
    return "json_schema"


def estimate_cost(report: Report, args: argparse.Namespace) -> None:
    per_model: dict[str, Any] = {}
    for model in report.targets:

        def avg(kind_prefix: str, attr: str, model: str = model) -> float:
            values = [
                getattr(c, attr)
                for c in report.calls
                if c.model == model
                and c.kind.startswith(kind_prefix)
                and c.ok
                and getattr(c, attr) is not None
            ]
            return statistics.mean(values) if values else 0.0

        mode = best_mode(report.structured.get(model, {}))
        classify = f"classify:{mode}"
        tokens_in = avg(classify, "prompt_tokens") + avg("explain", "prompt_tokens")
        tokens_out = avg(classify, "completion_tokens") + avg("explain", "completion_tokens")
        entry: dict[str, Any] = {
            "classification_mode": mode,
            "tokens_in_per_question": round(tokens_in),
            "tokens_out_per_question": round(tokens_out),
        }
        if args.price_in is not None and args.price_out is not None:
            per_question = (tokens_in * args.price_in + tokens_out * args.price_out) / 1_000_000
            entry["cost_per_question"] = round(per_question, 6)
            entry["cost_per_1000_questions"] = round(per_question * 1000, 2)
        per_model[model] = entry
    report.cost = {
        "currency": args.currency,
        "price_in_per_1m": args.price_in,
        "price_out_per_1m": args.price_out,
        "assumption": (
            "1 pytanie = 1 klasyfikacja (najlepszy działający tryb) + 1 wyjaśnienie; "
            "bez RAG i ponowień"
        ),
        "models": per_model,
    }


def render_markdown(report: Report) -> str:
    lines = [
        "# Spike ZUS-05 – wyniki pomiarów",
        "",
        f"- Data: {report.started_at}",
        f"- Endpoint: `{report.base_url}`",
        f"- Modele czatu: {', '.join(f'`{m}`' for m in report.chat_models) or '—'}",
        f"- Modele embeddingów: {', '.join(f'`{m}`' for m in report.embedding_models) or '—'}",
        f"- Warianty (model + reasoning_effort): {', '.join(f'`{t}`' for t in report.targets) or '—'}",
        f"- Dostęp: {'bez klucza (anonimowy)' if report.anonymous else 'z kluczem API'}",
        "",
        "## Dostępne modele (GET /models)",
        "",
        *(f"- `{m}`" for m in report.models_available),
        "",
        "## Structured output i rozpoznanie intencji",
        "",
        "| Model | Tryb | Wywołania | Błędy API | JSON poprawny | Zgodny ze schematem | Intencja trafna | Liczba dzieci trafna |",
        "|---|---|---|---|---|---|---|---|",
    ]
    for model, modes in report.structured.items():
        for mode, s in modes.items():
            n = s["calls"]
            lines.append(
                f"| `{model}` | {mode} | {n} | {s['errors']} | {s['json_valid']}/{n} | "
                f"{s['schema_valid']}/{n} | {s['intent_correct']}/{n} | {s['children_correct']}/{n} |"
            )
    lines += [
        "",
        "## Opóźnienia",
        "",
        "| Model | Rodzaj | Wywołania | Błędy | p50 [s] | p95 [s] | max [s] | Tokeny rozumowania (śr.) |",
        "|---|---|---|---|---|---|---|---|",
    ]
    for row in latency_table(report):
        lines.append(
            f"| `{row['model']}` | {row['kind']} | {row['calls']} | {row['errors']} | "
            f"{row['p50_s']} | {row['p95_s']} | {row['max_s']} | {row['reasoning_tokens_avg']} |"
        )
    lines += ["", "Czas do pierwszego tokenu (streaming, wyjaśnienie):", ""]
    for model, values in report.ttft.items():
        shown = ", ".join(f"{v:.2f} s" for v in values) or "brak danych"
        lines.append(f"- `{model}`: {shown}")
    lines += ["", "## Wyjaśnienia wyniku silnika (do oceny jakości polszczyzny)", ""]
    for model, outputs in report.explain.items():
        foreign = sum(bool(o["foreign_numbers"]) for o in outputs)
        lines += [f"### `{model}` – odpowiedzi z obcymi liczbami: {foreign}/{len(outputs)}", ""]
        for o in outputs:
            flag = f" **obce liczby: {o['foreign_numbers']}**" if o["foreign_numbers"] else ""
            lines.append(f"- *{o['question']}* → {o['text'].strip()}{flag}")
        lines.append("")
    lines += ["## Limity", ""]
    for model, headers in report.rate_limit_headers.items():
        lines.append(f"- `{model}`: " + ", ".join(f"`{k}: {v}`" for k, v in headers.items()))
    if not report.rate_limit_headers:
        lines.append("- API nie zwróciło nagłówków limitów – sprawdź limity w panelu Sherlock.")
    for model, count in report.throttled.items():
        lines.append(f"- `{model}`: {count}× HTTP 429 podczas pomiarów (zapytania ponowione)")
    for model, burst in report.burst.items():
        lines.append(
            f"- Seria `{model}`: {burst['requests']} równoległych zapytań w {burst['seconds']} s, "
            f"statusy {burst['statuses']}"
        )
    lines += ["", "## Embeddingi (korpus 12 fragmentów, 12 zapytań po polsku)", ""]
    lines += ["| Model | Wymiar | Wariant | top-1 | top-3 | MRR |", "|---|---|---|---|---|---|"]
    for model, emb in report.embeddings.items():
        if "error" in emb:
            lines.append(f"| `{model}` | — | błąd: {emb['error']} | | | |")
            continue
        for name, v in emb["variants"].items():
            if "error" in v:
                lines.append(
                    f"| `{model}` | {emb['dimensions']} | {name}: błąd {v['error']} | | | |"
                )
            else:
                lines.append(
                    f"| `{model}` | {emb['dimensions']} | {name} | {v['top1']} | {v['top3']} | {v['mrr']} |"
                )
    lines += ["", "## Szacunek kosztu", "", f"Założenie: {report.cost.get('assumption', '')}", ""]
    currency = report.cost.get("currency") or ""
    for model, c in report.cost.get("models", {}).items():
        line = (
            f"- `{model}` (klasyfikacja: {c['classification_mode']}): "
            f"~{c['tokens_in_per_question']} tokenów wejścia i "
            f"~{c['tokens_out_per_question']} wyjścia na pytanie"
        )
        if "cost_per_1000_questions" in c:
            line += f"; {c['cost_per_1000_questions']} {currency} za 1000 pytań"
        else:
            line += "; ceny nie podano (--price-in/--price-out)"
        lines.append(line)
    if report.errors:
        lines += ["", "## Błędy", "", *(f"- {e}" for e in report.errors)]
    failed = [c for c in report.calls if not c.ok]
    if failed:
        lines += ["", "Przykładowe błędy wywołań:", ""]
        lines += [f"- `{c.model}` {c.kind}: {c.error}" for c in failed[:10]]
    return "\n".join(lines) + "\n"


# --------------------------------------------------------------------------------------
# Główny przebieg
# --------------------------------------------------------------------------------------


def parse_args(argv: list[str] | None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Spike ZUS-05: pomiary LLM i embeddingów.")
    parser.add_argument("--base-url", default=os.environ.get("LLM_BASE_URL", DEFAULT_BASE_URL))
    parser.add_argument("--chat-models", nargs="*", help="nadpisz wykryte modele czatu")
    parser.add_argument("--embedding-models", nargs="*", help="nadpisz wykryte modele embeddingów")
    parser.add_argument("--questions", type=int, default=len(QUESTIONS), help="ile pytań (1–20)")
    parser.add_argument(
        "--burst", type=int, default=8, help="liczba równoległych zapytań; 0 = pomiń"
    )
    parser.add_argument("--price-in", type=float, help="cena za 1M tokenów wejścia (z panelu)")
    parser.add_argument("--price-out", type=float, help="cena za 1M tokenów wyjścia (z panelu)")
    parser.add_argument("--currency", default="USD")
    parser.add_argument("--timeout", type=float, default=60.0)
    parser.add_argument(
        "--max-tokens-multiplier",
        type=float,
        default=8.0,
        help="mnożnik limitów tokenów odpowiedzi (rozumowanie zużywa tokeny); 1 = bez zapasu",
    )
    parser.add_argument(
        "--reasoning-efforts",
        nargs="+",
        default=["none", "low", "medium"],
        help="poziomy reasoning_effort do porównania; 'default' = nie wysyłaj parametru",
    )
    parser.add_argument(
        "--modes",
        nargs="+",
        choices=MODES,
        default=list(MODES),
        help="tryby structured output do sprawdzenia",
    )
    parser.add_argument(
        "--anonymous", action="store_true", help="bez klucza API (jeśli dostawca na to pozwala)"
    )
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--list-only", action="store_true", help="tylko GET /models")
    return parser.parse_args(argv)


async def run(args: argparse.Namespace) -> Report:
    api_key = os.environ.get("LLM_API_KEY")
    if not api_key and not args.anonymous:
        sys.exit(
            "Brak LLM_API_KEY (zmienna środowiskowa albo plik .env). Bez klucza: dodaj --anonymous."
        )
    client = AsyncOpenAI(
        api_key=api_key or "anonymous",
        base_url=args.base_url,
        timeout=args.timeout,
        max_retries=0,
        http_client=anonymous_http_client(args.timeout) if not api_key else None,
    )
    report = Report(
        started_at=datetime.now(UTC).isoformat(timespec="seconds"),
        base_url=args.base_url,
        anonymous=not api_key,
    )
    spike = Spike(client, report, args)

    progress("1/5 Lista modeli…")
    try:
        await spike.list_models()
    except (APIError, OSError) as exc:
        sys.exit(f"Nie udało się pobrać listy modeli: {short_error(exc)}")
    progress("    " + ", ".join(report.models_available))
    report.chat_models = args.chat_models or [
        m
        for m in find_models(report.models_available, DEFAULT_CHAT_NEEDLES)
        if not any(x in m.lower() for x in EXCLUDED_CHAT_NEEDLES)
    ]
    report.embedding_models = args.embedding_models or find_models(
        report.models_available, ["e5", "bge", "embed", "gte", "stella", "mmlw"]
    )
    if args.list_only:
        return report
    if not report.chat_models:
        report.errors.append("Nie znaleziono modelu Olala/Bielik/PLLuM – podaj --chat-models.")

    efforts = [None if e == "default" else e for e in args.reasoning_efforts]
    targets = [Target(m, e) for m in report.chat_models for e in efforts]
    report.targets = [t.label for t in targets]
    for target in targets:
        progress(f"2/5 Structured output: {target.label}")
        await spike.structured_output(target)
        progress(f"3/5 Wyjaśnienia i streaming: {target.label}")
        await spike.explain(target)
        await spike.time_to_first_token(target)

    for model in report.embedding_models:
        progress(f"4/5 Embeddingi: {model}")
        await spike.embeddings(model)

    # Seria na końcu: celowo może wyczerpać limit, więc nie może zaburzyć pomiarów powyżej.
    if args.burst > 0:
        for model in report.chat_models:
            progress(f"5/5 Seria {args.burst} równoległych zapytań: {model}")
            await spike.burst(model, args.burst)
            await asyncio.sleep(BURST_PAUSE_S)

    estimate_cost(report, args)
    return report


def save(report: Report, out_dir: Path) -> tuple[Path, Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    json_path = out_dir / "report.json"
    md_path = out_dir / "report.md"
    data = asdict(report) | {"latency": latency_table(report)}
    json_path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n"
    )
    md_path.write_text(render_markdown(report), encoding="utf-8", newline="\n")
    return json_path, md_path


def main(argv: list[str] | None = None) -> None:
    load_dotenv(ROOT / ".env")
    args = parse_args(argv)
    args.questions = max(1, min(args.questions, len(QUESTIONS)))
    report = asyncio.run(run(args))
    json_path, md_path = save(report, args.out)
    progress(f"\nGotowe. Raport: {md_path}\n         Dane:   {json_path}")


if __name__ == "__main__":
    main()
