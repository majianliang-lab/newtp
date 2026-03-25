from pydantic import BaseModel, ConfigDict


class AssetCreate(BaseModel):
    asset_name: str
    asset_type: str
    protection_object_id: int
    security_domain_id: int
    value_level: int


class AssetRead(AssetCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
