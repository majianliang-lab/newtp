from pydantic import BaseModel, Field


class ReplayStats(BaseModel):
    permit_count: int
    deny_count: int
    implicit_deny_count: int
    false_positive_candidates: int
    policy_change_count: int
    security_event_count: int


class ReplayImpactedAssetRef(BaseModel):
    label: str
    target_node_id: str | None = None


class ReplayEvidenceItem(BaseModel):
    flow_id: str
    destination_ip: str
    source_ip: str
    policy_id: str
    port: int
    target_asset_node_id: str | None = None
    target_flow_node_id: str | None = None
    target_edge_id: str | None = None


class ReplayEvidence(BaseModel):
    impacted_assets: list[str] = Field(default_factory=list)
    impacted_asset_refs: list[ReplayImpactedAssetRef] = Field(default_factory=list)
    whitelist_exception_hits: list[ReplayEvidenceItem] = Field(default_factory=list)
    false_positive_candidates: list[ReplayEvidenceItem] = Field(default_factory=list)
    ai_summary: str


class SimulationReplayRead(BaseModel):
    scenario_id: str
    title: str
    stats: ReplayStats
    evidence: ReplayEvidence
    events: list[dict[str, str | int]] = Field(default_factory=list)
    event_type_counts: dict[str, int] = Field(default_factory=dict)


class SimulationActionRead(BaseModel):
    action_id: str
    action_type: str
    title: str
    description: str
    target_devices: list[str] = Field(default_factory=list)
    target_entities: list[str] = Field(default_factory=list)
    execution_mode: str
    priority: str
    ngtos_intent: str
    rollback_hint: str


class SimulationActionPlanRead(BaseModel):
    scenario_id: str
    title: str
    actions: list[SimulationActionRead] = Field(default_factory=list)


class SimulationActionExecuteRequest(BaseModel):
    action_id: str


class SimulationActionExecutionRead(BaseModel):
    action_id: str
    status: str
    executed_device_count: int
    generated_event_types: list[str] = Field(default_factory=list)
    summary: str
