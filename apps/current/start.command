#!/bin/bash
set -e
cd "$(dirname "$0")"

if ! command -v npm >/dev/null 2>&1; then
  echo "Node.js 22.22.2 or newer in the Node 22 line and npm are required."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Installing current app dependencies..."
  npm install
fi

exec npm run dev -- --host 127.0.0.1 --open
