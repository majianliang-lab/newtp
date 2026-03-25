from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.operations import OperationsOverviewRead
from app.services.operations_overview import build_operations_overview

router = APIRouter(prefix="/operations", tags=["operations"])


@router.get("/overview", response_model=OperationsOverviewRead)
def get_operations_overview(db: Session = Depends(get_db)) -> OperationsOverviewRead:
    return build_operations_overview(db)
