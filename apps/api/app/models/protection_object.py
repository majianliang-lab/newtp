from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class ProtectionObject(Base):
    __tablename__ = "protection_objects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    level: Mapped[str] = mapped_column(String(8), nullable=False)
    owner_team: Mapped[str] = mapped_column(String(128), nullable=False)
