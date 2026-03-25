from fastapi import APIRouter, status

from app.schemas.collector import CollectorHeartbeatRequest, CollectorStatusRead
from app.services.collector_status_store import (
    get_collector_status,
    list_collector_statuses,
    update_collector_status,
)

router = APIRouter(prefix="/collector", tags=["collector"])


@router.post("/heartbeat", response_model=CollectorStatusRead, status_code=status.HTTP_201_CREATED)
def post_collector_heartbeat(payload: CollectorHeartbeatRequest) -> CollectorStatusRead:
    return update_collector_status(payload)


@router.get("/status", response_model=CollectorStatusRead | None)
def get_runtime_collector_status() -> CollectorStatusRead | None:
    return get_collector_status()


@router.get("/statuses", response_model=list[CollectorStatusRead])
def get_runtime_collector_statuses() -> list[CollectorStatusRead]:
    return list_collector_statuses()
