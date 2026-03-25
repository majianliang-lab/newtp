from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Exposure(Base):
    __tablename__ = "exposures"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    public_ip: Mapped[str] = mapped_column(String(64), nullable=False)
    open_port: Mapped[int] = mapped_column(Integer, nullable=False)
    protocol: Mapped[str] = mapped_column(String(16), nullable=False)
    backend_asset_id: Mapped[int] = mapped_column(ForeignKey("assets.id"), nullable=False)
    security_domain_id: Mapped[int] = mapped_column(
        ForeignKey("security_domains.id"), nullable=False
    )
    log_visibility_status: Mapped[str] = mapped_column(String(32), nullable=False)
