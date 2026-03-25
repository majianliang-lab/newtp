from pydantic import BaseModel, Field


class ComplianceReportSectionRead(BaseModel):
    section_id: str
    title: str
    count: int
    status: str
    workspace_href: str
    sample_items: list[str] = Field(default_factory=list)


class ComplianceReportRead(BaseModel):
    generated_at: str
    filing_readiness: int
    summary: str
    sections: list[ComplianceReportSectionRead]
