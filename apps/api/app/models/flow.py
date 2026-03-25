from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Flow(Base):
    __tablename__ = "flows"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source_asset_id: Mapped[int] = mapped_column(ForeignKey("assets.id"), nullable=False)
    source_domain_id: Mapped[int] = mapped_column(
        ForeignKey("security_domains.id"), nullable=False
    )
    destination_asset_id: Mapped[int] = mapped_column(
        ForeignKey("assets.id"), nullable=False
    )
    destination_domain_id: Mapped[int] = mapped_column(
        ForeignKey("security_domains.id"), nullable=False
    )
    protocol: Mapped[str] = mapped_column(String(16), nullable=False)
    port: Mapped[int] = mapped_column(Integer, nullable=False)
    flow_type: Mapped[str] = mapped_column(String(32), nullable=False)
