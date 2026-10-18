#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
if [ ! -f "site/index.html" ]; then
  echo "ERROR: No se encuentra site/index.html." >&2
  exit 1
fi
npm run serve
