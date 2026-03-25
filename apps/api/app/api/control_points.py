from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.control_point import ControlPoint
from app.schemas.control_point import ControlPointCreate, ControlPointRead

router = APIRouter(prefix="/control-points", tags=["control-points"])


@router.get("", response_model=list[ControlPointRead])
def list_control_points(db: Session = Depends(get_db)) -> list[ControlPoint]:
    return db.query(ControlPoint).order_by(ControlPoint.id).all()


@router.post("", response_model=ControlPointRead, status_code=status.HTTP_201_CREATED)
def create_control_point(
    payload: ControlPointCreate, db: Session = Depends(get_db)
) -> ControlPoint:
    control_point = ControlPoint(**payload.model_dump())
    db.add(control_point)
    db.commit()
    db.refresh(control_point)
    return control_point
