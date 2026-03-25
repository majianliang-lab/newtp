from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.asset import Asset
from app.models.device import Device
from app.models.exposure import Exposure
from app.services.collector_status_store import (
    get_collector_counts,
    get_collector_status,
    list_collector_statuses,
)
from app.schemas.dashboard import (
    DashboardFocusRead,
    DashboardOverviewRead,
    DashboardRecentChangeRead,
)
from app.services.change_record_store import list_change_records
from app.services.event_store import list_live_events
from app.services.replay_scenarios import build_smb_445_replay

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/overview", response_model=DashboardOverviewRead)
def get_dashboard_overview(db: Session = Depends(get_db)) -> DashboardOverviewRead:
    assets = db.query(Asset).all()
    exposures = db.query(Exposure).all()
    devices = db.query(Device).all()
    live_events = list_live_events()
    replay = build_smb_445_replay(db)
    change_records = list_change_records()
    collector_status = get_collector_status()
    collector_statuses = list_collector_statuses()
    collector_total_count, collector_online_count = get_collector_counts()

    connected_device_count = len(
        [device for device in devices if device.log_ingest_status == "connected"]
    )
    log_coverage_rate = (
        round((connected_device_count / len(devices)) * 100) if devices else 0
    )
    high_risk_event_count = len(
        [
            event
            for event in live_events
            if str(event.severity).lower() in {"high", "critical", "4", "5"}
        ]
    )
    pending_change_count = len(
        [record for record in change_records if record.status == "pending_approval"]
    )
    executed_change_count = len(
        [record for record in change_records if record.status == "executed"]
    )

    return DashboardOverviewRead(
        high_value_asset_count=len(
            [asset for asset in assets if asset.value_level >= 4]
        ),
        exposure_count=len(exposures),
        log_coverage_rate=log_coverage_rate,
        high_risk_event_count=high_risk_event_count,
        pending_change_count=pending_change_count,
        executed_change_count=executed_change_count,
        collector_total_count=collector_total_count,
        collector_online_count=collector_online_count,
        collector_statuses=collector_statuses,
        recent_changes=[
            DashboardRecentChangeRead(
                record_id=record.record_id,
                source=record.source,
                title=record.title,
                status=record.status,
                related_href=record.related_href,
            )
            for record in change_records[:4]
        ],
        collector_status=collector_status,
        focus=DashboardFocusRead(
            scenario_id=replay.scenario_id,
            title=replay.title,
            summary=replay.evidence.ai_summary,
        ),
    )
