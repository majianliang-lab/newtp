from pydantic import BaseModel


class EventIngestRequest(BaseModel):
    event_type: str
    vendor: str | None = None
    device_id: str
    device_type: str | None = None
    os_type: str | None = None
    action: str | None = None
    policy_id: str | None = None
    source_ip: str | None = None
    destination_ip: str | None = None
    host_ip: str | None = None
    protocol: str | None = None
    destination_port: int | None = None
    source_zone: str | None = None
    destination_zone: str | None = None
    severity: str | int | None = None
    target_asset_node_id: str | None = None
    target_flow_node_id: str | None = None
    target_edge_id: str | None = None


class EventRead(EventIngestRequest):
    pass
