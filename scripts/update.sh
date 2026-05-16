#!/usr/bin/env sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT"

if [ -d .git ]; then
  git pull --ff-only
fi

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

DATA_DIR_VALUE="$(sed -n 's/^DATA_DIR=//p' .env | tail -n 1)"
if [ -z "$DATA_DIR_VALUE" ]; then
  DATA_DIR_VALUE="./.data"
fi

mkdir -p "$DATA_DIR_VALUE"

docker compose up -d --build
docker compose ps
