#!/bin/sh
set -eu

alembic upgrade head
python -m scripts.seed_admin

if [ "${ENVIRONMENT:-production}" = "dev" ]; then
  exec uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
fi

exec uvicorn app.main:app --workers 4 --host 0.0.0.0 --port 8000
