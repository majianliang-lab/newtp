from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Device(Base):
    __tablename__ = "devices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    device_name: Mapped[str] = mapped_column(String(128), nullable=False)
    vendor: Mapped[str] = mapped_column(String(32), nullable=False)
    os_type: Mapped[str] = mapped_column(String(32), nullable=False)
    device_type: Mapped[str] = mapped_column(String(32), nullable=False)
    management_ip: Mapped[str] = mapped_column(String(64), nullable=False)
    security_domain_id: Mapped[int] = mapped_column(
        ForeignKey("security_domains.id"), nullable=False
    )
    log_ingest_status: Mapped[str] = mapped_column(String(32), nullable=False)
    policy_push_capability: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
