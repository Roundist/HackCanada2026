# Product Requirements Document: TariffTriage
## Multi-Agent Trade War Survival Platform for Canadian Businesses

**Version:** 1.0
**Date:** March 6, 2026
**Status:** Pre-Implementation

---

## 1. Executive Summary

### 1.1 Project Overview
TariffTriage is a multi-agent AI war room that helps Canadian small businesses survive the US-Canada trade war. A business owner describes their products and supply chain in plain English. Five specialized AI agents then collaboratively analyze tariff exposure, calculate financial impact, scout alternative suppliers, monitor live geopolitical developments, and generate a personalized Trade War Survival Plan — all visible in real-time on screen as a "war room" experience.

### 1.2 Project Goals
1. Build a multi-agent backend using Backboard.io for orchestration with shared memory
2. Implement 5 specialized agents powered by Gemini API with distinct roles and visible collaboration (including a live news-driven Geopolitical Analyst)
3. Use RAG (Retrieval Augmented Generation) with ChromaDB + Gemini embeddings for accurate HS code classification from natural language
4. Create a real-time "war room" frontend showing live agent activity feeds via WebSocket
5. Generate actionable Trade War Survival Plans with PDF export
6. Seed with verified CBSA tariff data and pre-validated demo business profiles
7. Target sponsor prizes: Backboard.io ($500), Best Use of Gemini API, Google Antigravity, Vultr

### 1.3 Why This Wins
- **Timely**: The US-Canada trade war (25-35% tariffs) is the #1 economic story in Canada in 2026
- **Personal**: No existing tool helps a *specific* small business owner understand *their* exposure
- **Demo-able**: 5 agents visibly collaborating on screen, a Geopolitical Analyst pulling this morning's actual headlines and adjusting risk levels live, RAG classification cards appearing in real-time, an interactive embedding space explorer that shows *why* the AI picked each HS code, then an interactive tariff slider that makes the impact viscerally real
- **Live**: The Geopolitical Analyst uses real news from the last 24 hours — every demo is different because the world changes daily. Judges see today's actual headlines influencing the analysis.
- **Sponsor-aligned**: Backboard.io multi-agent orchestration is the textbook flagship use case

---

## 2. Problem Statement

The 2026 US-Canada trade war has imposed 25-35% tariffs affecting steel, lumber, automotive parts, packaging, chemicals, and more. Existing tariff tools are:
- **Macro-level dashboards** built for economists and policy analysts (StatsCan, CBSA lookup)
- **HS code lookup tools** that return raw tariff rates without business context
- **News articles** that discuss impacts in aggregate, not per-business

**No tool exists** for the small business owner in Kitchener who needs to answer:
1. Which of my US-sourced inputs just became 25% more expensive?
2. Can my margins absorb the hit, or am I now unprofitable on certain product lines?
3. Where can I source the same materials from Canadian or non-US suppliers?
4. What specific actions should I take in the next 30/60/90 days?

---

## 3. Target Users

| User | Pain Point | What They Get |
|------|-----------|---------------|
| Canadian SMB owner (1-500 employees) | Doesn't know their tariff exposure | Personalized dollar-amount impact analysis |
| Procurement manager | Needs to find alternative suppliers fast | Ranked list of Canadian/non-US alternatives |
| Business consultant | Advising multiple clients on trade war | Reusable tool to generate client reports |

---

## 4. Core User Flow

```
Step 1: DESCRIBE          Step 2: WATCH              Step 3: ACT
+------------------+      +--------------------+     +------------------+
| User types their |  ->  | War room activates |  -> | Survival plan    |
| business in      |      | 4 agents work live |     | with specific    |
| plain English    |      | on screen          |     | actions + PDF    |
+------------------+      +--------------------+     +------------------+
```

**Detailed Flow:**
1. **Business Profile Input**: Owner describes their business, products, and supply chain in natural language
   - Example: "I run a furniture company in Kitchener. We import hardwood lumber and steel fasteners from the US, upholstery fabric from China, and sell finished furniture across Canada and the US. Annual revenue is about $2M."
2. **War Room Activation**: The multi-agent system launches visibly on screen. Each agent has a named role, avatar, accent color, and live activity feed.
3. **Live Collaboration**: Agents work in dependency order, sharing findings via Backboard.io shared memory. The user watches the analysis unfold in real-time with typing effects.
4. **Results & Plan**: A comprehensive Trade War Survival Plan is generated with specific, actionable recommendations organized in sections.
5. **Export**: The plan is downloadable as a branded PDF report.

---

## 5. Technical Architecture

### 5.1 System Diagram

```
+-------------------------------------------------------------------+
|                      React Frontend (Port 5173)                    |
|  - War Room UI with agent activity feeds                          |
|  - Business input panel with example profiles                     |
|  - Survival plan display with charts                              |
|  - PDF export button                                              |
+-----------------------------+-------------------------------------+
                              | REST API + WebSocket
                              v
+-------------------------------------------------------------------+
|                    FastAPI Backend (Port 8000)                      |
|  +------------------+  +------------------+  +-----------------+  |
|  | POST /api/analyze|  | WS /ws/warroom   |  | GET /api/tariff |  |
|  | (start analysis) |  | (live updates)   |  | (tariff lookup) |  |
|  +--------+---------+  +--------+---------+  +--------+--------+  |
|           |                      |                     |           |
|  +--------v--------------------------------------------|--------+  |
|  |              Backboard.io Orchestrator                       |  |
|  |  Shared Memory Store (agents read/write structured objects)  |  |
|  |                                                              |  |
|  |  Agent 1: Supply Chain Analyst --> supply_chain_map          |  |
|  |  Agent 2: Tariff Calculator -----> tariff_impact             |  |
|  |  Agent 3: Supplier Scout --------> alternative_suppliers     |  |
|  |  Agent 4: Geopolitical Analyst --> geopolitical_context      |  |
|  |  Agent 5: Strategy Architect ----> survival_plan             |  |
|  +-------------------------------------------------------------+  |
|           |                                                        |
|  +--------v---------+  +------------------+  +------------------+ |
|  | ~12K HS codes     |  | Gemini Embeddings|  |                  | |
|  +-------------------+  +------------------+  +------------------+ |
|  +-------------------+                                              |
|  | News API          |  (Google News RSS / NewsAPI / web scraping)  |
|  | (Last 24h trade   |  Feeds Geopolitical Analyst agent            |
|  |  headlines)       |                                              |
|  +-------------------+                                              |
|                         +------------------+                       |
|                         | PDF Generator    |                       |
|                         | (WeasyPrint)     |                       |
|                         +------------------+                       |
+-------------------------------------------------------------------+
```

### 5.2 Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React 18 + TypeScript + Vite | Fast dev server, type safety, component-based war room UI |
| Styling | Tailwind CSS | Dark theme utility classes, rapid prototyping |
| Backend | FastAPI (Python 3.11+) | Async-native, WebSocket support, fast to build |
| LLM | Gemini 2.0 Flash API | Sponsor prize target, fast inference, structured output |
| Agent Orchestration | Backboard.io SDK (Python) | Multi-agent shared memory, sponsor prize target |
| Tariff Data | Static CSV + pandas | CBSA tariff schedule, ~12K rows, fits in memory |
| Vector Store | ChromaDB (in-memory) | Semantic search over HS code descriptions for RAG-based classification |
| Embeddings | Gemini `text-embedding-004` | Embed HS code descriptions + user product queries for retrieval |
| PDF Generation | WeasyPrint | HTML-to-PDF, supports CSS styling for branded reports |
| Real-time Comms | WebSocket (FastAPI native) | Stream agent activity to frontend |
| Charts | Chart.js (frontend) | Bar charts for tariff impact visualization |
| Live News Feed | Google News RSS + NewsAPI (fallback) | Last 24h trade war headlines, parsed and filtered by industry relevance |
| Hosting | Vultr Cloud Compute | Sponsor prize target, simple VM deployment |

### 5.3 Why NOT PySpark / Pinecone / Heavy Infrastructure

- The tariff dataset is ~12,000 HS codes — fits in a pandas DataFrame in milliseconds
- We process one business at a time, not batch analytics across millions of records
- pandas handles all needed operations (lookups, joins, aggregations) trivially
- ChromaDB runs fully in-memory with zero external services — perfect for 12K vectors at hackathon scale
- Pinecone/Weaviate/Qdrant would add cloud dependencies, API keys, and setup time for no benefit at this scale
- Hackathon time: spinning up Spark/Synapse/managed vector DBs wastes hours on infrastructure for zero benefit

### 5.4 Project Structure

```
tariff-triage/
+-- backend/
|   +-- main.py                      # FastAPI app, CORS, lifespan, routers
|   +-- requirements.txt             # Python dependencies
|   +-- .env                         # Environment variables
|   +-- database/
|   |   +-- tariff_data.csv          # CBSA tariff schedule (~12K rows)
|   |   +-- supplier_seed.json       # Pre-researched Canadian suppliers
|   |   +-- demo_profiles.json       # 3 pre-built business profiles
|   +-- api/
|   |   +-- analyze.py               # POST /api/analyze endpoint
|   |   +-- tariff.py                # GET /api/tariff/{hs_code} endpoint
|   |   +-- websocket.py             # WS /ws/warroom handler
|   +-- agents/
|   |   +-- base_agent.py            # Base agent class with Backboard.io integration
|   |   +-- supply_chain_agent.py    # Agent 1: Supply Chain Analyst
|   |   +-- tariff_agent.py          # Agent 2: Tariff Calculator
|   |   +-- supplier_agent.py        # Agent 3: Supplier Scout
|   |   +-- geopolitical_agent.py    # Agent 4: Geopolitical Analyst
|   |   +-- strategy_agent.py        # Agent 5: Strategy Architect
|   |   +-- orchestrator.py          # Agent coordination + dependency management
|   +-- services/
|   |   +-- gemini_client.py         # Gemini API wrapper with retry/backoff
|   |   +-- tariff_lookup.py         # pandas-based tariff database queries
|   |   +-- hs_classifier.py         # RAG-based natural language -> HS code mapping (ChromaDB + Gemini embeddings)
|   |   +-- hs_vector_store.py      # ChromaDB vector store: embed & index HS code descriptions at startup
|   |   +-- embedding_explorer.py   # 2D projection + neighbor lookup for interactive RAG explainer
|   |   +-- news_fetcher.py        # Live news ingestion: Google News RSS / NewsAPI for last 24h trade headlines
|   |   +-- pdf_generator.py         # WeasyPrint PDF report generation
|   +-- schemas/
|   |   +-- requests.py              # Pydantic request models
|   |   +-- responses.py             # Pydantic response models
|   |   +-- shared_memory.py         # Shared memory object schemas
|   +-- templates/
|   |   +-- report.html              # Jinja2 PDF template
|   +-- tests/
|       +-- test_agents.py           # Agent unit tests
|       +-- test_tariff_lookup.py    # Tariff database tests
|       +-- test_hs_classifier.py    # HS code classification tests
|       +-- test_api.py              # API endpoint integration tests
|       +-- test_orchestrator.py     # Orchestration flow tests
+-- frontend/
|   +-- package.json
|   +-- tsconfig.json
|   +-- vite.config.ts
|   +-- tailwind.config.js
|   +-- index.html
|   +-- src/
|       +-- App.tsx                   # Main app with layout
|       +-- main.tsx                  # React entry point
|       +-- api/
|       |   +-- client.ts            # Backend API + WebSocket client
|       +-- components/
|       |   +-- WarRoom.tsx           # Main war room container
|       |   +-- BusinessInput.tsx     # Left sidebar input panel
|       |   +-- AgentFeed.tsx         # Single agent activity feed card
|       |   +-- AgentGrid.tsx         # Grid of 4 agent feeds
|       |   +-- SurvivalPlan.tsx      # Results panel with plan sections
|       |   +-- TariffSimulator.tsx   # Interactive what-if tariff rate slider with live recalculation
|       |   +-- TariffChart.tsx       # Bar chart for tariff impact (controlled by simulator)
|       |   +-- PdfExport.tsx         # PDF download button
|       |   +-- EmbeddingExplorer.tsx # Interactive 2D embedding space visualization with correction UI
|       |   +-- DemoProfiles.tsx      # Quick-fill example business buttons
|       +-- hooks/
|       |   +-- useWebSocket.ts       # WebSocket connection + message handling
|       |   +-- useAgentState.ts      # Agent status state management
|       +-- types/
|       |   +-- index.ts              # TypeScript type definitions
|       +-- styles/
|           +-- globals.css           # Tailwind imports + custom dark theme
+-- README.md
+-- PRD.md
```

---

## 6. Multi-Agent Architecture

### 6.1 Agent Overview

| Agent | Role | Accent Color | Dependencies | Shared Memory Output |
|-------|------|-------------|-------------|---------------------|
| Supply Chain Analyst | Maps supply chain, identifies US imports, classifies HS codes | Blue `#3B82F6` | None (starts immediately) | `supply_chain_map` |
| Tariff Calculator | Calculates $ impact per input and product line, runs scenarios | Red `#EF4444` | `supply_chain_map` | `tariff_impact` |
| Supplier Scout | Finds Canadian/non-US alternative suppliers | Green `#10B981` | `supply_chain_map` + `tariff_impact` | `alternative_suppliers` |
| Geopolitical Analyst | Pulls last 24h trade news, assesses escalation risk, adjusts threat levels per industry/material | Orange `#F59E0B` | `supply_chain_map` (starts in parallel with Agent 2) | `geopolitical_context` |
| Strategy Architect | Synthesizes everything into actionable survival plan | Purple `#8B5CF6` | All 4 agents complete | `survival_plan` |

### 6.2 Orchestration Flow

```
Time -->

Agent 1: [=======]  supply_chain_map
                  \
                   +---> tariff_rates (RAG: embed → ChromaDB search → Gemini classify → pandas lookup)
                  \        \
Agent 2:           [=====]  tariff_impact
                  \                   \
Agent 4:           [=======]  geopolitical_context (live news fetch + analysis)
                          \           \
Agent 3:           [========]  alternative_suppliers
                                      \
Agent 5:                               [======]  survival_plan

WebSocket:  [status updates streaming to frontend throughout]
            [breaking news alerts from Agent 4 appear as they're found]
```

**Dependency Rules (enforced by orchestrator.py):**
1. Agent 1 starts immediately when user submits input
2. Backend RAG pipeline runs as soon as Agent 1 publishes `supply_chain_map` (embeds each input description → ChromaDB semantic search → Gemini picks best HS code → pandas tariff rate lookup)
3. Agent 2 starts when both `supply_chain_map` AND `tariff_rates` are available
4. Agent 4 (Geopolitical Analyst) starts when `supply_chain_map` is available (runs in parallel with Agent 2 — it needs to know the business's industries/materials to search relevant news)
5. Agent 3 starts when both `supply_chain_map` AND `tariff_impact` are available
6. Agent 5 starts when ALL four agent outputs are in shared memory (including `geopolitical_context`)

### 6.3 Shared Memory Objects

All agents read/write to Backboard.io shared memory. Each key stores a structured JSON object.

**Key: `supply_chain_map`** (written by Agent 1)
```json
{
  "business_name": "Kitchener Custom Furniture Co.",
  "industry": "Furniture Manufacturing",
  "annual_revenue_estimate": 2000000,
  "inputs": [
    {
      "name": "Hardwood Lumber (Oak, Maple, Cherry)",
      "description": "Raw lumber for table tops, chair frames, cabinet panels",
      "country_of_origin": "US",
      "hs_code": "440799",
      "estimated_annual_spend": 320000,
      "is_us_sourced": true,
      "criticality": "high"
    },
    {
      "name": "Steel Fasteners",
      "description": "Screws, bolts, brackets for furniture assembly",
      "country_of_origin": "US",
      "hs_code": "731815",
      "estimated_annual_spend": 45000,
      "is_us_sourced": true,
      "criticality": "medium"
    },
    {
      "name": "Upholstery Fabric",
      "description": "Woven fabric for chair seats and cushions",
      "country_of_origin": "China",
      "hs_code": null,
      "estimated_annual_spend": 80000,
      "is_us_sourced": false,
      "criticality": "medium"
    }
  ],
  "products": [
    {
      "name": "Custom Dining Tables",
      "inputs_used": ["Hardwood Lumber (Oak, Maple, Cherry)", "Steel Fasteners"],
      "estimated_annual_revenue": 800000,
      "primary_market": "Both"
    }
  ]
}
```

**Key: `tariff_impact`** (written by Agent 2)
```json
{
  "total_tariff_exposure": 180240,
  "total_margin_erosion_pct": 12.1,
  "risk_level": "high",
  "input_impacts": [
    {
      "input_name": "Hardwood Lumber (Oak, Maple, Cherry)",
      "hs_code": "440799",
      "current_tariff_rate": 25.0,
      "annual_spend": 320000,
      "annual_tariff_cost": 80000,
      "pct_of_total_exposure": 44.4
    }
  ],
  "product_impacts": [
    {
      "product_name": "Custom Dining Tables",
      "current_margin_pct": 15.0,
      "margin_after_tariff_pct": 5.2,
      "margin_erosion_pct": 9.8,
      "break_even_price_increase_pct": 11.2,
      "break_even_tariff_rate_pct": 32.5,
      "is_profitable_after_tariff": true
    }
  ],
  "scenarios": [
    { "tariff_rate_pct": 25, "total_tariff_cost": 180240, "total_margin_erosion_pct": 12.1, "products_unprofitable": 0 },
    { "tariff_rate_pct": 30, "total_tariff_cost": 216288, "total_margin_erosion_pct": 14.5, "products_unprofitable": 1 },
    { "tariff_rate_pct": 35, "total_tariff_cost": 252336, "total_margin_erosion_pct": 16.9, "products_unprofitable": 2 },
    { "tariff_rate_pct": 40, "total_tariff_cost": 288384, "total_margin_erosion_pct": 19.3, "products_unprofitable": 3 }
  ]
}
```

**Key: `alternative_suppliers`** (written by Agent 3)
```json
{
  "alternatives": [
    {
      "for_input": "Hardwood Lumber (Oak, Maple, Cherry)",
      "current_us_cost": 320000,
      "current_us_cost_with_tariff": 400000,
      "canadian_alternatives": [
        {
          "supplier_category": "Eastern Canadian Hardwood Mills",
          "region": "Ontario / Quebec",
          "estimated_cost": 352000,
          "cost_vs_us_pretariff_pct": 10.0,
          "cost_vs_us_posttariff_pct": -12.0,
          "switching_feasibility": "moderate",
          "lead_time_weeks": 4,
          "notes": "Ontario and Quebec produce significant maple, oak, cherry. Slightly higher base cost but no tariff.",
          "directory_to_search": "Canadian Lumbermen's Association"
        }
      ],
      "international_alternatives": [
        {
          "country": "EU (Germany/Romania)",
          "supplier_category": "European Hardwood Exporters",
          "estimated_cost": 368000,
          "notes": "Higher shipping costs but CETA trade agreement provides preferential rates"
        }
      ],
      "recommendation": "Switch to Ontario/Quebec hardwood mills. 10% more expensive than pre-tariff US, but 12% cheaper than post-tariff US."
    }
  ],
  "total_potential_savings": 94000,
  "priority_switches": ["Hardwood Lumber", "Steel Fasteners"]
}
```

**Key: `geopolitical_context`** (written by Agent 4 — Geopolitical Analyst)
```json
{
  "analysis_timestamp": "2026-03-06T14:30:00Z",
  "news_window": "last_24_hours",
  "overall_escalation_risk": "elevated",
  "risk_trend": "worsening",
  "headline_summary": "US Trade Representative announced review of additional 10% tariff on Canadian lumber effective April 1. Canadian government signaled retaliatory measures on US agricultural products.",
  "relevant_articles": [
    {
      "title": "US Considers Additional 10% Lumber Tariff",
      "source": "Reuters",
      "published": "2026-03-06T08:15:00Z",
      "url": "https://...",
      "relevance_to_business": "Direct impact — hardwood lumber is your #1 US-sourced input ($320K/yr). If this passes, your lumber tariff jumps from 25% to 35%.",
      "affected_inputs": ["Hardwood Lumber (Oak, Maple, Cherry)"],
      "affected_hs_codes": ["440799"],
      "sentiment": "negative",
      "tariff_change_signal": {"direction": "increase", "magnitude_estimate_pct": 10, "timeline": "30 days", "probability": "medium"}
    },
    {
      "title": "Canada Retaliates with Tariffs on US Agricultural Imports",
      "source": "Globe and Mail",
      "published": "2026-03-05T18:30:00Z",
      "url": "https://...",
      "relevance_to_business": "Indirect — retaliatory tariffs may escalate the trade war further, increasing risk of broader tariff expansion.",
      "affected_inputs": [],
      "affected_hs_codes": [],
      "sentiment": "negative",
      "tariff_change_signal": {"direction": "escalation", "magnitude_estimate_pct": null, "timeline": "60 days", "probability": "low"}
    }
  ],
  "industry_risk_adjustments": [
    {
      "industry": "Wood & Lumber",
      "base_risk": "high",
      "adjusted_risk": "critical",
      "reason": "Active legislative proposal to increase lumber tariffs by 10%. Multiple credible sources confirm review underway."
    },
    {
      "industry": "Steel & Metals",
      "base_risk": "high",
      "adjusted_risk": "high",
      "reason": "No new developments in last 24h. Existing 25% tariff stable."
    }
  ],
  "actionable_alerts": [
    {
      "urgency": "high",
      "alert": "Lock in lumber purchase contracts NOW at current 25% tariff rate before potential April 1 increase to 35%",
      "source_article": "US Considers Additional 10% Lumber Tariff",
      "deadline": "2026-04-01"
    }
  ],
  "trade_agreement_updates": [],
  "government_program_updates": []
}
```

**Key: `survival_plan`** (written by Agent 5)
```json
{
  "executive_summary": {
    "business_name": "Kitchener Custom Furniture Co.",
    "total_tariff_exposure": 180240,
    "risk_level": "high",
    "headline": "Your business faces $180K in annual tariff costs, eroding 12% of margins",
    "key_finding": "Switching lumber and fastener suppliers to Canadian sources saves $94K/year"
  },
  "priority_actions": [
    {
      "rank": 1,
      "action": "Switch hardwood lumber to Ontario/Quebec mills",
      "description": "Contact Canadian Lumbermen's Association for mill referrals...",
      "estimated_savings": 48000,
      "implementation_effort": "medium",
      "timeline_days": 60,
      "category": "supplier_switch"
    }
  ],
  "pricing_strategy": {
    "recommendation": "hybrid",
    "explanation": "Absorb tariff costs on Canadian-market products, pass through 8% increase on US-bound products",
    "suggested_price_increases": [
      { "product": "Custom Dining Tables (US market)", "increase_pct": 8.0, "rationale": "US customers expect price increases due to trade war" }
    ]
  },
  "market_diversification": {
    "current_us_export_pct": 40,
    "recommendations": ["Increase Canadian market share via partnerships with Canadian furniture retailers", "Explore EU export under CETA"],
    "government_programs": ["Trade Diversification Strategy", "CanExport SMEs", "BDC trade finance"]
  },
  "timeline": {
    "days_30": ["Request quotes from 3 Ontario hardwood mills", "Audit all US-sourced inputs for tariff exposure"],
    "days_60": ["Negotiate trial orders with top Canadian supplier", "Implement 8% price increase on US-bound products"],
    "days_90": ["Complete supplier transition for lumber", "Apply for CanExport grant for EU market entry"]
  },
  "risks": [
    { "risk": "Canadian lumber quality inconsistency", "probability": "medium", "mitigation": "Request samples and run quality tests before committing to bulk orders" }
  ]
}
```

### 6.4 Agent Gemini Prompts

#### Agent 1: Supply Chain Analyst — System Prompt
```
You are a supply chain analyst specializing in Canadian businesses affected by US tariffs.
Given a business description, extract and structure the following:

1. All raw materials, components, and inputs the business uses
2. The country of origin for each input (infer from context or industry norms)
3. For US-sourced inputs, provide a clear product description for each input (used by the RAG pipeline to classify HS codes via semantic search against the CBSA tariff database)
4. Estimate annual spend per input based on the business size and industry benchmarks

Output STRICT JSON. Do not include any text outside the JSON object.
The JSON must match this structure:
- business_name (string)
- industry (string)
- annual_revenue_estimate (number)
- inputs (array of objects with: name, description, country_of_origin, hs_code, estimated_annual_spend, is_us_sourced, criticality)
- products (array of objects with: name, inputs_used, estimated_annual_revenue, primary_market)
```

#### Agent 2: Tariff Calculator — System Prompt
```
You are a tariff impact analyst for Canadian businesses. Given a supply chain map
and tariff rate data, calculate the financial impact of US tariffs on each product line.

IMPORTANT: Use the tariff rates provided to you from our database. Do NOT invent tariff rates.

Calculate:
1. Annual tariff cost per input (spend * tariff_rate)
2. Total tariff exposure across all inputs
3. Margin erosion per product line
4. Break-even analysis (at what price increase does each product become unprofitable?)
5. Escalation scenarios at 25%, 30%, 35%, 40% tariff rates

Output STRICT JSON. Do not include any text outside the JSON object.
The JSON must match this structure:
- total_tariff_exposure (number)
- total_margin_erosion_pct (number)
- risk_level (string: low/medium/high/critical)
- input_impacts (array), product_impacts (array), scenarios (array)
```

**Implementation Note:** Tariff rates come from the RAG pipeline (semantic search → HS classification → pandas lookup), NOT from Gemini directly. The agent receives `tariff_rates` dict from shared memory (populated by the backend RAG pipeline after Agent 1 publishes input descriptions). This ensures HS codes exist in CBSA data and rates are accurate.

#### Agent 3: Supplier Scout — System Prompt
```
You are a procurement specialist helping Canadian businesses find alternative suppliers
to replace US imports affected by tariffs. Given a list of US-sourced inputs ranked by
tariff impact, identify potential Canadian and non-US suppliers.

For each high-impact input, research and suggest:
1. Canadian domestic suppliers (prioritize these)
2. Non-US international alternatives (EU, Asia, Mexico)
3. Estimated cost comparison vs current US source (before and after tariff)
4. Switching feasibility (lead time, quality considerations)

IMPORTANT: Be specific with supplier categories but honest about limitations.
Frame suggestions as "types of suppliers to investigate" with industry associations
and directories to search, rather than claiming specific verified supplier names
unless you are highly confident they exist.

Output STRICT JSON. Do not include any text outside the JSON object.
The JSON must match this structure:
- alternatives (array of objects with: for_input, current_us_cost, current_us_cost_with_tariff, canadian_alternatives, international_alternatives, recommendation)
- total_potential_savings (number)
- priority_switches (array of strings)
```

#### Agent 4: Geopolitical Analyst — System Prompt
```
You are a geopolitical intelligence analyst monitoring the US-Canada trade war in real-time.
You have been given:
1. The business's supply chain map (industries, materials, HS codes)
2. Live news articles from the last 24 hours about US-Canada trade, tariffs, and trade policy

Your job is to:
1. Identify news that DIRECTLY affects this specific business's inputs or industry
2. Assess whether tariff rates are likely to increase, decrease, or remain stable in the next 30/60/90 days
3. Flag any urgent action items (e.g., "lock in contracts before April 1 tariff increase")
4. Adjust risk levels per industry/material based on the latest geopolitical signals
5. Identify any new trade agreements, exemptions, or government programs announced

IMPORTANT:
- Only include news from credible sources (Reuters, Bloomberg, Globe and Mail, CBC, government announcements)
- Be specific about HOW each article affects THIS business, not generic commentary
- If no relevant news exists for a material, say so — don't invent threats
- Distinguish between confirmed policy changes and speculation/proposals
- Include the actual article title, source, and publication date for credibility

Output STRICT JSON. Do not include any text outside the JSON object.
The JSON must match this structure:
- analysis_timestamp (string)
- news_window (string)
- overall_escalation_risk (string: stable/elevated/high/critical)
- risk_trend (string: improving/stable/worsening)
- headline_summary (string — 1-2 sentence summary of the trade landscape today)
- relevant_articles (array of objects with: title, source, published, url, relevance_to_business, affected_inputs, affected_hs_codes, sentiment, tariff_change_signal)
- industry_risk_adjustments (array of objects with: industry, base_risk, adjusted_risk, reason)
- actionable_alerts (array of objects with: urgency, alert, source_article, deadline)
- trade_agreement_updates (array)
- government_program_updates (array)
```

**Implementation Note:** The Geopolitical Analyst fetches live news via a news service (`news_fetcher.py`) before calling Gemini. The news service queries Google News RSS or NewsAPI for trade-related headlines from the last 24 hours, filtered by relevance to the business's industries and materials. Raw articles are passed to Gemini as context — the agent's intelligence is in connecting the news to THIS specific business's exposure.

#### Agent 5: Strategy Architect — System Prompt
```
You are a strategic business consultant creating a Trade War Survival Plan for a
Canadian business affected by US tariffs. You have access to:
1. The business's supply chain map
2. The tariff impact analysis
3. Alternative supplier options
4. Live geopolitical intelligence (last 24h trade news, escalation risk assessment, actionable alerts)

Create a comprehensive, actionable survival plan with specific recommendations.
Be direct, practical, and prioritize by impact and feasibility. This plan should
feel like advice from an expensive consultant, not a generic report.

IMPORTANT: Incorporate the geopolitical context into your recommendations.
If the Geopolitical Analyst has flagged urgent alerts (e.g., imminent tariff increases),
these should be reflected as TOP priority actions with specific deadlines.
Adjust risk assessments based on the escalation trend. Reference specific news
articles when justifying urgency.

Output STRICT JSON. Do not include any text outside the JSON object.
The JSON must match this structure:
- executive_summary (object with: business_name, total_tariff_exposure, risk_level, headline, key_finding)
- priority_actions (array ranked by estimated_savings)
- pricing_strategy (object with: recommendation, explanation, suggested_price_increases)
- market_diversification (object with: current_us_export_pct, recommendations, government_programs)
- timeline (object with: days_30, days_60, days_90 — each an array of strings)
- risks (array of objects with: risk, probability, mitigation)
```

### 6.5 Base Agent Behavior

Each agent must:
- Extend a base agent class that handles Backboard.io shared memory read/write
- Wait for its dependency keys to appear in shared memory before starting
- Emit WebSocket status updates throughout execution (`idle` -> `waiting` -> `working` -> `complete`/`error`)
- Accumulate a message log (list of status messages with timestamps) for the frontend feed
- Call Gemini API with its system prompt + the relevant shared memory data as user message
- Validate Gemini's JSON response against the expected schema
- Write its output to shared memory under its designated key
- Handle errors gracefully (retry once, then emit error status)

---

## 7. Data Sources

### 7.1 Tariff Database

**Source:** Canada Border Services Agency (CBSA) Customs Tariff Schedule
**Format:** CSV loaded into pandas DataFrame at backend startup
**Size:** ~12,000 rows (HS codes at 6-digit level)

**CSV Schema (tariff_data.csv):**

| Column | Type | Description |
|--------|------|-------------|
| hs_code | string | 6-digit Harmonized System code (e.g., "440710") |
| description | string | Product description (e.g., "Coniferous wood, sawn lengthwise") |
| mfn_rate | float | Most Favoured Nation tariff rate (baseline %) |
| us_retaliatory_rate | float | Additional retaliatory tariff on US goods (%) |
| effective_rate | float | mfn_rate + us_retaliatory_rate (total %) |
| category | string | Broad category (e.g., "Wood", "Steel", "Chemicals") |
| effective_date | string | Date this rate took effect |
| notes | string | Special conditions or exemptions |

**Tariff Lookup Service (tariff_lookup.py) Requirements:**
- `lookup(hs_code) -> dict | None` — exact 6-digit match
- `lookup_prefix(hs_prefix) -> list[dict]` — all codes starting with prefix (e.g., "4407")
- `lookup_category(category) -> list[dict]` — all codes in a category
- `get_rate(hs_code) -> float` — returns effective_rate, 0.0 if not found

### 7.1.1 RAG-Based HS Code Classification Pipeline

The HS code classification uses a Retrieval Augmented Generation (RAG) pipeline instead of direct Gemini classification. This improves accuracy for ambiguous product descriptions by grounding the LLM in actual tariff schedule data.

**Indexing (runs once at backend startup, ~5 seconds):**
1. Load `tariff_data.csv` into pandas DataFrame
2. For each row, create a text chunk: `"{hs_code}: {description} (Category: {category})"`
3. Embed all ~12K chunks using Gemini `text-embedding-004` (batch API, 768-dim vectors)
4. Store in ChromaDB in-memory collection with metadata: `hs_code`, `effective_rate`, `category`

**Retrieval (runs per user input):**
1. Agent 1 extracts product input descriptions (e.g., "hardwood lumber for table tops")
2. Each input description is embedded using the same Gemini embedding model
3. ChromaDB similarity search returns top-5 nearest HS code candidates with scores
4. Candidates are passed to Gemini as context for final classification:

```
Given this product description: "Hardwood lumber for table tops and chair frames"

These are the top HS code candidates from our tariff database (ranked by relevance):
1. 440799 - Wood sawn or chipped lengthwise, non-coniferous (score: 0.92)
2. 440710 - Coniferous wood, sawn lengthwise (score: 0.87)
3. 441899 - Builders' joinery and carpentry of wood (score: 0.79)
4. 940360 - Wooden furniture (score: 0.71)
5. 440320 - Wood in the rough, non-coniferous (score: 0.68)

Select the single best HS code match. Return JSON: {"hs_code": "...", "confidence": 0.0-1.0, "reasoning": "..."}
```

**Why RAG over direct classification:**
- Gemini alone might hallucinate HS codes that don't exist in CBSA data
- Semantic search handles fuzzy descriptions ("metal bits for assembly" → "731815: Screws, bolts, nuts")
- Retrieved candidates are guaranteed to exist in our tariff database
- Confidence scores enable the frontend to show classification certainty
- The retrieval step is visible in the war room feed ("Found 5 candidate HS codes, selecting best match...")
- The embedding space is explorable — users can see the vector similarity landscape, understand why one HS code ranked higher than another, and correct misclassifications interactively

**hs_vector_store.py Service Interface:**
- `build_index(df: pd.DataFrame) -> None` — embed and index all HS codes (called at startup)
- `search(query: str, top_k: int = 5) -> list[dict]` — returns `[{hs_code, description, category, effective_rate, score}]`
- `get_neighbors(hs_code: str, top_k: int = 10) -> list[dict]` — returns nearest neighbor HS codes in embedding space for visualization
- `get_embedding(text: str) -> list[float]` — returns raw embedding vector for a query or HS code description
- `get_2d_projection(hs_codes: list[str], query_embedding: list[float]) -> dict` — returns t-SNE/UMAP 2D coordinates for a set of HS codes + the query point, used by the frontend embedding explorer visualization

**hs_classifier.py Service Interface (updated):**
- `classify(product_description: str) -> dict` — calls `hs_vector_store.search()`, then Gemini for final pick. Returns `{hs_code, confidence, reasoning, candidates}`
- `reclassify(product_description: str, user_selected_hs_code: str) -> dict` — user overrides the AI's pick; returns updated impact data. Logs the correction for potential fine-tuning.

### 7.2 Live News Feed

**Service:** `news_fetcher.py`
**Sources (in priority order):**
1. **Google News RSS** — free, no API key, parse RSS feed for "Canada tariff" / "US Canada trade" queries. Primary source.
2. **NewsAPI.org** — free tier (100 req/day), structured JSON, better filtering. Fallback/supplement.
3. **Government RSS feeds** — CBSA announcements, Global Affairs Canada trade notices. For official policy changes.

**Fetching Strategy:**
- On each analysis run, fetch articles from the last 24 hours matching these queries:
  - `"Canada tariff" OR "US Canada trade" OR "trade war Canada"`
  - Industry-specific queries based on `supply_chain_map` (e.g., `"Canada lumber tariff"`, `"steel import duty Canada"`)
- Parse article titles, sources, publication dates, and snippets
- Deduplicate by title similarity
- Pass raw article data (title + snippet + source + date) to Gemini as context for the Geopolitical Analyst agent
- Cache fetched articles for 1 hour to avoid redundant API calls across sessions

**news_fetcher.py Service Interface:**
- `fetch_trade_news(industries: list[str], materials: list[str]) -> list[dict]` — returns `[{title, source, published, url, snippet}]`
- `fetch_government_notices() -> list[dict]` — CBSA/GAC RSS for official policy changes

**Fallback:** If news APIs fail, the Geopolitical Analyst still runs but reports "No live news available — analysis based on known tariff schedule only." The agent's output remains valid, just without real-time intelligence.

### 7.3 Supplier Seed Data

**File:** `database/supplier_seed.json`
**Purpose:** Pre-researched Canadian suppliers for demo profile materials. Agent 3 uses this to supplement Gemini's research with verified data.

Structure: keyed by material category, each containing `canadian_suppliers` array with `category`, `region`, `directory`, and `notes` fields.

### 7.3 Demo Business Profiles

**File:** `database/demo_profiles.json`
**Purpose:** 3 pre-built business descriptions for quick demo. Frontend shows these as clickable cards.

| Profile | Industry | Key US Imports | Expected Exposure | Expected Margin Erosion |
|---------|---------|---------------|-------------------|------------------------|
| Kitchener Furniture Manufacturer | Furniture | Hardwood lumber, steel fasteners, finishing chemicals | ~$180K/yr | ~12% |
| Toronto Food Packaging Company | Packaging | Corrugated cardboard, plastic resins, printing inks | ~$95K/yr | ~8% |
| Vancouver Auto Parts Distributor | Auto Parts | Brake pads, oil filters, air filters, gaskets | ~$320K/yr | ~18% |

Each profile includes a `description` field (the natural language text that gets submitted) and `id` for API reference.

---

## 8. API Specifications

### 8.1 POST /api/analyze

**Description:** Start a new business analysis. Creates a session, launches the multi-agent pipeline as a background task.

**Request Body:**
```json
{
  "business_description": "I run a furniture company in Kitchener...",
  "demo_profile_id": null
}
```
- `business_description` — required, min 50 chars, max 5000 chars
- `demo_profile_id` — optional, if provided loads description from demo_profiles.json instead

**Response (202 Accepted):**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "started",
  "message": "Analysis started. Connect to WebSocket for live updates.",
  "ws_url": "/ws/warroom/550e8400-e29b-41d4-a716-446655440000"
}
```

**Errors:**
- `400` — description too short or empty
- `422` — invalid JSON body
- `500` — Backboard.io or Gemini failure

---

### 8.2 GET /api/tariff/{hs_code}

**Description:** Look up tariff rate for a specific HS code.

**Response (200 OK):**
```json
{
  "hs_code": "440710",
  "description": "Coniferous wood, sawn lengthwise",
  "mfn_rate": 0.0,
  "us_retaliatory_rate": 25.0,
  "effective_rate": 25.0,
  "category": "Wood"
}
```

**Errors:**
- `404` — HS code not in database

---

### 8.3 GET /api/session/{session_id}/plan

**Description:** Get the completed survival plan and all agent outputs for a session.

**Response (200 OK):**
```json
{
  "session_id": "550e8400-...",
  "status": "complete",
  "plan": { "...survival_plan object..." },
  "supply_chain_map": { "...agent 1 output..." },
  "tariff_impact": { "...agent 2 output..." },
  "alternative_suppliers": { "...agent 3 output..." }
}
```

**Errors:**
- `404` — session doesn't exist
- `202` — analysis still in progress (returns current agent statuses)

---

### 8.4 GET /api/session/{session_id}/pdf

**Description:** Download the survival plan as a branded PDF.

**Response:** `application/pdf` file download

**Errors:**
- `404` — session doesn't exist
- `409` — analysis not yet complete

---



**Behavior:**
1. Read the `survival_plan` from the session


**Response Headers:**
```
```

**Errors:**
- `404` — session doesn't exist
- `409` — analysis not yet complete

---

### 8.6 POST /api/session/{session_id}/reclassify

**Description:** User overrides an HS code classification from the embedding explorer. Triggers re-computation of tariff impact for the affected input.

**Request Body:**
```json
{
  "input_name": "Hardwood Lumber (Oak, Maple, Cherry)",
  "original_hs_code": "440799",
  "selected_hs_code": "440710",
  "reason": "This is coniferous wood, not hardwood"
}
```

**Response (200 OK):**
```json
{
  "input_name": "Hardwood Lumber (Oak, Maple, Cherry)",
  "old_hs_code": "440799",
  "new_hs_code": "440710",
  "old_tariff_rate": 25.0,
  "new_tariff_rate": 20.0,
  "old_annual_tariff_cost": 80000,
  "new_annual_tariff_cost": 64000,
  "savings_from_correction": 16000
}
```

**Side effects:**
- Updates `supply_chain_map` in shared memory with corrected HS code
- Re-triggers Agent 2 (Tariff Calculator) for the affected input only
- Broadcasts updated `tariff_impact` via WebSocket

**Errors:**
- `404` — session or input not found
- `400` — selected HS code doesn't exist in tariff database
- `409` — analysis not yet complete

---

### 8.7 GET /api/session/{session_id}/embedding-explorer/{input_name}

**Description:** Returns 2D projection data for the embedding space around a classified input, used by the frontend EmbeddingExplorer visualization.

**Response (200 OK):**
```json
{
  "input_name": "Hardwood Lumber (Oak, Maple, Cherry)",
  "query_point": {"x": 0.42, "y": -0.18, "label": "User query"},
  "candidates": [
    {"hs_code": "440799", "description": "Wood sawn or chipped, non-coniferous", "x": 0.45, "y": -0.15, "score": 0.92, "is_selected": true},
    {"hs_code": "440710", "description": "Coniferous wood, sawn lengthwise", "x": 0.38, "y": -0.22, "score": 0.87, "is_selected": false},
    {"hs_code": "441899", "description": "Builders' joinery and carpentry of wood", "x": 0.21, "y": 0.05, "score": 0.79, "is_selected": false},
    {"hs_code": "940360", "description": "Wooden furniture", "x": -0.12, "y": 0.31, "score": 0.71, "is_selected": false},
    {"hs_code": "440320", "description": "Wood in the rough, non-coniferous", "x": 0.50, "y": -0.25, "score": 0.68, "is_selected": false}
  ],
  "neighbors": [
    {"hs_code": "440791", "description": "Oak wood sawn lengthwise", "x": 0.47, "y": -0.12},
    {"hs_code": "440792", "description": "Beech wood sawn lengthwise", "x": 0.44, "y": -0.19}
  ],
  "category_clusters": [
    {"category": "Wood & Articles of Wood", "center_x": 0.40, "y": -0.15, "radius": 0.3},
    {"category": "Furniture", "center_x": -0.10, "y": 0.30, "radius": 0.25}
  ]
}
```

**Notes:**
- 2D coordinates are computed via UMAP dimensionality reduction on the embedding vectors
- `candidates` are the top-5 from RAG retrieval (same as classification)
- `neighbors` are additional nearby HS codes for context (up to 10)
- `category_clusters` show broad tariff chapter groupings as background regions

**Errors:**
- `404` — session or input not found
- `409` — analysis not yet complete

---

### 8.8 GET /api/demo-profiles

**Description:** List available demo business profiles for quick-fill.

**Response (200 OK):**
```json
{
  "profiles": [
    {
      "id": "demo_furniture",
      "name": "Kitchener Furniture Manufacturer",
      "description": "I run a furniture company in Kitchener...",
      "industry": "Furniture Manufacturing"
    }
  ]
}
```

---

### 8.7 GET /health

**Response (200 OK):**
```json
{
  "status": "healthy",
  "tariff_db_loaded": true,
  "tariff_db_rows": 12000,
  "backboard_connected": true,
  "gemini_api_available": true
}
```

---

## 9. WebSocket Protocol

### 9.1 Connection
```
WS /ws/warroom/{session_id}
```

### 9.2 Server -> Client Message Types

**Agent Status Update** (sent throughout analysis):
```json
{
  "type": "agent_status",
  "agent_id": "supply_chain_analyst",
  "agent_name": "Supply Chain Analyst",
  "status": "working",
  "message": "Identified 6 inputs, 4 are US-sourced. Running RAG classification...",
  "data": null,
  "color": "#3B82F6",
  "timestamp": "2026-03-06T14:30:00Z"
}
```

**Status values:** `idle` | `waiting` | `working` | `complete` | `error`

**RAG Classification Event** (sent by backend during HS code classification):
```json
{
  "type": "rag_classification",
  "agent_id": "supply_chain_analyst",
  "input_name": "Hardwood Lumber (Oak, Maple, Cherry)",
  "query": "Raw lumber for table tops, chair frames, cabinet panels",
  "candidates": [
    {"hs_code": "440799", "description": "Wood sawn or chipped, non-coniferous", "score": 0.92},
    {"hs_code": "440710", "description": "Coniferous wood, sawn lengthwise", "score": 0.87},
    {"hs_code": "441899", "description": "Builders' joinery and carpentry of wood", "score": 0.79},
    {"hs_code": "940360", "description": "Wooden furniture", "score": 0.71},
    {"hs_code": "440320", "description": "Wood in the rough, non-coniferous", "score": 0.68}
  ],
  "selected": {"hs_code": "440799", "confidence": 0.92, "reasoning": "Non-coniferous sawn wood matches hardwood lumber for furniture"},
  "timestamp": "2026-03-06T14:30:02Z"
}
```

**Geopolitical Alert Event** (sent by Geopolitical Analyst when a relevant news article is found):
```json
{
  "type": "geopolitical_alert",
  "agent_id": "geopolitical_analyst",
  "urgency": "high",
  "headline": "US Considers Additional 10% Lumber Tariff",
  "source": "Reuters",
  "published": "2026-03-06T08:15:00Z",
  "relevance": "Direct impact on your #1 input: Hardwood Lumber ($320K/yr)",
  "affected_inputs": ["Hardwood Lumber (Oak, Maple, Cherry)"],
  "risk_adjustment": {"from": "high", "to": "critical"},
  "actionable_alert": "Lock in lumber contracts NOW before potential April 1 increase",
  "timestamp": "2026-03-06T14:30:08Z"
}
```

**Reclassification Event** (sent after user corrects an HS code via embedding explorer):
```json
{
  "type": "reclassification",
  "input_name": "Hardwood Lumber (Oak, Maple, Cherry)",
  "old_hs_code": "440799",
  "new_hs_code": "440710",
  "old_tariff_rate": 25.0,
  "new_tariff_rate": 20.0,
  "savings_from_correction": 16000,
  "updated_tariff_impact": { "...recalculated tariff_impact object..." },
  "timestamp": "2026-03-06T14:31:15Z"
}
```

**Agent Complete** (includes summary data for the feed card):
```json
{
  "type": "agent_status",
  "agent_id": "tariff_calculator",
  "agent_name": "Tariff Calculator",
  "status": "complete",
  "message": "Total tariff exposure: $180,240/year. 2 product lines at risk.",
  "data": {
    "total_exposure": 180240,
    "risk_level": "high",
    "products_at_risk": 2
  },
  "color": "#EF4444",
  "timestamp": "2026-03-06T14:30:05Z"
}
```

**Analysis Complete** (all 4 agents done):
```json
{
  "type": "analysis_complete",
  "session_id": "550e8400-...",
  "plan_url": "/api/session/550e8400-.../plan",
  "pdf_url": "/api/session/550e8400-.../pdf",
  "timestamp": "2026-03-06T14:30:15Z"
}
```

**Error:**
```json
{
  "type": "error",
  "agent_id": "supplier_scout",
  "message": "Gemini API rate limit exceeded. Retrying in 5s...",
  "retrying": true,
  "timestamp": "2026-03-06T14:30:10Z"
}
```

---

## 10. Frontend Specifications

### 10.1 Layout

```
+------------------------------------------------------------------+
| [Logo] TariffTriage              Trade War Survival War Room      |
+------------------------------------------------------------------+
|                    |                                               |
| DESCRIBE YOUR      |  +-------------------+ +------------------+ |
| BUSINESS            |  | Supply Chain      | | Tariff           | |
|                    |  | Analyst           | | Calculator       | |
| [textarea          |  | [blue border]     | | [red border]     | |
|  multiline         |  | Status: working   | | Status: waiting  | |
|  input with        |  | > Found 6 inputs  | | Waiting for      | |
|  placeholder       |  | > 4 are US-sourced| | supply chain map | |
|  text]             |  | > Classifying...  | |                  | |
|                    |  +-------------------+ +------------------+ |
| [Analyze Button]   |  +-------------------+ +------------------+ |
|                    |  | Supplier          | | Geopolitical     | |
| --- or try ---     |  | Scout             | | Analyst          | |
| [Furniture Co.]    |  | [green border]    | | [orange border]  | |
| [Packaging Co.]    |  | Status: idle      | | Status: working  | |
| [Auto Parts]       |  |                   | | > Scanning news  | |
|                    |  +-------------------+ +------------------+ |
|                    |  +------------------------------------------+|
|                    |  | Strategy Architect  [purple]  Status: idle||
|                    |  +------------------------------------------+|
+--------------------+----------------------------------------------+
|                                                                   |
|  TRADE WAR SURVIVAL PLAN  (slides up when all agents complete)   |
|  +-------------------------------------------------------------+ |
|  | Executive Summary: $180K exposure, HIGH risk                 | |
|  |                                                              | |
|  | WHAT IF TARIFFS GO HIGHER?           Current: 25%            | |
|  | [====O=========================] 0% ------------- 50%        | |
|  |                          ^ Break-even: 32%                   | |
|  | $180,240 exposure | 12.1% margin erosion | 0 unprofitable   | |
|  |                                                              | |
|  | [Bar Chart: Tariff Impact by Input — bars resize live]       | |
|  | [Product Cards: green/yellow/red based on profitability]     | |
|  |                                                              | |
|  | Priority Actions: 1. Switch lumber supplier...               | |
|  | Pricing: Hybrid - absorb 40%, pass through 60%              | |
|  | Timeline: 30 days / 60 days / 90 days                       | |
|  |                                            [Download PDF]    | |
|  +-------------------------------------------------------------+ |
+-------------------------------------------------------------------+
```

### 10.2 Component Architecture

```
<App>
  <WarRoom>
    <BusinessInput />          // Left sidebar
    <AgentGrid>                // Main area (agent grid)
      <AgentFeed agent="supply_chain_analyst" />
      <AgentFeed agent="tariff_calculator" />
      <AgentFeed agent="supplier_scout" />
      <AgentFeed agent="geopolitical_analyst" />
      <AgentFeed agent="strategy_architect" />
    </AgentGrid>
    <SurvivalPlan>             // Bottom panel (appears when complete)
      <ExecutiveSummary />
      <TariffSimulator />      // Interactive what-if slider + live-updating chart
      <TariffChart />          // Chart.js bar chart (controlled by simulator)
      <ActionList />
      <PricingStrategy />
      <Timeline />
      <PdfExport />
    </SurvivalPlan>
  </WarRoom>
</App>
```

### 10.3 Component Specifications

#### BusinessInput (left sidebar)
- Large textarea with placeholder: "Describe your business, what you make, where you source materials from, and where you sell..."
- Character count indicator (min 50)
- "Analyze My Business" button — disabled when empty or < 50 chars, shows loading spinner during analysis
- Below: "Or try an example:" section with DemoProfiles cards
- Fetches profiles from `GET /api/demo-profiles` on mount
- Clicking a demo profile fills the textarea

#### AgentFeed (single agent card)
- Card with colored left border (agent accent color)
- Header: agent name + status badge (colored pill)
- Scrollable message feed: list of status messages with timestamps, newest at bottom
- **RAG Classification Cards** (Supply Chain Analyst only): when a `rag_classification` WebSocket message arrives, render an inline classification card showing:
  - Input name (bold)
  - Top 5 candidate HS codes as a mini-table: `HS Code | Description | Score` with score as a horizontal bar/percentage
  - Selected code highlighted in green with confidence badge (e.g., "92% match")
  - Cards animate in sequentially as each input gets classified — creates a visible "AI thinking" effect
  - Each card has an "Explore why" link that expands to show the `<EmbeddingExplorer />` visualization for that input
  - Users can click alternative HS codes in the explorer to reclassify, triggering live tariff recalculation
- **Geopolitical Alert Cards** (Geopolitical Analyst only): when a `geopolitical_alert` WebSocket message arrives, render an inline alert card showing:
  - Urgency badge (high = red pulse, medium = orange, low = yellow)
  - Headline + source + time (e.g., "Reuters • 6 hours ago")
  - Relevance to this business (personalized one-liner)
  - Affected inputs highlighted (links to the corresponding supply chain items)
  - Risk adjustment arrow (e.g., "Wood & Lumber: HIGH → CRITICAL")
  - Actionable alert in a yellow callout box with deadline
  - Cards animate in with a subtle shake/pulse to draw attention — these are "breaking news" moments
- Typing indicator: animated dots when status is `working`
- Summary card: when `complete`, shows key finding in a highlighted mini-card
- Error state: red border, error message, retry indicator
- Messages appear with fade-in + slide-up CSS transition (150ms)
- Working state: border glow pulse animation

#### AgentGrid (agent layout)
- CSS grid: 2x2 for first 4 agents, Strategy Architect spans full width below (or 3+2 layout)
- Contains 5 AgentFeed components
- Optional: SVG dependency arrows between agents (animated dash pattern)

#### SurvivalPlan (bottom panel)
- Hidden until `analysis_complete` WebSocket message received
- Slides up from bottom (300ms ease-out CSS transition)
- Fetches full plan from `GET /api/session/{id}/plan`
- Sections: Executive Summary, Tariff Chart, Priority Actions, Pricing Strategy, Timeline, Risks
- Each section is collapsible
- PDF download button calls `GET /api/session/{id}/pdf`

#### EmbeddingExplorer (interactive RAG explainer)
- **Trigger**: Appears as an expandable section within each RAG classification card in the Supply Chain Analyst feed. Small "Explore why" link below the selected HS code.
- **Visualization**: 2D scatter plot (Canvas or SVG) showing the embedding space:
  - **Query point**: User's product description, rendered as a pulsing dot with label
  - **Candidate points**: Top-5 HS codes from RAG retrieval, sized by similarity score, colored by tariff chapter category
  - **Selected point**: Highlighted with a ring/glow (the AI's pick)
  - **Neighbor points**: Additional nearby HS codes shown as smaller, faded dots for context
  - **Category clusters**: Semi-transparent background regions showing broad tariff chapter groupings (e.g., "Wood & Articles of Wood", "Furniture")
  - **Distance lines**: Dashed lines from query point to each candidate, with similarity score labels
- **Interaction**:
  - **Hover**: Tooltip showing full HS code description, tariff rate, and similarity score
  - **Click on any HS code point**: Opens a "Reclassify" confirmation panel:
    - Shows side-by-side comparison: current HS code vs. clicked HS code
    - Shows tariff rate difference and annual cost impact (e.g., "Switching saves $16,000/year")
    - "Confirm Reclassification" button → calls `POST /api/session/{id}/reclassify`
    - On success: selected point updates, tariff impact numbers recalculate live, a toast notification shows the savings
  - **Zoom/pan**: Mouse wheel to zoom, drag to pan (for exploring dense regions)
- **Data**: Fetched from `GET /api/session/{id}/embedding-explorer/{input_name}` on expand
- **Animation**: Points animate in from the query point outward on first load (200ms stagger)
- **Empty state**: If classification confidence > 0.95, show a simplified view with a note: "High confidence match — the AI is very sure about this one"

#### TariffSimulator (interactive what-if slider)
- **Header**: "What If Tariffs Go Higher?" with current rate displayed (e.g., "25%")
- **Slider**: Range input from 0% to 50%, step 1%. Default position = current effective tariff rate from `tariff_impact` data.
- **Live recalculation (pure frontend math, no API call)**:
  - For each input: `new_tariff_cost = annual_spend * (slider_rate / 100)`
  - For each product: recalculate `margin_after_tariff_pct` using the new total tariff cost across its inputs
  - `is_profitable` flips to false when `margin_after_tariff_pct < 0`
  - Total exposure = sum of all input tariff costs at current slider rate
- **Live-updating display** (all animate on slider drag with CSS transitions):
  - **Headline metrics row**: Total Exposure ($), Margin Erosion (%), Products Unprofitable (count) — numbers animate with `CountUp` or CSS transition
  - **TariffChart** (below): bar chart lengths update in real-time as slider moves
  - **Product profitability cards**: row of cards per product line, each showing margin %. Cards flip from green → yellow → red as margins shrink. When a product becomes unprofitable, card flashes red with "UNPROFITABLE" badge.
  - **Tipping point marker**: vertical dashed line on the slider track showing the tariff rate at which the first product becomes unprofitable. Label: "Break-even: 32%"
- **Interaction feel**: slider should feel fluid — `requestAnimationFrame` or debounce at 16ms so chart/numbers update at 60fps during drag
- **Reset button**: "Reset to Current Rate" snaps slider back to actual tariff rate

#### TariffChart
- Chart.js horizontal bar chart
- Shows annual tariff cost by input, sorted highest to lowest
- Color-coded by category
- Labeled with dollar amounts
- **Controlled by TariffSimulator**: receives `simulatedRate` prop. When simulator is active, bar lengths reflect the simulated tariff rate instead of the actual rate. Bars animate smoothly between values (Chart.js `update()` with animation duration 150ms).

- Positioned between Timeline and PDF Export in the SurvivalPlan panel

### 10.4 Visual Design

- **Background**: `#0F172A` (slate-900)
- **Cards**: `#1E293B` (slate-800) with subtle border
- **Text**: white primary, `#94A3B8` (slate-400) secondary
- **Font**: Inter or system sans-serif, monospace for numbers/dollar amounts
- **Agent colors**: Blue `#3B82F6`, Red `#EF4444`, Green `#10B981`, Orange `#F59E0B`, Purple `#8B5CF6`
- **Risk badges**: green (low), yellow (medium), orange (high), red (critical)
- **Responsive**: Desktop-first, min 1024px. Stacks to 1-column on tablet.

### 10.5 Frontend Data Flow

1. User types description + clicks Analyze
2. `POST /api/analyze` returns `session_id` + `ws_url`
3. Frontend connects to `WS /ws/warroom/{session_id}`
4. WebSocket messages update agent states (managed via `useAgentState` hook)
5. Each `agent_status` message appends to that agent's message feed
6. `rag_classification` messages render inline classification cards in the Supply Chain Analyst feed (candidates + scores + selected code)
6b. `geopolitical_alert` messages render breaking news alert cards in the Geopolitical Analyst feed (headline + source + risk adjustment + actionable alert)
7. When `analysis_complete` arrives, SurvivalPlan panel slides up
7. SurvivalPlan fetches `GET /api/session/{id}/plan` for full data
9. PDF button triggers `GET /api/session/{id}/pdf` download

### 10.6 State Management

The `useAgentState` hook manages an array of 4 agent states:
```
agents: [
  { agentId, agentName, status, message, color, data, messages[] }
]
```

The `useWebSocket` hook:
- Connects to WebSocket URL when `sessionId` is set
- Parses incoming messages and dispatches to agent state updates
- Handles `rag_classification` messages: appends classification card data to the Supply Chain Analyst's feed
- Handles `geopolitical_alert` messages: appends breaking news alert cards to the Geopolitical Analyst's feed
- Tracks `isComplete` boolean and `planUrl` string
- Provides `reset()` to clear state for a new analysis
- Auto-reconnects on disconnect

---

## 11. PDF Report

### 11.1 Pages

1. **Cover Page**: TariffTriage logo, business name, date, risk level badge
2. **Executive Summary**: Headline finding, total exposure, key metrics
3. **Supply Chain Exposure**: Table of all inputs with tariff rates and costs + bar chart
4. **Scenario Analysis**: Table showing impact at 25/30/35/40% tariff rates
5. **Alternative Suppliers**: Per-input supplier recommendations with cost comparisons
6. **Priority Actions**: Ranked list with savings, effort, and timeline
7. **Pricing Strategy**: Absorb vs pass-through recommendation with per-product details
8. **Implementation Timeline**: 30/60/90 day action items
9. **Risk Assessment**: Risk list with probability and mitigations

### 11.2 Implementation

- Generated from an HTML/CSS Jinja2 template (`templates/report.html`)
- Rendered to PDF via WeasyPrint
- Backend endpoint: `GET /api/session/{id}/pdf`
- Template receives all 4 agent outputs as template variables

---

## 12. Detailed Task Breakdown

## PHASE 1: Backend Foundation (Hours 0-4)

### Task T1.1: Initialize Backend Infrastructure
**Priority:** P0 | **Time:** 1 hour | **Owner:** Member 1

#### Sub-tasks:
- [ ] **T1.1.1** Create `backend/requirements.txt` with dependencies: fastapi, uvicorn, pandas, pydantic, python-dotenv, httpx, google-generativeai, weasyprint, jinja2, websockets, tenacity, backboard-sdk, chromadb, umap-learn, feedparser, beautifulsoup4
- [ ] **T1.1.3** Implement `backend/main.py`: FastAPI app with async lifespan, CORS middleware, tariff DB load on startup, HS vector store initialization (embed + index all HS codes into ChromaDB), health check endpoint, router registration
- [ ] **T1.1.4** Set up venv and verify `GET /health` returns healthy

**Acceptance Criteria:**
- [ ] Server starts on port 8000 without errors
- [ ] `GET /health` returns `{"status": "healthy", "tariff_db_loaded": true, "vector_store_ready": true}`
- [ ] CORS allows frontend origin

---

### Task T1.2: Initialize Frontend
**Priority:** P0 | **Time:** 1 hour | **Owner:** Member 3

#### Sub-tasks:
- [ ] **T1.2.1** Scaffold React + TypeScript + Vite project
- [ ] **T1.2.2** Install Tailwind CSS, Chart.js, react-chartjs-2
- [ ] **T1.2.3** Configure dark theme defaults in Tailwind config
- [ ] **T1.2.4** Create all component file stubs (see Section 10.2)
- [ ] **T1.2.5** Implement base dark layout with placeholder components

**Acceptance Criteria:**
- [ ] `npm run dev` starts on port 5173
- [ ] Dark theme renders with war room layout shell
- [ ] All component files exist

---

### Task T1.3: Tariff Database & Lookup Service
**Priority:** P0 | **Time:** 1.5 hours | **Owner:** Member 4

#### Sub-tasks:
- [ ] **T1.3.1** Download CBSA tariff schedule, convert to CSV matching schema in Section 7.1
- [ ] **T1.3.2** Add retaliatory tariff rates for US goods (from government announcements)
- [ ] **T1.3.3** Implement `tariff_lookup.py` with `lookup()`, `lookup_prefix()`, `lookup_category()`, `get_rate()` methods
- [ ] **T1.3.4** Implement `GET /api/tariff/{hs_code}` endpoint
- [ ] **T1.3.5** Write tests: exact match, prefix match, category match, missing code returns 404

**Acceptance Criteria:**
- [ ] `GET /api/tariff/440710` returns correct tariff data
- [ ] Missing codes return 404
- [ ] All tests pass

---

### Task T1.4: Backboard.io SDK + Agent Base + Orchestrator
**Priority:** P0 | **Time:** 1.5 hours | **Owner:** Member 1

#### Sub-tasks:
- [ ] **T1.4.1** Install Backboard.io SDK, configure API key
- [ ] **T1.4.2** Create `base_agent.py` with shared memory read/write, WebSocket status emission, dependency waiting (see Section 6.5 for behavior spec)
- [ ] **T1.4.3** Implement `orchestrator.py` enforcing dependency rules from Section 6.2
- [ ] **T1.4.4** Implement WebSocket manager in `api/websocket.py` (handles multiple sessions, broadcasts to connected clients)
- [ ] **T1.4.5** Test: write to shared memory from one agent mock, read from another

**Acceptance Criteria:**
- [ ] Shared memory read/write works via Backboard.io
- [ ] Orchestrator enforces correct dependency order
- [ ] WebSocket broadcasts messages to connected clients

---

## PHASE 2: Agent Implementation (Hours 4-10)

### Task T2.1: Gemini Client + RAG HS Classifier
**Priority:** P0 | **Time:** 2 hours | **Owner:** Member 2

#### Sub-tasks:
- [ ] **T2.1.1** Implement `gemini_client.py`: wrapper around Gemini 2.0 Flash API with structured JSON output mode, retry with exponential backoff (tenacity), response validation. Also expose `embed(text) -> list[float]` using `text-embedding-004`.
- [ ] **T2.1.2** Implement `hs_vector_store.py`: at startup, embed all ~12K HS code descriptions via Gemini `text-embedding-004` (batched), store in ChromaDB in-memory collection with metadata (hs_code, effective_rate, category). Expose `search(query, top_k=5)` returning ranked candidates with similarity scores.
- [ ] **T2.1.3** Implement `hs_classifier.py` RAG pipeline: takes natural language product description → calls `hs_vector_store.search()` for top-5 candidates → passes candidates as context to Gemini for final classification → returns `{hs_code, confidence, reasoning, candidates}` (see Section 7.1.1)
- [ ] **T2.1.4** Implement `embedding_explorer.py`: UMAP-based 2D projection service. Takes a query embedding + candidate HS code embeddings + neighbor embeddings → returns 2D coordinates for visualization. Cache projections per session.
- [ ] **T2.1.5** Implement `reclassify()` in `hs_classifier.py`: accepts user-selected HS code override, updates shared memory, re-triggers tariff calculation for affected input only.
- [ ] **T2.1.6** Implement `GET /api/session/{id}/embedding-explorer/{input_name}` endpoint: returns 2D projection data, candidates, neighbors, and category clusters.
- [ ] **T2.1.7** Implement `POST /api/session/{id}/reclassify` endpoint: validates HS code exists in tariff DB, updates shared memory, re-runs Agent 2 for affected input, broadcasts updated tariff_impact via WebSocket.
- [ ] **T2.1.8** Write tests: vector store returns relevant candidates for "hardwood lumber", classifier picks correct HS code in 4407xx range, confidence > 0.7, reclassification updates tariff impact correctly.

**Acceptance Criteria:**
- [ ] Gemini client returns parsed JSON matching requested schema
- [ ] Vector store indexes all HS codes at startup in <10 seconds
- [ ] `search("metal screws for furniture")` returns HS codes in 7318xx range as top result
- [ ] HS classifier produces valid 6-digit codes that exist in tariff DB with confidence scores
- [ ] Retry logic handles rate limits gracefully
- [ ] Embedding explorer returns valid 2D coordinates for all candidates and neighbors
- [ ] Reclassification endpoint updates tariff impact and broadcasts via WebSocket
- [ ] `get_neighbors()` returns semantically related HS codes not in the original top-5

---

### Task T2.2: Agent 1 — Supply Chain Analyst
**Priority:** P0 | **Time:** 1.5 hours | **Owner:** Member 2

#### Sub-tasks:
- [ ] **T2.2.1** Implement `supply_chain_agent.py` extending base agent
- [ ] **T2.2.2** Use system prompt from Section 6.4
- [ ] **T2.2.3** Read `business_input` from shared memory, call Gemini, validate response against SupplyChainMap structure
- [ ] **T2.2.4** Enrich/validate HS codes via hs_classifier against tariff DB
- [ ] **T2.2.5** Write `supply_chain_map` to shared memory, emit status updates throughout
- [ ] **T2.2.6** Test with all 3 demo profiles, verify HS codes exist in tariff DB

**Acceptance Criteria:**
- [ ] Agent correctly identifies US-sourced inputs from natural language
- [ ] HS codes validated against tariff DB
- [ ] Output matches `supply_chain_map` structure from Section 6.3
- [ ] Status messages stream via WebSocket

---

### Task T2.3: Agent 2 — Tariff Calculator
**Priority:** P0 | **Time:** 1.5 hours | **Owner:** Member 2

#### Sub-tasks:
- [ ] **T2.3.1** Implement `tariff_agent.py` extending base agent
- [ ] **T2.3.2** Wait for `supply_chain_map`, then trigger backend pandas lookup for all HS codes, write `tariff_rates` to shared memory
- [ ] **T2.3.3** Call Gemini with tariff calculator prompt + supply chain map + actual tariff rates
- [ ] **T2.3.4** Generate escalation scenarios (25/30/35/40%)
- [ ] **T2.3.5** Write `tariff_impact` to shared memory
- [ ] **T2.3.6** Test: financial calculations are mathematically correct, scenarios show increasing impact

**Acceptance Criteria:**
- [ ] Tariff rates come from pandas lookup, NOT invented by Gemini
- [ ] Math is verifiably correct (spend * rate = tariff cost)
- [ ] Output matches `tariff_impact` structure from Section 6.3

---

### Task T2.4: Agent 4 — Geopolitical Analyst + News Service
**Priority:** P0 | **Time:** 2 hours | **Owner:** Member 2

#### Sub-tasks:
- [ ] **T2.4.1** Implement `news_fetcher.py`: Google News RSS parser + NewsAPI fallback. Fetch last 24h articles matching trade/tariff keywords + business-specific industry/material terms. Deduplicate, cache for 1 hour.
- [ ] **T2.4.2** Implement `geopolitical_agent.py` extending base agent: waits for `supply_chain_map`, calls `news_fetcher.fetch_trade_news()` with the business's industries/materials, passes raw articles as context to Gemini with geopolitical analyst prompt.
- [ ] **T2.4.3** Emit `geopolitical_alert` WebSocket events as each relevant article is analyzed (creates live "breaking news" effect in the war room)
- [ ] **T2.4.4** Write `geopolitical_context` to shared memory
- [ ] **T2.4.5** Test: agent finds relevant news for lumber/steel/auto parts industries, risk adjustments are directionally correct, graceful fallback when news APIs unavailable

**Acceptance Criteria:**
- [ ] Agent fetches real news from the last 24 hours (not hardcoded)
- [ ] Articles are filtered by relevance to the specific business's inputs
- [ ] Risk adjustments reference specific articles with source attribution
- [ ] Actionable alerts include deadlines when applicable
- [ ] Graceful fallback if news fetch fails (agent still completes with "no live data" message)
- [ ] Geopolitical alert WebSocket events stream to frontend during analysis

---

### Task T2.5: Agent 3 — Supplier Scout
**Priority:** P0 | **Time:** 2 hours | **Owner:** Member 2

#### Sub-tasks:
- [ ] **T2.4.1** Implement `supplier_agent.py` extending base agent
- [ ] **T2.4.2** Wait for `supply_chain_map` AND `tariff_impact`
- [ ] **T2.4.3** Prioritize inputs by tariff cost (highest first)
- [ ] **T2.4.4** Load seed data from `supplier_seed.json`, include in Gemini prompt
- [ ] **T2.4.5** Call Gemini with supplier scout prompt
- [ ] **T2.4.6** Write `alternative_suppliers` to shared memory
- [ ] **T2.4.7** Test: highest-impact inputs are searched first, suggestions use categories not fabricated names

**Acceptance Criteria:**
- [ ] Highest-tariff-impact inputs prioritized
- [ ] Seed data incorporated into results
- [ ] Suggestions framed as categories/directories (honest framing)
- [ ] Output matches `alternative_suppliers` structure from Section 6.3

---

### Task T2.6: Agent 5 — Strategy Architect
**Priority:** P0 | **Time:** 1.5 hours | **Owner:** Member 2

#### Sub-tasks:
- [ ] **T2.5.1** Implement `strategy_agent.py` extending base agent
- [ ] **T2.5.2** Wait for ALL four agent outputs (including `geopolitical_context`)
- [ ] **T2.5.3** Call Gemini with full context from all agents
- [ ] **T2.5.4** Ensure actions ranked by estimated_savings, timeline has items per period
- [ ] **T2.5.5** Write `survival_plan` to shared memory
- [ ] **T2.5.6** Test: plan is actionable (not generic), actions ranked, timeline populated

**Acceptance Criteria:**
- [ ] Plan has specific recommendations (not "consider diversifying")
- [ ] Actions ranked by estimated savings
- [ ] 30/60/90 timeline has concrete items
- [ ] Output matches `survival_plan` structure from Section 6.3

---

### Task T2.7: Wire Up Full Pipeline + POST /api/analyze
**Priority:** P0 | **Time:** 1.5 hours | **Owner:** Member 1

#### Sub-tasks:
- [ ] **T2.6.1** Implement `POST /api/analyze` endpoint (see Section 8.1)
- [ ] **T2.6.2** Wire orchestrator to launch all agents as background task with correct dependencies
- [ ] **T2.6.3** Implement `GET /api/session/{id}/plan` endpoint (see Section 8.3)
- [ ] **T2.6.4** Handle agent errors (retry once, then emit error status)
- [ ] **T2.6.5** Emit `analysis_complete` WebSocket message when Agent 4 finishes
- [ ] **T2.6.6** End-to-end test: submit demo profile -> WebSocket messages arrive in order -> plan is retrievable

**Acceptance Criteria:**
- [ ] Full pipeline runs end-to-end for all 3 demo profiles
- [ ] Agents execute in correct dependency order
- [ ] WebSocket messages arrive in real-time during execution
- [ ] `GET /api/session/{id}/plan` returns all 4 agent outputs
- [ ] Errors handled (no silent failures)

---

## PHASE 3: Frontend Implementation (Hours 10-16)

### Task T3.1: Business Input Panel + API Client
**Priority:** P0 | **Time:** 2 hours | **Owner:** Member 3

#### Sub-tasks:
- [ ] **T3.1.2** Implement `BusinessInput.tsx` (see Section 10.3 spec)
- [ ] **T3.1.3** Implement `DemoProfiles.tsx` — fetches from API on mount, renders clickable cards
- [ ] **T3.1.4** Wire submit button to `POST /api/analyze`, store returned sessionId

**Acceptance Criteria:**
- [ ] User can type description and submit
- [ ] Demo profiles load from API and fill textarea on click
- [ ] Submit calls backend and receives session_id
- [ ] Validation prevents empty/short submissions

---

### Task T3.2: Agent Activity Feed + WebSocket
**Priority:** P0 | **Time:** 3 hours | **Owner:** Member 3

#### Sub-tasks:
- [ ] **T3.2.1** Implement `useWebSocket.ts` hook (see Section 10.6 spec)
- [ ] **T3.2.2** Implement `useAgentState.ts` hook — manages 4 agent states, updates from WebSocket
- [ ] **T3.2.3** Implement `AgentFeed.tsx` (see Section 10.3 spec): colored border, status badge, message feed, typing indicator, summary card
- [ ] **T3.2.4** Implement `AgentGrid.tsx` — 2x2 CSS grid with 4 AgentFeed components
- [ ] **T3.2.5** Add animations: message fade-in, working border glow, status transitions

**Acceptance Criteria:**
- [ ] All 4 agents appear in grid with correct accent colors
- [ ] WebSocket messages update agent feeds in real-time
- [ ] Messages accumulate in feed (don't replace previous messages)
- [ ] Typing indicator visible during "working" state
- [ ] "Complete" shows summary card with key findings

---

### Task T3.3: Survival Plan Display + Chart + Tariff Simulator
**Priority:** P0 | **Time:** 4 hours | **Owner:** Member 3

#### Sub-tasks:
- [ ] **T3.3.1** Implement `SurvivalPlan.tsx` — hidden until complete, slides up, fetches plan from API
- [ ] **T3.3.2** Implement `TariffChart.tsx` — Chart.js horizontal bar chart of tariff cost by input, accepts `simulatedRate` prop to dynamically resize bars
- [ ] **T3.3.3** Implement executive summary section with risk badge, headline, key metrics
- [ ] **T3.3.4** Implement `TariffSimulator.tsx` (see Section 10.3 spec):
  - Range slider (0-50%), default = current tariff rate
  - Pure frontend recalculation: `new_cost = annual_spend * (rate / 100)` per input, recompute margins per product
  - Live-updating headline metrics (total exposure, margin erosion, unprofitable count) with number animation
  - Product profitability cards that flip green → yellow → red
  - Tipping point marker on slider at `break_even_tariff_rate_pct`
  - 60fps feel via `requestAnimationFrame` or 16ms debounce
- [ ] **T3.3.5** Wire TariffSimulator to TariffChart: slider state controls chart bar lengths, chart animates on update (150ms)
- [ ] **T3.3.6** Implement action list, pricing strategy, and timeline sub-sections
- [ ] **T3.3.7** Implement `PdfExport.tsx` — download button, loading spinner, triggers browser download

**Acceptance Criteria:**
- [ ] Plan panel slides up after all agents complete
- [ ] Chart renders with correct data sorted by impact
- [ ] Slider drags smoothly, numbers/chart update in real-time without lag
- [ ] Product cards visually flip to red/UNPROFITABLE when margins go negative
- [ ] Tipping point marker shows correct break-even tariff rate
- [ ] "Reset to Current Rate" snaps back to actual rate
- [ ] All sections display data from API response
- [ ] PDF download triggers browser file save

---

## PHASE 4: Polish & Demo Prep (Hours 16-20)

### Task T4.1: PDF Report Generation
**Priority:** P1 | **Time:** 2 hours | **Owner:** Member 4

#### Sub-tasks:
- [ ] **T4.1.1** Create `templates/report.html` Jinja2 template with all 9 pages (see Section 11.1)
- [ ] **T4.1.2** Style with print-friendly CSS (page breaks, margins, branded header)
- [ ] **T4.1.3** Implement `pdf_generator.py` service and `GET /api/session/{id}/pdf` endpoint
- [ ] **T4.1.4** Test PDF output with each demo profile

**Acceptance Criteria:**
- [ ] PDF generates for all 3 demo profiles without errors
- [ ] PDF is readable, professionally formatted, branded
- [ ] All data sections populated from agent outputs

---

**Priority:** P1 | **Time:** 2 hours | **Owner:** Member 4

#### Sub-tasks:

**Acceptance Criteria:**

---

### Task T4.3: Pre-compute Demo Results (Fallback Cache)
**Priority:** P0 | **Time:** 1 hour | **Owner:** Member 2

#### Sub-tasks:
- [ ] **T4.3.1** Run all 3 demo profiles through the full pipeline, save complete results as JSON
- [ ] **T4.3.2** Add fallback logic: if Gemini API fails for a demo profile, serve cached results
- [ ] **T4.3.3** Add simulated delays to cached responses (so war room effect still plays out)

**Acceptance Criteria:**
- [ ] Demo works even if Gemini API is down
- [ ] Cached results are indistinguishable from live in the UI
- [ ] War room typing effect still works with cached data

---

### Task T4.4: End-to-End Testing
**Priority:** P0 | **Time:** 1.5 hours | **Owner:** All

#### Sub-tasks:
- [ ] **T4.4.2** Test custom business description (not a demo profile)
- [ ] **T4.4.4** Test cached fallback mode
- [ ] **T4.4.5** Fix any bugs

**Acceptance Criteria:**
- [ ] All 3 demo profiles produce complete, correct results
- [ ] Custom input produces reasonable results
- [ ] No crashes or unhandled errors

---

### Task T4.5: Deploy to Vultr
**Priority:** P1 | **Time:** 1 hour | **Owner:** Member 1

#### Sub-tasks:
- [ ] **T4.5.1** Provision Vultr VM (2 CPU, 4GB RAM)
- [ ] **T4.5.2** Install Python, Node.js, dependencies
- [ ] **T4.5.3** Build frontend (`npm run build`), serve static files from FastAPI

**Acceptance Criteria:**
- [ ] App accessible via Vultr public URL
- [ ] WebSocket works through deployment

---

### Task T4.6: Demo Preparation
**Priority:** P0 | **Time:** 1.5 hours | **Owner:** All

#### Sub-tasks:
- [ ] **T4.6.1** Write and rehearse demo script (see Section 13)
- [ ] **T4.6.2** Practice demo 3+ times end-to-end
- [ ] **T4.6.3** Record backup screen recording (in case live demo fails)
- [ ] **T4.6.4** Prepare 3-4 slides: problem, solution, live demo, architecture
- [ ] **T4.6.5** Prepare for anticipated Q&A (see Section 14)

**Acceptance Criteria:**
- [ ] Demo completes in under 3 minutes
- [ ] Team can explain architecture confidently
- [ ] Backup video exists

---

## 13. Demo Script

**Duration:** 3 minutes

### Opening (30 seconds)
"The US-Canada trade war has hit small businesses hardest. 25-35% tariffs on everything from steel to lumber. But there's no tool that tells a specific business owner: 'Here's exactly how much this costs YOU, and here's what to do about it.' Until now."

### Demo (2 minutes)
1. **Show input panel** (10s): "Let's say you're a furniture manufacturer in Kitchener." Click demo profile.
2. **Click Analyze** (5s): "Watch what happens."
3. **War Room** (45s): Point out each agent.
   - "Supply Chain Analyst mapped 6 inputs, 4 from the US. Now watch — see those classification cards appearing? It's embedding each product description, searching our 12,000-code tariff database semantically, and showing the top 5 candidates with match scores. 440799: 92% match for hardwood lumber. That's RAG in action — no hallucinated codes."
   - Click "Explore why" on the lumber classification card. "See this? This is the actual embedding space. Your product description is this dot here. The AI searched for the nearest HS codes — these clusters are tariff chapters. See how 440799 is closest? But watch — what if the AI got it wrong?" Click on 440710. "One click: I override the classification. The tariff rate changes, the cost impact recalculates live. The user is in control, not the AI."
   - "Tariff Calculator is using the classified HS codes against real CBSA data to crunch the numbers."
   - Point at the Geopolitical Analyst. "Now THIS is interesting. See those orange alert cards? That agent just pulled this morning's actual trade news. It found..." — read the real headline — "...and it's flagging that YOUR lumber costs could jump another 10% by April 1. That alert is based on today's Reuters article, not something we pre-programmed. Every time you run this, it's different because the world changes."
   - "Supplier Scout is finding Canadian alternatives."
   - "Strategy Architect is pulling it all together — and look, it moved 'lock in lumber contracts' to priority #1 because of what the Geopolitical Analyst found this morning."
4. **Results** (20s): Scroll through the plan.
   - "Total exposure: $180K/year. 12% margin erosion."
   - "But switch lumber to an Ontario mill — save $48K."
5. **Tariff Simulator** (20s): THE WOW MOMENT. Grab the slider.
   - "But what if tariffs go higher? Watch this." Slowly drag from 25% → 35%.
   - "See the bars growing? Margins shrinking? At 32%..." — point at the tipping point marker — "...the dining table line goes underwater." Card flashes red.
   - Drag to 40%. "Now two product lines are unprofitable. $288K in tariffs."
   - Snap back with Reset. "That's why you need a plan NOW, at 25%."
7. **PDF** (5s): Click download. "Full report for their bank or accountant."
8. **Custom input** (10s): "Works for ANY business — type your own description."

### Close (30 seconds)

---

## 14. Anticipated Q&A

| Question | Answer |
|----------|--------|
| "Are the tariff rates accurate?" | "We use the published CBSA customs tariff schedule. Product descriptions are classified to HS codes via a RAG pipeline — we embed the description, semantic-search our tariff database for the top 5 candidates, then Gemini picks the best match. Rates come from the database, not hallucinated." |
| "Are the supplier suggestions real?" | "We frame suggestions as supplier categories and industry directories to search, not fabricated company names. For demo profiles, we validated categories against real Canadian directories." |
| "What if Backboard.io goes down?" | "We have a fallback: agents coordinate via Python asyncio with a shared dict. Backboard.io adds persistence and SDK, but the pattern works without it." |
| "How long does analysis take?" | "15-20 seconds for all 4 agents. The war room shows real-time progress so users always know what's happening." |
| "Could this scale?" | "Agents are stateless, tariff DB is a simple lookup. ChromaDB is in-memory for hackathon; swap to a managed vector DB for production scale. For enterprise, add verified supplier databases." |
| "Why RAG for HS code classification?" | "Plain Gemini can hallucinate HS codes that don't exist. Our RAG pipeline embeds the product description, retrieves the 5 most semantically similar real HS codes from our CBSA database, then Gemini picks from those candidates. Every code is guaranteed to exist in our tariff data. And if the AI gets it wrong, users can explore the embedding space visually, see why it picked what it did, and click to correct it — the whole tariff analysis updates live." |
| "How is the news feed live?" | "We pull from Google News RSS and NewsAPI, filtered by the user's specific industries and materials. The Geopolitical Analyst gets raw articles as context and Gemini connects each headline to THIS business's exposure. It's real news from the last 24 hours — run it again tomorrow and you'll get different alerts." |
| "How does the what-if slider work?" | "Pure frontend math — no API calls. We have `annual_spend` per input and `margin_pct` per product from Agent 2. The slider just recalculates `spend * rate` and recomputes margins in real-time. The data's already there, we just let users explore it interactively." |

---

## 15. Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Backboard.io SDK issues | Medium | High | Fallback: asyncio + shared dict (agents are just async functions) |
| Gemini API rate limits during demo | Medium | Critical | Pre-compute + cache all demo profile results. Serve cached with simulated delays. |
| Tariff data inaccuracy | Low | Medium | Use real CBSA data. Manually validate demo profile HS codes + rates. |
| Agent responses too slow (>30s) | Medium | Medium | Stream partial results. Optimize prompts. Pre-cache as fallback. |
| HS code misclassification | Low | Medium | RAG pipeline retrieves only real HS codes from CBSA data — impossible to hallucinate non-existent codes. Confidence scores flag uncertain classifications. For demo, pre-validate. |
| ChromaDB startup slow | Low | Low | 12K embeddings load in <10s. Pre-compute embeddings and persist to disk if needed. Startup health check blocks until index ready. |
| WebSocket drops during demo | Low | High | Auto-reconnect logic. Polling fallback for plan status. |
| WeasyPrint PDF issues | Low | Low | Fallback: simple HTML report download instead of PDF. |
| News API unavailable | Medium | Low | Geopolitical Analyst still runs — reports "no live data available" and omits news-based risk adjustments. Plan is still valid based on known tariff schedule. |
| News returns irrelevant articles | Low | Low | Gemini filters for business-specific relevance. Irrelevant articles are excluded from the output. Worst case: fewer alerts, not wrong alerts. |

---

## 16. Team Allocation

| Member | Primary Focus | Secondary Focus |
|--------|--------------|----------------|
| Member 1 | FastAPI backend, WebSocket, Backboard.io, orchestrator | Vultr deployment |
| Member 2 | All 5 agents, Gemini prompts, HS classifier, news service | Demo profile validation, cached fallback |
| Member 3 | React frontend, war room UI, agent feeds, charts | WebSocket hook |
| Member 4 | Tariff database, supplier seed data, PDF generation | Demo script, end-to-end testing |

---

## 17. Sponsor Prize Alignment

| Prize | How We Target It |
|-------|-----------------|
| **Backboard.io ($500)** | Core architecture uses Backboard.io for 4-agent shared memory orchestration. This IS the flagship multi-agent use case — agents share structured findings in real-time. |
| **Best Use of Gemini API** | All 4 agents powered by Gemini 2.0 Flash with structured JSON output. RAG pipeline uses Gemini `text-embedding-004` for semantic HS code search. Interactive embedding explorer visualizes the Gemini embedding space and lets users correct classifications. Three Gemini capabilities in one project: embeddings for retrieval + Flash for reasoning + embedding space visualization for explainability. |
| **Google Antigravity** | Agentic development platform — multi-agent visible collaboration is the core UX pattern. |
| **Vultr** | Full deployment on Vultr cloud compute. Backend + frontend served from single VM. |

---

## 18. Out of Scope (Hackathon)

- User accounts / authentication
- Historical tariff tracking or rate change alerts
- Real-time tariff rate updates (static snapshot is fine)
- Integration with accounting/ERP systems
- Mobile responsive design (desktop-first for demo)
- Multi-language support (English only)
- Verified supplier contact information (categories and directories only)
- Custom HS code database uploads
- Batch analysis of multiple businesses

---

## 19. Key Design Decisions

**Why Gemini 2.0 Flash over other models?**
- Sponsor prize target (Best Use of Gemini API)
- Fast inference (~2-4 seconds per agent call)
- Strong structured JSON output mode
- Good at domain reasoning (supply chain, finance)

**Why Backboard.io over custom orchestration?**
- Sponsor prize target ($500)
- SDK handles shared memory persistence and agent coordination
- Visible multi-agent pattern is the product's centerpiece
- Fallback to asyncio + dict is trivial if SDK has issues

**Why pandas over a database for tariffs?**
- 12K rows fits in memory trivially
- No database setup/migration overhead
- Instant lookups with pandas indexing
- CSV is easy to inspect, edit, and version

**Why WeasyPrint over ReportLab?**
- HTML/CSS templates are faster to iterate on
- Jinja2 templating is familiar to the team
- Print-quality output with standard CSS

**Why WebSocket over SSE?**
- Bidirectional (future: user can ask follow-up questions)
- Better browser support for reconnection
- FastAPI has native WebSocket support

---

**END OF PRD**

*Each section above is designed to be self-contained and promptable — copy any section into Claude to build that piece.*
