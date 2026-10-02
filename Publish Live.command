#!/bin/zsh

ROOT="$(cd "$(dirname "$0")" && pwd)"

"$ROOT/scripts/publish-live.sh"
# zsh reserves `status` as a read-only alias of $?, so it cannot be assigned.
publish_status=$?

echo
if [ "$publish_status" -eq 0 ]; then
  echo "Publishing finished successfully. The phone update is ready."
else
  echo "Publishing stopped with an error. Nothing after the failed step was attempted."
fi
echo "Press Return to close this window."
read -r
exit "$publish_status"
