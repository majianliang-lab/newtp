from pydantic import BaseModel


class CollectorHeartbeatRequest(BaseModel):
    collector_id: str
    host: str
    port: int
    api_ingest_url: str
    heartbeat_interval_seconds: int


class CollectorStatusRead(CollectorHeartbeatRequest):
    online: bool
    last_seen_at: str
