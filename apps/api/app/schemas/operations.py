from pydantic import BaseModel, Field

from app.schemas.collector import CollectorStatusRead
from app.schemas.dashboard import DashboardRecentChangeRead


class OperationsDeviceRead(BaseModel):
    id: int
    device_name: str
    vendor: str
    device_type: str
    log_ingest_status: str
    policy_push_capability: bool


class OperationsEventRead(BaseModel):
    id: int
    event_type: str
    severity: str | int | None = None
    destination_ip: str | None = None


class OperationsDiagnosticTargetRead(BaseModel):
    label: str
    href: str


class OperationsDiagnosticRead(BaseModel):
    category: str
    title: str
    summary: str
    priority: int
    priority_label: str
    impact_count: int
    scope_label: str
    action_label: str
    action_href: str
    targets: list[OperationsDiagnosticTargetRead] = Field(default_factory=list)


class OperationsDiagnosticGroupRead(BaseModel):
    category: str
    title: str
    priority: int
    priority_label: str
    items: list[OperationsDiagnosticRead]


class OperationsOverviewRead(BaseModel):
    collector_total_count: int
    collector_online_count: int
    device_total_count: int
    connected_device_count: int
    disconnected_device_count: int
    log_coverage_rate: int
    collector_coverage_rate: int
    live_event_count: int
    high_risk_event_count: int
    pending_change_count: int
    collector_statuses: list[CollectorStatusRead]
    disconnected_devices: list[OperationsDeviceRead]
    recent_events: list[OperationsEventRead]
    recent_changes: list[DashboardRecentChangeRead]
    diagnostics: list[OperationsDiagnosticRead]
    diagnostic_groups: list[OperationsDiagnosticGroupRead]
    recommended_actions: list[OperationsDiagnosticRead]
