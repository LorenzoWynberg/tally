#!/bin/bash
# trinity: package=tally
# Serves the repo root as static files, exactly as GitHub Pages serves it (no build step).
set -e
cd "$(dirname "$0")/.."
PORT="${PORT:-4321}"
if [ ! -x node_modules/.bin/http-server ]; then
  npm install
fi
echo "Tally running at http://127.0.0.1:${PORT}"
exec node_modules/.bin/http-server . -p "${PORT}" -a 127.0.0.1 -c-1
