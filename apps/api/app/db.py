from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import StaticPool


class Base(DeclarativeBase):
    pass


engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Generator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    from app.models import (
        account,
        asset,
        control_point,
        device,
        exposure,
        flow,
        protection_object,
        security_domain,
    )

    Base.metadata.create_all(bind=engine)

    with SessionLocal() as session:
        # Touch all models so SQLAlchemy metadata is fully registered before create_all.
        _ = (
            account.Account,
            asset.Asset,
            control_point.ControlPoint,
            device.Device,
            exposure.Exposure,
            flow.Flow,
        )

        if not session.query(protection_object.ProtectionObject).count():
            session.add(
                protection_object.ProtectionObject(
                    id=1,
                    name="默认三级对象",
                    level="3",
                    owner_team="SOC",
                )
            )
        if not session.query(security_domain.SecurityDomain).count():
            session.add(
                security_domain.SecurityDomain(
                    id=1,
                    protection_object_id=1,
                    name="默认数据域",
                    domain_type="data",
                )
            )
        if not session.query(asset.Asset).count():
            session.add(
                asset.Asset(
                    id=1,
                    asset_name="SEED-ASSET-01",
                    asset_type="server",
                    protection_object_id=1,
                    security_domain_id=1,
                    value_level=5,
                )
            )
        if not session.query(device.Device).count():
            session.add(
                device.Device(
                    id=1,
                    device_name="SEED-FW-01",
                    vendor="Topsec",
                    os_type="NGTOS",
                    device_type="edge-fw",
                    management_ip="10.255.0.1",
                    security_domain_id=1,
                    log_ingest_status="connected",
                    policy_push_capability=True,
                )
            )
        session.commit()


def get_db_status() -> str:
    return "connected"
