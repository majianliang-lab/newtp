from collections import deque

from app.schemas.event_stream import EventIngestRequest, EventRead

_MAX_EVENTS = 200
_EVENTS: deque[EventRead] = deque(maxlen=_MAX_EVENTS)


def ingest_event(payload: EventIngestRequest) -> EventRead:
    event = EventRead(**payload.model_dump())
    _EVENTS.appendleft(event)
    return event


def list_live_events() -> list[EventRead]:
    return list(_EVENTS)


def clear_live_events() -> None:
    _EVENTS.clear()
