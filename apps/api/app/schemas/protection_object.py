from pydantic import BaseModel, ConfigDict


class ProtectionObjectRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    level: str
    owner_team: str
