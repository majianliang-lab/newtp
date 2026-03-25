from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.exposure import Exposure
from app.schemas.exposure import ExposureCreate, ExposureRead

router = APIRouter(prefix="/exposures", tags=["exposures"])


@router.get("", response_model=list[ExposureRead])
def list_exposures(db: Session = Depends(get_db)) -> list[Exposure]:
    return db.query(Exposure).order_by(Exposure.id).all()


@router.post("", response_model=ExposureRead, status_code=status.HTTP_201_CREATED)
def create_exposure(payload: ExposureCreate, db: Session = Depends(get_db)) -> Exposure:
    exposure = Exposure(**payload.model_dump())
    db.add(exposure)
    db.commit()
    db.refresh(exposure)
    return exposure
