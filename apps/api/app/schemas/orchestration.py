from pydantic import BaseModel, Field

from app.schemas.simulation import ReplayEvidenceItem, SimulationActionRead, SimulationReplayRead


class ParsedIntentRead(BaseModel):
    action: str
    scope: str
    protocol: str
    port: int
    objective: str
    scenario: str


class OrchestrationSimulateRequest(BaseModel):
    prompt: str


class OrchestrationSubmitRequest(BaseModel):
    prompt: str


class ApprovalStateRead(BaseModel):
    status: str
    required_roles: list[str] = Field(default_factory=list)
    rationale: str
    risk_level: str = "medium"
    impact_summary: str = ""
    rollback_readiness: str = ""


class ExecutionPlanStepRead(BaseModel):
    step_id: str
    title: str
    owner: str
    status: str
    summary: str
    expected_outcome: str = ""


class FalsePositiveAssessmentRead(BaseModel):
    summary: str
    candidate_count: int = 0
    recommended_disposition: str


class ExceptionReasonRead(BaseModel):
    flow_id: str
    policy_id: str
    reason: str
    business_impact: str
    target_asset_node_id: str | None = None
    target_flow_node_id: str | None = None
    target_edge_id: str | None = None


class OrchestrationSimulationRead(BaseModel):
    intent: ParsedIntentRead
    replay: SimulationReplayRead
    recommended_actions: list[SimulationActionRead] = Field(default_factory=list)
    recommended_exceptions: list[ReplayEvidenceItem] = Field(default_factory=list)
    approval_state: ApprovalStateRead
    false_positive_assessment: FalsePositiveAssessmentRead
    false_positive_assessment_summary: str = ""
    exception_reasons: list[ExceptionReasonRead] = Field(default_factory=list)
    whitelist_preservation_reasons: list[ExceptionReasonRead] = Field(default_factory=list)
    approval_impact_summary: str = ""
    execution_impact_summary: str = ""
    explanation_chain: list[str] = Field(default_factory=list)
    execution_plan: list[ExecutionPlanStepRead] = Field(default_factory=list)
