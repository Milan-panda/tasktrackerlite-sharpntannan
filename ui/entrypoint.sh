#!/bin/sh
set -eu

if [ "${ENVIRONMENT:-production}" = "dev" ]; then
  exec npm run dev --workspace=web -- --hostname 0.0.0.0
fi

exec npm run start --workspace=web -- --hostname 0.0.0.0
