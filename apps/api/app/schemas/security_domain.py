from pydantic import BaseModel, ConfigDict


class SecurityDomainRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    protection_object_id: int
    name: str
    domain_type: str
