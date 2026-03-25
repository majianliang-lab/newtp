from pydantic import BaseModel, ConfigDict


class AccountCreate(BaseModel):
    account_name: str
    account_type: str
    permission_level: str
    via_bastion: bool
    mfa_enabled: bool


class AccountRead(AccountCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
