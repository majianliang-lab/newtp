from fastapi import APIRouter, HTTPException, status

from app.schemas.change_record import ChangeRecordRead
from app.services.change_record_store import approve_change_record, list_change_records

router = APIRouter(prefix="/change-records", tags=["change-records"])


@router.get("", response_model=list[ChangeRecordRead])
def get_change_records() -> list[ChangeRecordRead]:
    return list_change_records()


@router.post("/{record_id}/approve", response_model=ChangeRecordRead)
def post_change_record_approval(record_id: str) -> ChangeRecordRead:
    try:
        return approve_change_record(record_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
