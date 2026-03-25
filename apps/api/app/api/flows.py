from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.flow import Flow
from app.schemas.flow import FlowCreate, FlowRead

router = APIRouter(prefix="/flows", tags=["flows"])


@router.get("", response_model=list[FlowRead])
def list_flows(db: Session = Depends(get_db)) -> list[Flow]:
    return db.query(Flow).order_by(Flow.id).all()


@router.post("", response_model=FlowRead, status_code=status.HTTP_201_CREATED)
def create_flow(payload: FlowCreate, db: Session = Depends(get_db)) -> Flow:
    flow = Flow(**payload.model_dump())
    db.add(flow)
    db.commit()
    db.refresh(flow)
    return flow
