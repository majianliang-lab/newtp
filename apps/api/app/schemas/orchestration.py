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


class ExecutionPlanStepRead(BaseModel):
    step_id: str
    title: str
    owner: str
    status: str
    summary: str


class OrchestrationSimulationRead(BaseModel):
    intent: ParsedIntentRead
    replay: SimulationReplayRead
    recommended_actions: list[SimulationActionRead] = Field(default_factory=list)
    recommended_exceptions: list[ReplayEvidenceItem] = Field(default_factory=list)
    approval_state: ApprovalStateRead
    explanation_chain: list[str] = Field(default_factory=list)
    execution_plan: list[ExecutionPlanStepRead] = Field(default_factory=list)
