#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
open 'https://learn-the-guitar.web.app/'
open 'https://github.com/georgetbarber/guitar-dashboard/tree/main'
printf 'Opened the live Guitar Dashboard and GitHub main.\n'
printf 'Run Check Status.command to see the latest deployment result.\n'
if [ -t 0 ]; then read -r -p 'Press Return to close. ' _; fi
