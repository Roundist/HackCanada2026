from __future__ import annotations

import sys
import time
from collections import defaultdict
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

load_dotenv()  # backend/.env
load_dotenv(Path(__file__).resolve().parent.parent / ".env")  # project root .env

# Ensure backend package is on the path
sys.path.insert(0, str(Path(__file__).parent))

from api.analyze import router as analyze_router
from api.tariff import router as tariff_router
from api.websocket import connect, disconnect
from services.tariff_lookup import load as load_tariff_db


# ---------------------------------------------------------------------------
# In-memory rate limiter (per-IP, sliding window)
# ---------------------------------------------------------------------------

# path prefix -> (max_requests, window_seconds)
_RATE_LIMITS: dict[str, tuple[int, int]] = {
    "/api/analyze": (12, 60),      # 12 analyses per minute per IP
    "/api/search": (30, 60),       # 30 searches per minute
    "/api/tariff": (60, 60),       # 60 lookups per minute
    "/api/session": (20, 60),      # 20 session requests per minute
}
_DEFAULT_LIMIT = (120, 60)         # everything else: 120 req/min

# IP -> path_prefix -> list of timestamps
_request_log: dict[str, dict[str, list[float]]] = defaultdict(lambda: defaultdict(list))


def _check_rate_limit(ip: str, path: str) -> tuple[bool, int]:
    """Return (allowed, retry_after_seconds). Prunes expired entries."""
    limit, window = _DEFAULT_LIMIT
    for prefix, (l, w) in _RATE_LIMITS.items():
        if path.startswith(prefix):
            limit, window = l, w
            break

    now = time.time()
    bucket = _request_log[ip][path.split("/")[2] if len(path.split("/")) > 2 else path]
    # Prune old entries
    bucket[:] = [t for t in bucket if now - t < window]

    if len(bucket) >= limit:
        oldest = bucket[0]
        retry_after = int(window - (now - oldest)) + 1
        return False, retry_after

    bucket.append(now)
    return True, 0


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: load tariff DB + build vector index
    print("Loading tariff database...")
    load_tariff_db()
    print("Tariff database loaded.")

    # Initialize Backboard.io
    from services.backboard_client import init_backboard
    backboard_ok = await init_backboard()
    print(f"Backboard.io: {'connected' if backboard_ok else 'fallback mode (no API key)'}")

    # Build ChromaDB vector index (skip if CSV doesn't exist yet)
    try:
        from services.tariff_lookup import get_dataframe
        from services.hs_vector_store import build_index

        df = get_dataframe()
        print(f"Building HS code vector index ({len(df)} codes)...")
        await build_index(df)
        print("Vector index built.")
    except FileNotFoundError:
        print("Warning: tariff_data.csv not found. Vector store not initialized.")
    except Exception as e:
        print(f"Warning: Could not build vector index: {e}. RAG will use text-search fallback at runtime.")

    yield


app = FastAPI(
    title="TariffTriage API",
    description="Multi-agent trade war survival platform for Canadian businesses",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Per-IP rate limiting for API endpoints."""
    path = request.url.path
    if path.startswith("/api/"):
        ip = request.client.host if request.client else "unknown"
        # Local dev traffic should not be throttled during live demos.
        if ip in {"127.0.0.1", "::1", "localhost"}:
            return await call_next(request)
        allowed, retry_after = _check_rate_limit(ip, path)
        if not allowed:
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Please try again later."},
                headers={"Retry-After": str(retry_after)},
            )
    return await call_next(request)


app.include_router(analyze_router)
app.include_router(tariff_router)


@app.websocket("/ws/warroom/{session_id}")
async def warroom_ws(ws: WebSocket, session_id: str):
    await connect(session_id, ws)
    try:
        while True:
            await ws.receive_text()  # keep connection alive
    except WebSocketDisconnect:
        disconnect(session_id, ws)


@app.get("/health")
async def health():
    import os
    from services.tariff_lookup import get_dataframe
    from services.hs_vector_store import _collection

    try:
        df = get_dataframe()
        tariff_rows = len(df)
        tariff_loaded = True
    except Exception:
        tariff_rows = 0
        tariff_loaded = False

    from services.backboard_client import is_connected as backboard_connected

    gemini_set = bool(os.getenv("GEMINI_API_KEY", "").strip())
    out = {
        "status": "healthy",
        "tariff_db_loaded": tariff_loaded,
        "tariff_db_rows": tariff_rows,
        "vector_store_ready": _collection is not None,
        "gemini_api_key_set": gemini_set,
        "backboard_connected": backboard_connected(),
    }
    if not gemini_set:
        out["gemini_hint"] = "Set GEMINI_API_KEY in .env (repo root) or backend/.env. Get a key: https://aistudio.google.com/app/apikey"
    return out
