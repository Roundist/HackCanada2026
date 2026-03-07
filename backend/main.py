from __future__ import annotations

import sys
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

# Ensure backend package is on the path
sys.path.insert(0, str(Path(__file__).parent))

from api.analyze import router as analyze_router
from api.tariff import router as tariff_router
from api.websocket import connect, disconnect
from services.tariff_lookup import load as load_tariff_db


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
        print(f"Warning: Could not build vector index: {e}")

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

    return {
        "status": "healthy",
        "tariff_db_loaded": tariff_loaded,
        "tariff_db_rows": tariff_rows,
        "vector_store_ready": _collection is not None,
        "gemini_api_key_set": bool(os.getenv("GEMINI_API_KEY", "").strip()),
        "backboard_connected": backboard_connected(),
    }
