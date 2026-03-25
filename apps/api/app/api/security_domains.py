from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.security_domain import SecurityDomain
from app.schemas.security_domain import SecurityDomainRead

router = APIRouter(prefix="/security-domains", tags=["security-domains"])


@router.get("", response_model=list[SecurityDomainRead])
def list_security_domains(db: Session = Depends(get_db)) -> list[SecurityDomain]:
    return db.query(SecurityDomain).order_by(SecurityDomain.id).all()
