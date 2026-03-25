from pydantic import BaseModel, ConfigDict


class ControlPointCreate(BaseModel):
    device_id: int
    control_type: str
    source_domain_id: int
    destination_domain_id: int
    supports_simulation: bool
    priority: int


class ControlPointRead(ControlPointCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
