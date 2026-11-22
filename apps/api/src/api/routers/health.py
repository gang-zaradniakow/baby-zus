"""``/health`` – stan API i bazy (healthcheck kontenera, TA-01/02)."""

from typing import Annotated

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel

from api import __version__
from api.db.engine import database_is_up
from api.errors import ApiError, ErrorResponse

router = APIRouter(tags=["system"])


class Health(BaseModel):
    status: str
    version: str
    database: str


async def database_probe(request: Request) -> bool:
    """Zależność podmienialna w testach jednostkowych; w integracyjnych – prawdziwa baza."""
    timeout_s: float = request.app.state.settings.health_db_timeout_s
    return await database_is_up(request.app.state.engine, timeout_s)


@router.get(
    "/health",
    responses={503: {"model": ErrorResponse, "description": "Baza niedostępna"}},
)
async def health(database_ok: Annotated[bool, Depends(database_probe)]) -> Health:
    if not database_ok:
        raise ApiError(503, "DATABASE_UNAVAILABLE", "Baza danych jest niedostępna.")
    return Health(status="ok", version=__version__, database="ok")
