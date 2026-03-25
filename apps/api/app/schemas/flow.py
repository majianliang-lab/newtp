from pydantic import BaseModel, ConfigDict


class FlowCreate(BaseModel):
    source_asset_id: int
    source_domain_id: int
    destination_asset_id: int
    destination_domain_id: int
    protocol: str
    port: int
    flow_type: str


class FlowRead(FlowCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
