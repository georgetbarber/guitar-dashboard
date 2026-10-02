#!/bin/bash

ROOT="$(cd "$(dirname "$0")" && pwd)"
"$ROOT/scripts/open-live.sh"
open_status=$?

echo
echo "Press Return to close this window."
read -r
exit "$open_status"
