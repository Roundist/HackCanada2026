from __future__ import annotations

import json
import uuid
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, HTTPException

from agents.orchestrator import Orchestrator
from api.websocket import make_ws_callback, broadcast
from schemas.requests import AnalyzeRequest
from schemas.responses import AnalyzeResponse

router = APIRouter()

# session_id -> shared_memory (final results)
sessions: dict[str, dict] = {}

_DEMO_PROFILES_PATH = Path(__file__).parent.parent / "database" / "demo_profiles.json"


def _load_demo_profiles() -> list[dict]:
    with open(_DEMO_PROFILES_PATH) as f:
        return json.load(f)


async def _run_pipeline(session_id: str, business_description: str):
    """Run the multi-agent pipeline as a background task."""
    ws_callback = make_ws_callback(session_id)
    orchestrator = Orchestrator(business_description, ws_callback)
    try:
        result = await orchestrator.run()
        sessions[session_id] = result
        await broadcast(session_id, {
            "agent": "System",
            "event_type": "pipeline_complete",
            "status": "complete",
            "message": "All agents complete. Survival plan ready.",
        })
    except Exception as e:
        await broadcast(session_id, {
            "agent": "System",
            "event_type": "pipeline_error",
            "status": "error",
            "message": f"Pipeline failed: {str(e)}",
        })


@router.post("/api/analyze", response_model=AnalyzeResponse, status_code=202)
async def analyze(request: AnalyzeRequest, background_tasks: BackgroundTasks):
    session_id = str(uuid.uuid4())

    description = request.business_description
    if request.demo_profile_id:
        profiles = _load_demo_profiles()
        match = next((p for p in profiles if p["id"] == request.demo_profile_id), None)
        if match is None:
            raise HTTPException(status_code=404, detail=f"Demo profile '{request.demo_profile_id}' not found")
        description = match["description"]

    background_tasks.add_task(_run_pipeline, session_id, description)

    return AnalyzeResponse(
        session_id=session_id,
        status="started",
        message="Analysis started. Connect to WebSocket for live updates.",
        ws_url=f"/ws/warroom/{session_id}",
    )


@router.get("/api/session/{session_id}/plan")
async def get_plan(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=202, detail="Analysis still in progress")
    data = sessions[session_id]
    return {
        "session_id": session_id,
        "status": "complete",
        "plan": data.get("survival_plan"),
        "supply_chain_map": data.get("supply_chain_map"),
        "tariff_impact": data.get("tariff_impact"),
        "alternative_suppliers": data.get("alternative_suppliers"),
        "geopolitical_context": data.get("geopolitical_context"),
    }


@router.get("/api/session/{session_id}/pdf")
async def get_pdf(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=409, detail="Analysis not yet complete")
    from services.pdf_generator import generate_pdf
    from fastapi.responses import Response
    pdf_bytes = await generate_pdf(sessions[session_id])
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="survival-plan-{session_id[:8]}.pdf"'},
    )


@router.post("/api/session/{session_id}/reclassify")
async def reclassify(session_id: str, body: dict, background_tasks: BackgroundTasks):
    if session_id not in sessions:
        raise HTTPException(status_code=409, detail="Analysis not yet complete")

    data = sessions[session_id]
    supply_chain = data.get("supply_chain_map", {})
    input_name = body.get("input_name", "")
    new_hs_code = body.get("selected_hs_code", "")

    from services.tariff_lookup import lookup, get_rate

    if lookup(new_hs_code) is None:
        raise HTTPException(status_code=400, detail=f"HS code {new_hs_code} not in tariff database")

    # Find the input and update
    matched_input = None
    for inp in supply_chain.get("inputs", []):
        if inp["name"] == input_name:
            matched_input = inp
            break
    if matched_input is None:
        raise HTTPException(status_code=404, detail=f"Input '{input_name}' not found")

    old_hs_code = matched_input.get("hs_code", "")
    old_rate = get_rate(old_hs_code)
    new_rate = get_rate(new_hs_code)
    spend = matched_input.get("estimated_annual_spend", 0)

    # Update the HS code in supply chain map
    matched_input["hs_code"] = new_hs_code

    # Update tariff_rates in shared memory
    tariff_rates = data.get("tariff_rates", {})
    if input_name in tariff_rates:
        tariff_rates[input_name]["hs_code"] = new_hs_code
        tariff_rates[input_name]["tariff_rate"] = new_rate

    # Re-trigger Agent 2 (Tariff Calculator) in background to recalculate full impact
    background_tasks.add_task(_rerun_tariff_agent, session_id, data)

    return {
        "input_name": input_name,
        "old_hs_code": old_hs_code,
        "new_hs_code": new_hs_code,
        "old_tariff_rate": old_rate,
        "new_tariff_rate": new_rate,
        "old_annual_tariff_cost": spend * old_rate / 100,
        "new_annual_tariff_cost": spend * new_rate / 100,
        "savings_from_correction": (spend * old_rate / 100) - (spend * new_rate / 100),
    }


async def _rerun_tariff_agent(session_id: str, shared_memory: dict):
    """Re-run Agent 2 after an HS code reclassification and broadcast the update."""
    from agents.tariff_agent import TariffCalculatorAgent
    ws_callback = make_ws_callback(session_id)

    async def ws(agent_name: str, event_type: str, data: dict):
        await broadcast(session_id, data)

    await broadcast(session_id, {
        "agent": "System",
        "event_type": "reclassify_start",
        "status": "working",
        "message": "Recalculating tariff impact with corrected HS code...",
    })

    try:
        agent2 = TariffCalculatorAgent(shared_memory, ws)
        await agent2.run()

        await broadcast(session_id, {
            "agent": "System",
            "event_type": "reclassify_complete",
            "status": "complete",
            "message": "Tariff impact recalculated.",
            "tariff_impact": shared_memory.get("tariff_impact"),
        })
    except Exception as e:
        await broadcast(session_id, {
            "agent": "System",
            "event_type": "reclassify_error",
            "status": "error",
            "message": f"Recalculation failed: {str(e)}",
        })


@router.get("/api/session/{session_id}/embedding-explorer/{input_name}")
async def get_embedding_explorer(session_id: str, input_name: str):
    if session_id not in sessions:
        raise HTTPException(status_code=409, detail="Analysis not yet complete")

    data = sessions[session_id]
    supply_chain = data.get("supply_chain_map", {})

    matched_input = None
    for inp in supply_chain.get("inputs", []):
        if inp["name"] == input_name:
            matched_input = inp
            break
    if matched_input is None:
        raise HTTPException(status_code=404, detail=f"Input '{input_name}' not found")

    from services.embedding_explorer import get_explorer_data
    return await get_explorer_data(
        input_name=input_name,
        input_description=matched_input.get("description", input_name),
        selected_hs_code=matched_input.get("hs_code", ""),
        session_data=data,
    )


@router.get("/api/demo-profiles")
async def get_demo_profiles():
    profiles = _load_demo_profiles()
    return {
        "profiles": [
            {"id": p["id"], "name": p["name"], "industry": p["industry"], "description": p["description"]}
            for p in profiles
        ]
    }
