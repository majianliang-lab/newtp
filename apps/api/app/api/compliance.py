from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.account import Account
from app.models.asset import Asset
from app.models.control_point import ControlPoint
from app.models.device import Device
from app.models.exposure import Exposure
from app.models.flow import Flow
from app.models.protection_object import ProtectionObject
from app.models.security_domain import SecurityDomain
from app.schemas.compliance import ComplianceReportRead, ComplianceReportSectionRead

router = APIRouter(prefix="/compliance", tags=["compliance"])


@router.get("/report", response_model=ComplianceReportRead)
def get_compliance_report(db: Session = Depends(get_db)) -> ComplianceReportRead:
    protection_objects = db.query(ProtectionObject).order_by(ProtectionObject.id.asc()).all()
    security_domains = db.query(SecurityDomain).order_by(SecurityDomain.id.asc()).all()
    assets = db.query(Asset).order_by(Asset.id.asc()).all()
    exposures = db.query(Exposure).order_by(Exposure.id.asc()).all()
    accounts = db.query(Account).order_by(Account.id.asc()).all()
    flows = db.query(Flow).order_by(Flow.id.asc()).all()
    devices = db.query(Device).order_by(Device.id.asc()).all()
    control_points = db.query(ControlPoint).order_by(ControlPoint.id.asc()).all()

    sections = [
        build_section(
            section_id="protection-objects",
            title="保护对象",
            items=protection_objects,
            workspace_href="/compliance",
            formatter=lambda item: str(item.name),
        ),
        build_section(
            section_id="security-domains",
            title="安全域",
            items=security_domains,
            workspace_href="/topology?view=domain-view",
            formatter=lambda item: str(item.name),
        ),
        build_section(
            section_id="assets",
            title="高价值资产",
            items=assets,
            workspace_href="/business",
            formatter=lambda item: str(item.asset_name),
        ),
        build_section(
            section_id="exposures",
            title="互联网暴露面",
            items=exposures,
            workspace_href="/business",
            formatter=lambda item: f"{item.public_ip}:{item.open_port}",
        ),
        build_section(
            section_id="accounts",
            title="账号权限矩阵",
            items=accounts,
            workspace_href="/business",
            formatter=lambda item: str(item.account_name),
        ),
        build_section(
            section_id="flows",
            title="核心业务流向",
            items=flows,
            workspace_href="/topology?view=flow-view",
            formatter=lambda item: f"{item.protocol}/{item.port} {item.flow_type}",
        ),
        build_section(
            section_id="devices",
            title="安全设备",
            items=devices,
            workspace_href="/strategy",
            formatter=lambda item: str(item.device_name),
        ),
        build_section(
            section_id="control-points",
            title="控制点",
            items=control_points,
            workspace_href="/strategy",
            formatter=lambda item: f"{item.control_type} priority {item.priority}",
        ),
    ]
    ready_sections = len([section for section in sections if section.count > 0])
    filing_readiness = round((ready_sections / len(sections)) * 100)

    return ComplianceReportRead(
        generated_at=datetime.now(timezone.utc).isoformat(),
        filing_readiness=filing_readiness,
        summary=(
            f"备案对象共 {len(sections)} 类，当前已有 {ready_sections} 类完成基础录入，"
            "可继续进入业务、策略和拓扑工作面做核验与处置。"
        ),
        sections=sections,
    )


def build_section(section_id: str, title: str, items: list[object], workspace_href: str, formatter) -> ComplianceReportSectionRead:
    return ComplianceReportSectionRead(
        section_id=section_id,
        title=title,
        count=len(items),
        status="ready" if items else "missing",
        workspace_href=workspace_href,
        sample_items=[formatter(item) for item in items[:3]],
    )
