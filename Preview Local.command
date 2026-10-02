#!/bin/bash
set -e
cd "$(dirname "$0")/apps/current"
exec ./start.command
