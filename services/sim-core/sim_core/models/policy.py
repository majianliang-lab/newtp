from dataclasses import dataclass, field


@dataclass(slots=True)
class PolicyRule:
    policy_id: str
    source_zone: str
    destination_zone: str
    source_address: list[str] = field(default_factory=list)
    destination_address: list[str] = field(default_factory=list)
    services: list[str] = field(default_factory=list)
    action: str = "permit"
    log_enabled: bool = True
