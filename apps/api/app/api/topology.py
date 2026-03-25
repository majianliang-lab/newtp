from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.asset import Asset
from app.models.flow import Flow
from app.models.security_domain import SecurityDomain
from app.services.topology_projection import (
    build_asset_topology,
    build_domain_topology,
    build_flow_topology,
)

router = APIRouter(prefix="/topology", tags=["topology"])


@router.get("/domain-view")
def get_domain_view(db: Session = Depends(get_db)) -> dict[str, list[dict]]:
    domains = _load_domains(db)
    assets = _load_assets(db)
    flows = _load_flows(db, domains, assets)

    return build_domain_topology(domains=domains, assets=assets, flows=flows)


@router.get("/asset-view")
def get_asset_view(db: Session = Depends(get_db)) -> dict[str, list[dict]]:
    assets = _load_assets(db)
    domains = _load_domains(db)
    flows = _load_flows(db, domains, assets)

    return build_asset_topology(assets=assets, flows=flows)


@router.get("/flow-view")
def get_flow_view(db: Session = Depends(get_db)) -> dict[str, list[dict]]:
    domains = _load_domains(db)
    assets = _load_assets(db)
    flows = _load_flows(db, domains, assets)

    return build_flow_topology(flows=flows)


def _load_domains(db: Session) -> list[dict]:
    return [
        {"id": domain.id, "name": domain.name}
        for domain in db.query(SecurityDomain).order_by(SecurityDomain.id).all()
    ]


def _load_assets(db: Session) -> list[dict]:
    return [
        {
            "id": asset.id,
            "asset_name": asset.asset_name,
            "security_domain_id": asset.security_domain_id,
            "value_level": asset.value_level,
        }
        for asset in db.query(Asset).order_by(Asset.id).all()
    ]


def _load_flows(db: Session, domains: list[dict], assets: list[dict]) -> list[dict]:
    domain_name_by_id = {domain["id"]: domain["name"] for domain in domains}
    asset_name_by_id = {asset["id"]: asset["asset_name"] for asset in assets}

    return [
        {
            "id": flow.id,
            "source_domain_id": flow.source_domain_id,
            "destination_domain_id": flow.destination_domain_id,
            "source_domain_name": domain_name_by_id.get(
                flow.source_domain_id, f"domain-{flow.source_domain_id}"
            ),
            "destination_domain_name": domain_name_by_id.get(
                flow.destination_domain_id, f"domain-{flow.destination_domain_id}"
            ),
            "source_asset_id": flow.source_asset_id,
            "destination_asset_id": flow.destination_asset_id,
            "source_asset_label": asset_name_by_id.get(
                flow.source_asset_id, f"asset-{flow.source_asset_id}"
            ),
            "destination_asset_label": asset_name_by_id.get(
                flow.destination_asset_id, f"asset-{flow.destination_asset_id}"
            ),
            "protocol": flow.protocol,
            "port": flow.port,
            "flow_type": flow.flow_type,
        }
        for flow in db.query(Flow).order_by(Flow.id).all()
    ]
