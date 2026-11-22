#!/usr/bin/env bash
# Sprawdzenie `docker compose up` (ZUS-02 AC, TX-00): wszystkie usługi zdrowe i API odpowiada.
#
#   bash scripts/compose_smoke.sh            # zbuduj, uruchom, sprawdź, posprzątaj
#   KEEP=1 bash scripts/compose_smoke.sh     # zostaw usługi uruchomione po sprawdzeniu
#
# Osobna nazwa projektu i porty (domyślnie 18000/18001/15432), żeby nie kolidować z lokalnym
# `docker compose up` ani z wdrożeniem na tym samym hoście. Wymaga: docker compose v2, curl, jq.
set -euo pipefail

PROJECT="${COMPOSE_PROJECT:-zus-smoke}"
export API_PORT="${API_PORT:-18000}" MCP_PORT="${MCP_PORT:-18001}" DB_PORT="${DB_PORT:-15432}"
TIMEOUT_S="${SMOKE_TIMEOUT_S:-240}"
HEALTHY_SERVICES=(db api mcp_servers)

compose() { docker compose -p "$PROJECT" "$@"; }

cleanup() {
  if [ "${KEEP:-0}" != "1" ]; then
    compose down -v --remove-orphans >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

fail() {
  echo "BŁĄD: $1" >&2
  compose ps -a >&2 || true
  compose logs --no-color --tail 80 >&2 || true
  exit 1
}

docker compose version >/dev/null 2>&1 || fail "brak 'docker compose' (wtyczka v2)"
for tool in curl jq; do
  command -v "$tool" >/dev/null || fail "brak narzędzia: $tool"
done

echo "> docker compose up --build (projekt $PROJECT)"
compose up -d --build

deadline=$((SECONDS + TIMEOUT_S))
for service in "${HEALTHY_SERVICES[@]}"; do
  while true; do
    container="$(compose ps -q "$service")"
    status="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}brak{{end}}' "$container" 2>/dev/null || echo brak)"
    [ "$status" = "healthy" ] && break
    [ "$SECONDS" -ge "$deadline" ] && fail "usługa $service nie jest zdrowa (stan: $status)"
    sleep 3
  done
  echo "  $service: healthy"
done

migrate="$(compose ps -a -q migrate)"
[ "$(docker inspect -f '{{.State.ExitCode}}' "$migrate")" = "0" ] || fail "migracje (migrate) zakończone błędem"
echo "  migrate: zakończone (kod 0)"

curl -fsS "http://localhost:${API_PORT}/health" | jq -e '.status == "ok" and .database == "ok"' >/dev/null \
  || fail "api /health"
curl -fsS "http://localhost:${MCP_PORT}/health" | jq -e '.status == "ok" and (.servers | length) >= 9' >/dev/null \
  || fail "mcp_servers /health"
echo "  /health: api i mcp_servers OK"

# Poziom 1 bez AI: logowanie persony T01 i karta z silnika.
token="$(curl -fsS -X POST "http://localhost:${API_PORT}/auth/mobywatel" \
  -H 'Content-Type: application/json' -d '{"userRef":"persona-t01"}' | jq -r '.token')"
[ -n "$token" ] && [ "$token" != "null" ] || fail "logowanie persony T01"
curl -fsS -X POST "http://localhost:${API_PORT}/answers" \
  -H "Authorization: Bearer ${token}" -H 'Content-Type: application/json' \
  -d '{"intentId":"B.01_wysokosc_macierzynskiego"}' \
  | jq -e '.kind == "CARD" and .card.verdict == "YES" and .card.calculation != null' >/dev/null \
  || fail "POST /answers (B.01 dla T01)"
echo "  poziom 1: karta B.01 dla T01 OK"

echo "docker compose up: wszystkie usługi zdrowe."
