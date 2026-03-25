from pydantic import BaseModel

from app.schemas.collector import CollectorStatusRead


class DashboardFocusRead(BaseModel):
    scenario_id: str
    title: str
    summary: str


class DashboardRecentChangeRead(BaseModel):
    record_id: str
    source: str
    title: str
    status: str
    related_href: str


class DashboardOverviewRead(BaseModel):
    high_value_asset_count: int
    exposure_count: int
    log_coverage_rate: int
    high_risk_event_count: int
    pending_change_count: int
    executed_change_count: int
    collector_total_count: int
    collector_online_count: int
    recent_changes: list[DashboardRecentChangeRead]
    collector_status: CollectorStatusRead | None
    collector_statuses: list[CollectorStatusRead]
    focus: DashboardFocusRead
