"""Korpus bazy wiedzy z ``data/knowledge`` (U2: treści w repozytorium, panel tylko je pokazuje).

- ``law.json`` – streszczenia przepisów z linkiem do aktu w ISAP,
- ``guides.json`` – streszczenia poradników ZUS i gov.pl z linkiem do strony,
- ``support_orgs.json`` – organizacje wsparcia z kategoriami (§9.3, ścieżka E6).

Każdy fragment ma adres https – odpowiedź z RAG zawsze wskazuje źródło (TM-19, TL-37).
"""

import hashlib
import json
from enum import StrEnum
from pathlib import Path
from typing import Final

from pydantic import Field, HttpUrl, field_validator

from contracts._base import ContractModel
from contracts.types import NonEmptyStr

LAW_FILE: Final = "law.json"
GUIDES_FILE: Final = "guides.json"
ORGS_FILE: Final = "support_orgs.json"


class ChunkKind(StrEnum):
    LAW = "LAW"
    GUIDE = "GUIDE"


def _https(value: HttpUrl) -> HttpUrl:
    if value.scheme != "https":
        raise ValueError("adres źródła musi używać https")
    return value


class KnowledgeChunk(ContractModel):
    id: NonEmptyStr
    kind: ChunkKind
    title: NonEmptyStr
    text: NonEmptyStr
    url: HttpUrl
    act: str | None = None
    article: str | None = None
    to_verify: bool = False

    _check_url = field_validator("url")(_https)

    @property
    def content_hash(self) -> str:
        """Zmiana treści = nowe embeddingi przy ponownym wczytaniu korpusu."""
        payload = f"{self.title}\n{self.text}\n{self.url}"
        return hashlib.sha256(payload.encode()).hexdigest()

    def embedding_text(self) -> str:
        return " ".join(p for p in (self.act, self.article, self.title, self.text) if p)


class Situation(StrEnum):
    """Sytuacja trudna, dla której szukamy wsparcia (§9.3)."""

    MISCARRIAGE = "MISCARRIAGE"
    STILLBIRTH = "STILLBIRTH"
    CHILD_DEATH = "CHILD_DEATH"
    PREMATURE_BIRTH = "PREMATURE_BIRTH"
    CHILD_HOSPITALIZATION = "CHILD_HOSPITALIZATION"
    SEVERE_ILLNESS = "SEVERE_ILLNESS"
    """Ciężka, nieuleczalna choroba dziecka (np. zaświadczenie „Za życiem”)."""


#: Sytuacja → kategorie organizacji (kolejność = ważność).
SITUATION_CATEGORIES: Final[dict[Situation, tuple[str, ...]]] = {
    Situation.MISCARRIAGE: ("poronienie", "żałoba"),
    Situation.STILLBIRTH: ("żałoba",),
    Situation.CHILD_DEATH: ("żałoba",),
    Situation.PREMATURE_BIRTH: ("wcześniaki",),
    Situation.CHILD_HOSPITALIZATION: ("wcześniaki", "ciężka choroba dziecka"),
    Situation.SEVERE_ILLNESS: ("ciężka choroba dziecka",),
}


class SupportOrg(ContractModel):
    id: NonEmptyStr
    name: NonEmptyStr
    description: NonEmptyStr
    url: HttpUrl | None
    """``None`` – strona niepotwierdzona (``to_verify``); pokazujemy nazwę bez linku."""
    categories: list[NonEmptyStr] = Field(min_length=1)
    to_verify: bool = False

    @field_validator("url")
    @classmethod
    def _url_https(cls, value: HttpUrl | None) -> HttpUrl | None:
        return None if value is None else _https(value)


def _fragments(path: Path, kind: ChunkKind) -> list[KnowledgeChunk]:
    raw = json.loads(path.read_text(encoding="utf-8"))
    return [KnowledgeChunk.model_validate({**item, "kind": kind}) for item in raw["fragments"]]


def load_corpus(directory: Path) -> list[KnowledgeChunk]:
    chunks = _fragments(directory / LAW_FILE, ChunkKind.LAW)
    chunks += _fragments(directory / GUIDES_FILE, ChunkKind.GUIDE)
    ids = [c.id for c in chunks]
    if len(ids) != len(set(ids)):
        raise ValueError(f"powtórzone identyfikatory fragmentów w {directory}")
    return chunks


def load_support_orgs(directory: Path) -> list[SupportOrg]:
    raw = json.loads((directory / ORGS_FILE).read_text(encoding="utf-8"))
    return [SupportOrg.model_validate(item) for item in raw["organizations"]]


def orgs_for(orgs: list[SupportOrg], situation: Situation) -> list[SupportOrg]:
    """Organizacje dla sytuacji – najpierw z najważniejszej kategorii."""
    categories = SITUATION_CATEGORIES[situation]

    def rank(org: SupportOrg) -> int:
        return min(categories.index(c) for c in org.categories if c in categories)

    matching = [org for org in orgs if set(org.categories) & set(categories)]
    return sorted(matching, key=rank)
