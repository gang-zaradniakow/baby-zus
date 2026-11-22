"""Aplikacja ASGI API (``uvicorn api.main:app``).

Usługi (silnik bazy, repozytorium sesji, źródło profilu, zegar) trafiają do ``app.state``.
Testy podają własne przez argumenty ``create_app`` – np. repozytorium w pamięci i mock
profilu – zamiast łatać moduły. Błędy mają format ``{code, message, details}``.
"""

from collections.abc import AsyncIterator
from contextlib import AsyncExitStack, asynccontextmanager

from fastapi import FastAPI

from api import __version__
from api.db.engine import create_engine, create_sessionmaker
from api.db.session_repository import SqlSessionRepository
from api.deps import Clock, utc_now
from api.errors import ErrorResponse, install_error_handlers
from api.routers import answers, auth, health, intents, me
from api.services.sessions import SessionRepository
from api.settings import Settings, get_settings
from profile_source import ProfileSource, create_profile_source


def create_app(
    settings: Settings | None = None,
    *,
    profile_source: ProfileSource | None = None,
    sessions: SessionRepository | None = None,
    clock: Clock = utc_now,
) -> FastAPI:
    settings = settings or get_settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        async with AsyncExitStack() as stack:
            engine = create_engine(settings.database_url)
            stack.push_async_callback(engine.dispose)
            app.state.engine = engine
            app.state.sessionmaker = create_sessionmaker(engine)
            app.state.sessions = sessions or SqlSessionRepository(app.state.sessionmaker)
            source = profile_source
            if source is None:
                # Zła konfiguracja (PROFILE_SOURCE, BACKEND_URL…) zatrzymuje start aplikacji.
                source = create_profile_source()
                stack.push_async_callback(source.aclose)
            app.state.profile_source = source
            yield

    app = FastAPI(
        title="Asystent ZUS – API",
        version=__version__,
        lifespan=lifespan,
        responses={
            422: {"model": ErrorResponse, "description": "Niepoprawne dane"},
            500: {"model": ErrorResponse, "description": "Błąd serwera"},
        },
    )
    app.state.settings = settings
    app.state.clock = clock
    install_error_handlers(app)
    app.include_router(health.router)
    app.include_router(auth.router)
    app.include_router(me.router)
    app.include_router(intents.router)
    app.include_router(answers.router)
    return app


app = create_app()
