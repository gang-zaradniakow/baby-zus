"""Typ kolumny ``vector`` (pgvector) bez zależności od pakietu ``pgvector`` (i numpy).

Wektory zapisuje i czyta ``assistant.rag.index`` przez SQL z rzutowaniem ``CAST(:v AS vector)``;
tutaj typ służy tylko schematowi: migracji i porównaniu modeli z bazą (TA-03).
"""

from typing import Any

from sqlalchemy.dialects.postgresql.base import ischema_names
from sqlalchemy.types import UserDefinedType


class Vector(UserDefinedType[list[float]]):
    """``vector`` bez stałego wymiaru – model embeddingów wybiera konfiguracja (ADR 0002)."""

    cache_ok = True

    def get_col_spec(self, **_: Any) -> str:
        return "vector"


# Odczyt schematu z bazy rozpozna typ (bez ostrzeżenia „Did not recognize type 'vector'”).
ischema_names["vector"] = Vector
