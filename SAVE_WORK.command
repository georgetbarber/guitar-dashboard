#!/bin/bash

ROOT="$(cd "$(dirname "$0")" && pwd)"
"$ROOT/scripts/save-work.sh"
save_status=$?

echo
echo "Press Return to close this window."
read -r
exit "$save_status"
