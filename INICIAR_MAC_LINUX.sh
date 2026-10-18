#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
if [ ! -f "site/index.html" ]; then
  echo "ERROR: No se encuentra site/index.html." >&2
  exit 1
fi
if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Instala Node.js antes de iniciar Plegar Pro." >&2
  exit 1
fi
npm run serve &
server_pid=$!
cleanup() { kill "$server_pid" 2>/dev/null || true; }
trap cleanup INT TERM EXIT
attempt=0
until curl -fsS http://127.0.0.1:4186/ >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 30 ]; then
    echo "ERROR: El servidor no respondio en 30 segundos." >&2
    exit 1
  fi
  sleep 1
done
if command -v open >/dev/null 2>&1; then
  open http://127.0.0.1:4186/
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open http://127.0.0.1:4186/
else
  echo "Plegar Pro esta disponible en http://127.0.0.1:4186/"
fi
wait "$server_pid"
