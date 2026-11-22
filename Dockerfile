# Obraz jednej aplikacji z apps/ (domyślnie api). Inną buduje się argumentem, np.:
#   docker build --build-arg APP=admin -t zus-admin .
# Moduł ASGI w obrazie ustawia APP_MODULE (domyślnie <APP>.main:app).

ARG PYTHON_VERSION=3.14

FROM python:${PYTHON_VERSION}-slim AS build
ARG APP=api
ENV PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_COLOR=1
RUN python -m venv /opt/venv
ENV PATH=/opt/venv/bin:$PATH
WORKDIR /src
COPY packages ./packages
# Wszystkie aplikacje: niektóre zależą od innych (mcp_servers → assistant: embeddingi, RAG).
COPY apps ./apps
# requirements.txt instaluje pakiety lokalne jako `-e`. W obrazie instalujemy je
# zwykle (bez -e), żeby venv nie zależał od /src i dało się go skopiować dalej.
# pip liczy ścieżki względem bieżącego katalogu, stąd instalacja z katalogu aplikacji.
WORKDIR /src/apps/${APP}
RUN --mount=type=cache,target=/root/.cache/pip \
    sed 's/^-e[[:space:]]\+//' requirements.txt > /tmp/requirements.txt \
 && pip install -r /tmp/requirements.txt

FROM python:${PYTHON_VERSION}-slim
ARG APP=api
RUN groupadd --system --gid 10001 app \
 && useradd --system --uid 10001 --gid app --no-create-home --shell /usr/sbin/nologin app
COPY --from=build /opt/venv /opt/venv
# Persony T01–T12 dla PROFILE_SOURCE=mock (demo bez backendu profilu, ZUS-30/31)
# i korpus bazy wiedzy (serwer MCP wiedza, ZUS-35).
COPY data/personas /app/data/personas
COPY data/knowledge /app/data/knowledge
ENV PATH=/opt/venv/bin:$PATH \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    APP_MODULE=${APP}.main:app \
    PERSONAS_DIR=/app/data/personas \
    KNOWLEDGE_DIR=/app/data/knowledge
WORKDIR /app
USER app
EXPOSE 8000
HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=5 \
    CMD ["python", "-c", "import urllib.request as u; u.urlopen('http://127.0.0.1:8000/health', timeout=3)"]
CMD ["sh", "-c", "exec uvicorn \"$APP_MODULE\" --host 0.0.0.0 --port 8000 --proxy-headers"]
