from datetime import datetime, timedelta, timezone

from app.schemas.collector import CollectorHeartbeatRequest, CollectorStatusRead

_OFFLINE_THRESHOLD_SECONDS = 180
_statuses: dict[str, CollectorStatusRead] = {}


def update_collector_status(payload: CollectorHeartbeatRequest) -> CollectorStatusRead:
    status = CollectorStatusRead(
        **payload.model_dump(),
        online=True,
        last_seen_at=datetime.now(timezone.utc).isoformat(),
    )
    _statuses[payload.collector_id] = status
    return status.model_copy()


def get_collector_status() -> CollectorStatusRead | None:
    statuses = list_collector_statuses()

    if not statuses:
        return None

    return statuses[0]


def list_collector_statuses() -> list[CollectorStatusRead]:
    normalized = [_normalize_status(status) for status in _statuses.values()]
    return sorted(
        normalized,
        key=lambda status: datetime.fromisoformat(status.last_seen_at),
        reverse=True,
    )


def get_collector_counts() -> tuple[int, int]:
    statuses = list_collector_statuses()
    online_count = len([status for status in statuses if status.online])
    return len(statuses), online_count


def _normalize_status(status: CollectorStatusRead) -> CollectorStatusRead:
    last_seen = datetime.fromisoformat(status.last_seen_at)
    online = datetime.now(timezone.utc) - last_seen <= timedelta(
        seconds=_OFFLINE_THRESHOLD_SECONDS
    )
    return status.model_copy(update={"online": online})


def clear_collector_status() -> None:
    _statuses.clear()
