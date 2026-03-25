from pydantic import BaseModel, ConfigDict


class ExposureCreate(BaseModel):
    public_ip: str
    open_port: int
    protocol: str
    backend_asset_id: int
    security_domain_id: int
    log_visibility_status: str


class ExposureRead(ExposureCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
