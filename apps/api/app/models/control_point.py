from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class ControlPoint(Base):
    __tablename__ = "control_points"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    device_id: Mapped[int] = mapped_column(ForeignKey("devices.id"), nullable=False)
    control_type: Mapped[str] = mapped_column(String(32), nullable=False)
    source_domain_id: Mapped[int] = mapped_column(
        ForeignKey("security_domains.id"), nullable=False
    )
    destination_domain_id: Mapped[int] = mapped_column(
        ForeignKey("security_domains.id"), nullable=False
    )
    supports_simulation: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    priority: Mapped[int] = mapped_column(Integer, nullable=False, default=100)
