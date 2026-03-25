from pydantic import BaseModel, ConfigDict


class DeviceCreate(BaseModel):
    device_name: str
    vendor: str
    os_type: str
    device_type: str
    management_ip: str
    security_domain_id: int
    log_ingest_status: str
    policy_push_capability: bool


class DeviceRead(DeviceCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
