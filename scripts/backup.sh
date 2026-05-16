#!/usr/bin/env sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT"

DATA_DIR_VALUE="./.data"
if [ -f .env ]; then
  CONFIGURED_DATA_DIR="$(sed -n 's/^DATA_DIR=//p' .env | tail -n 1)"
  if [ -n "$CONFIGURED_DATA_DIR" ]; then
    DATA_DIR_VALUE="$CONFIGURED_DATA_DIR"
  fi
fi

if [ ! -d "$DATA_DIR_VALUE" ]; then
  echo "Data directory does not exist: $DATA_DIR_VALUE"
  exit 1
fi

mkdir -p backups
STAMP="$(date +%Y%m%d-%H%M%S)"
ARCHIVE="backups/iracing-race-radar-data-$STAMP.tgz"

tar -C "$DATA_DIR_VALUE" -czf "$ARCHIVE" .

echo "Backup created: $ARCHIVE"
