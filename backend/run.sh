#!/usr/bin/env bash
# Start the TariffTriage backend (FastAPI + Uvicorn).
# From repo root: ./backend/run.sh   OR   cd backend && ./run.sh
set -e
cd "$(dirname "$0")"
if [ ! -f .env ] && [ -f .env.example ]; then
  echo "Note: Copy .env.example to .env and set GEMINI_API_KEY for full agent support."
fi
exec python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
