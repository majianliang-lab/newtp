from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.change_record import ChangeRecordRead
from app.schemas.orchestration import (
    OrchestrationSimulateRequest,
    OrchestrationSimulationRead,
    OrchestrationSubmitRequest,
)
from app.services.ai_orchestrator import orchestrate_prompt
from app.services.change_record_store import create_change_record

router = APIRouter(prefix="/orchestration", tags=["orchestration"])


@router.post("/simulate", response_model=OrchestrationSimulationRead)
def simulate_orchestration(
    payload: OrchestrationSimulateRequest,
    db: Session = Depends(get_db),
) -> OrchestrationSimulationRead:
    try:
        return orchestrate_prompt(payload.prompt, db)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("/submit", response_model=ChangeRecordRead, status_code=201)
def submit_orchestration(
    payload: OrchestrationSubmitRequest,
    db: Session = Depends(get_db),
) -> ChangeRecordRead:
    try:
        result = orchestrate_prompt(payload.prompt, db)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    primary_action = (
        result.recommended_actions[0]
        if result.recommended_actions
        else None
    )
    roles = " 和 ".join(result.approval_state.required_roles)

    return create_change_record(
        source="orchestration",
        title=primary_action.title if primary_action else result.replay.title,
        status=result.approval_state.status,
        approval_status=result.approval_state.status,
        summary=f"已提交审批，等待 {roles} 确认。",
        target_devices=primary_action.target_devices if primary_action else [],
        target_entities=primary_action.target_entities if primary_action else [],
        execution_mode=primary_action.execution_mode if primary_action else "planned",
        related_href="/strategy",
    )
