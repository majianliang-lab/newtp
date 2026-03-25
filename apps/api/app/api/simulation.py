from fastapi import APIRouter, Depends, HTTPException
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.simulation import (
    SimulationActionExecuteRequest,
    SimulationActionExecutionRead,
    SimulationActionPlanRead,
    SimulationReplayRead,
)
from app.services.replay_scenarios import (
    build_smb_445_actions,
    build_smb_445_replay,
    execute_smb_445_action,
)

router = APIRouter(prefix="/simulation", tags=["simulation"])


@router.get("/replay/smb-445", response_model=SimulationReplayRead)
def get_smb_445_replay(db: Session = Depends(get_db)) -> SimulationReplayRead:
    return build_smb_445_replay(db)


@router.get("/actions/smb-445", response_model=SimulationActionPlanRead)
def get_smb_445_actions() -> SimulationActionPlanRead:
    return build_smb_445_actions()


@router.post("/actions/smb-445/execute", response_model=SimulationActionExecutionRead)
def post_smb_445_action_execution(
    payload: SimulationActionExecuteRequest,
) -> SimulationActionExecutionRead:
    try:
        return execute_smb_445_action(payload.action_id)
    except (ValidationError, ValueError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
