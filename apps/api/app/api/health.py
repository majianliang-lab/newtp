from fastapi import APIRouter

from app.db import get_db_status

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "db": get_db_status()}
