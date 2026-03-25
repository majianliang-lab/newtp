from pydantic import BaseModel, Field


class ChangeRecordRead(BaseModel):
    record_id: str
    source: str
    title: str
    status: str
    approval_status: str
    summary: str
    target_devices: list[str] = Field(default_factory=list)
    target_entities: list[str] = Field(default_factory=list)
    execution_mode: str
    related_href: str
