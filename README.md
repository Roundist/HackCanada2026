# TariffTriage — Trade War Survival Platform for Canadian Businesses

> A multi-agent AI war room that helps Canadian small businesses survive the US-Canada trade war.

Built for **HackCanada 2026**.

---

## What It Does

A business owner fills out a form about their products and supply chain. Five specialized AI agents then collaboratively analyze tariff exposure, calculate financial impact, scout alternative suppliers, monitor live geopolitical developments, and generate a personalized **Trade War Survival Plan** — all visible in real-time on screen as a "war room" experience.

---

## The Problem

The 2026 US-Canada trade war has imposed 25–35% tariffs on steel, lumber, automotive parts, packaging, chemicals, and more. Existing tools are macro-level dashboards built for economists — not the small business owner in Kitchener who needs to answer:

1. Which of my US-sourced inputs just became 25% more expensive?
2. Can my margins absorb the hit, or am I now unprofitable on certain product lines?
3. Where can I source the same materials from Canadian or non-US suppliers?
4. What specific actions should I take in the next 30/60/90 days?

---

## How It Works

```
Step 1: DESCRIBE          Step 2: WATCH              Step 3: ACT
+------------------+      +--------------------+     +------------------+
| User fills form |  ->  | War room activates |  -> | Survival plan    |
| business in      |      | 5 agents work live |     | with specific    |
| plain English    |      | on screen          |     | actions + PDF    |
+------------------+      +--------------------+     +------------------+
```

### The 5 Agents

| Agent | Role | Color |
|-------|------|-------|
| Supply Chain Analyst | Maps supply chain, identifies US imports, classifies HS codes via RAG | Blue |
| Tariff Calculator | Calculates dollar impact per input and product line, runs scenarios | Red |
| Supplier Scout | Finds Canadian and non-US alternative suppliers | Green |
| Geopolitical Analyst | Pulls last 24h trade news, assesses escalation risk, flags urgent actions | Orange |
| Strategy Architect | Synthesizes everything into an actionable survival plan | Purple |

Agents run in dependency order with shared memory (Backboard.io). Agent 1 starts immediately; Agents 2 and 4 run in parallel after Agent 1 completes; Agent 3 follows; Agent 5 synthesizes all outputs into the final plan.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS (dark theme) |
| Backend | FastAPI (Python 3.11+) |
| LLM | Gemini 2.0 Flash API |
| Agent Orchestration | Backboard.io SDK |
| Tariff Data | CBSA tariff schedule CSV (~12K HS codes) via pandas |
| HS Code Classification | RAG — ChromaDB + Gemini `text-embedding-004` embeddings |
| Live News | Google News RSS + NewsAPI (last 24h trade headlines) |
| PDF Generation | WeasyPrint |
| Real-time Comms | WebSocket (FastAPI native) |

---

## Key Features

- **Real-time war room UI** — watch 5 agents collaborate live with typing effects and status feeds
- **RAG-based HS code classification** — semantic search over 12K CBSA tariff codes; never hallucinates codes that don't exist
- **Interactive Embedding Explorer** — 2D visualization of the embedding space showing *why* the AI picked each HS code; users can override classifications and see live tariff recalculation
- **Live geopolitical intelligence** — Agent 4 fetches today's actual trade headlines and adjusts risk levels per industry/material in real-time; every demo is different
- **Tariff Simulator** — interactive slider from 0–50% showing live impact on margins and profitability as you drag
- **PDF export** — branded 9-page Trade War Survival Plan report
- **3 demo profiles** — Kitchener Furniture Manufacturer, Toronto Food Packaging Co., Vancouver Auto Parts Distributor

---

## Project Structure

```
HackCanada2026/
├── backend/
│   ├── main.py                    # FastAPI app, CORS, lifespan, routers
│   ├── requirements.txt
│   ├── .env
│   ├── database/
│   │   ├── tariff_data.csv        # CBSA tariff schedule (~12K rows)
│   │   ├── supplier_seed.json     # Pre-researched Canadian suppliers
│   │   └── demo_profiles.json     # 3 pre-built business profiles
│   ├── api/
│   │   ├── analyze.py             # POST /api/analyze
│   │   ├── tariff.py              # GET /api/tariff/{hs_code}
│   │   └── websocket.py           # WS /ws/warroom handler
│   ├── agents/
│   │   ├── base_agent.py
│   │   ├── supply_chain_agent.py
│   │   ├── tariff_agent.py
│   │   ├── supplier_agent.py
│   │   ├── geopolitical_agent.py
│   │   ├── strategy_agent.py
│   │   └── orchestrator.py
│   └── services/
│       ├── gemini_client.py
│       ├── tariff_lookup.py
│       ├── hs_classifier.py       # RAG pipeline: embed → ChromaDB → Gemini pick
│       ├── hs_vector_store.py     # ChromaDB index for HS codes
│       ├── news_fetcher.py        # Live news ingestion
│       └── pdf_generator.py
└── frontend/
    └── src/
        └── components/
            ├── WarRoom.tsx
            ├── BusinessInput.tsx
            ├── AgentFeed.tsx
            ├── AgentGrid.tsx
            ├── SurvivalPlan.tsx
            ├── TariffSimulator.tsx
            ├── TariffChart.tsx
            ├── EmbeddingExplorer.tsx
            ├── PdfExport.tsx
            └── DemoProfiles.tsx
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- API keys: Gemini API, Backboard.io, NewsAPI (optional)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env with:
# GEMINI_API_KEY=...
# BACKBOARD_API_KEY=...
# NEWSAPI_KEY=...  (optional)

uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/analyze` | Start a new business analysis, returns `session_id` |
| `WS` | `/ws/warroom/{session_id}` | Live agent activity stream |
| `GET` | `/api/session/{id}/plan` | Retrieve completed survival plan |
| `GET` | `/api/session/{id}/pdf` | Download survival plan as PDF |
| `GET` | `/api/tariff/{hs_code}` | Look up a specific HS code tariff rate |
| `POST` | `/api/session/{id}/reclassify` | Override an HS code classification |
| `GET` | `/api/session/{id}/embedding-explorer/{input}` | 2D embedding space data for visualization |
| `GET` | `/api/demo-profiles` | List available demo business profiles |
| `GET` | `/health` | Service health check |

---
