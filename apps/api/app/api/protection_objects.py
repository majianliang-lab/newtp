from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.protection_object import ProtectionObject
from app.schemas.protection_object import ProtectionObjectRead

router = APIRouter(prefix="/protection-objects", tags=["protection-objects"])


@router.get("", response_model=list[ProtectionObjectRead])
def list_protection_objects(
    db: Session = Depends(get_db),
) -> list[ProtectionObject]:
    return db.query(ProtectionObject).order_by(ProtectionObject.id).all()
