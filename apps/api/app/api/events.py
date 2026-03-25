from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.asset import Asset
from app.models.flow import Flow
from app.schemas.event_stream import EventIngestRequest, EventRead
from app.services.event_store import ingest_event, list_live_events

router = APIRouter(prefix="/events", tags=["events"])


@router.post("/ingest", response_model=EventRead, status_code=status.HTTP_201_CREATED)
def create_live_event(
    payload: EventIngestRequest, db: Session = Depends(get_db)
) -> EventRead:
    return annotate_event(ingest_event(payload), build_annotation_context(db))


@router.get("/live", response_model=list[EventRead])
def get_live_events(db: Session = Depends(get_db)) -> list[EventRead]:
    context = build_annotation_context(db)
    return [annotate_event(event, context) for event in list_live_events()]


def annotate_event(
    event: EventRead, context: tuple[dict[str, str], dict[tuple[str, int, str], tuple[str, str]]]
) -> EventRead:
    asset_node_id_by_label, flow_target_ids_by_signature = context
    target_label = event.destination_ip or event.host_ip
    protocol = event.protocol or "tcp"
    port = event.destination_port

    target_asset_node_id = event.target_asset_node_id
    target_flow_node_id = event.target_flow_node_id
    target_edge_id = event.target_edge_id

    if target_label and not target_asset_node_id:
        target_asset_node_id = asset_node_id_by_label.get(target_label)

    if target_label and port and (not target_flow_node_id or not target_edge_id):
        flow_target_ids = flow_target_ids_by_signature.get((protocol, port, target_label))
        if flow_target_ids is not None:
            if not target_flow_node_id:
                target_flow_node_id = flow_target_ids[0]
            if not target_edge_id:
                target_edge_id = flow_target_ids[1]

    return event.model_copy(
        update={
            "target_asset_node_id": target_asset_node_id,
            "target_flow_node_id": target_flow_node_id,
            "target_edge_id": target_edge_id,
        }
    )


def build_annotation_context(
    db: Session,
) -> tuple[dict[str, str], dict[tuple[str, int, str], tuple[str, str]]]:
    assets = db.query(Asset).order_by(Asset.id.asc()).all()
    asset_node_id_by_label = {asset.asset_name: f"asset-{asset.id}" for asset in assets}
    asset_label_by_id = {asset.id: asset.asset_name for asset in assets}

    flow_target_ids_by_signature = {
        (flow.protocol, flow.port, asset_label_by_id.get(flow.destination_asset_id, "")): (
            f"flow-node-{flow.id}",
            f"flow-{flow.id}",
        )
        for flow in db.query(Flow).order_by(Flow.id.asc()).all()
        if asset_label_by_id.get(flow.destination_asset_id, "")
    }

    return asset_node_id_by_label, flow_target_ids_by_signature
