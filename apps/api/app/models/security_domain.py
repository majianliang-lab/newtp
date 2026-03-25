from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class SecurityDomain(Base):
    __tablename__ = "security_domains"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    protection_object_id: Mapped[int] = mapped_column(
        ForeignKey("protection_objects.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    domain_type: Mapped[str] = mapped_column(String(32), nullable=False)
