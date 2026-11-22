"""Aplikacja ASGI API (``uvicorn api.main:app``).

Usługi (silnik bazy, repozytorium sesji, źródło profilu, zegar) trafiają do ``app.state``.
Testy podają własne przez argumenty ``create_app`` – np. repozytorium w pamięci i mock
profilu – zamiast łatać moduły. Błędy mają format ``{code, message, details}``.
"""

from collections.abc import AsyncIterator
from contextlib import AsyncExitStack, asynccontextmanager

from fastapi import FastAPI

from api import __version__
from api.db.conversation_repository import SqlConversationRepository
from api.db.engine import create_engine, create_sessionmaker
from api.db.escalation_repository import SqlEscalationRepository
from api.db.session_repository import SqlSessionRepository
from api.deps import Clock, utc_now
from api.errors import ErrorResponse, install_error_handlers
from api.routers import answers, auth, chat, escalations, health, intents, me
from api.services.assistant import (
    ChatAssistant,
    build_assistant,
    build_escalation_sender,
    build_llm,
)
from api.services.conversations import ConversationRepository
from api.services.escalation_sender import EscalationSender
from api.services.escalations import EscalationRepository
from api.services.sessions import SessionRepository
from api.settings import Settings, get_settings
from assistant.llm import LLMClient
from profile_source import ProfileSource, create_profile_source


def create_app(
    settings: Settings | None = None,
    *,
    profile_source: ProfileSource | None = None,
    sessions: SessionRepository | None = None,
    conversations: ConversationRepository | None = None,
    assistant: ChatAssistant | None = None,
    escalation_repository: EscalationRepository | None = None,
    llm: LLMClient | None = None,
    escalation_sender: EscalationSender | None = None,
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
            app.state.conversations = conversations or SqlConversationRepository(
                app.state.sessionmaker
            )
            app.state.assistant = assistant or build_assistant(clock)
            app.state.escalations = escalation_repository or SqlEscalationRepository(
                app.state.sessionmaker
            )
            app.state.llm = llm or build_llm()
            app.state.escalation_sender = escalation_sender or build_escalation_sender()
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
    app.include_router(chat.router)
    app.include_router(escalations.router)
    return app


app = create_app()
