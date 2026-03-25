from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    asset_name: Mapped[str] = mapped_column(String(128), nullable=False)
    asset_type: Mapped[str] = mapped_column(String(64), nullable=False)
    protection_object_id: Mapped[int] = mapped_column(
        ForeignKey("protection_objects.id"), nullable=False
    )
    security_domain_id: Mapped[int] = mapped_column(
        ForeignKey("security_domains.id"), nullable=False
    )
    value_level: Mapped[int] = mapped_column(Integer, nullable=False)
