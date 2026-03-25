from dataclasses import dataclass, field

from sim_core.models.policy import PolicyRule
from sim_core.models.route import RouteEntry


@dataclass(slots=True)
class SyslogSettings:
    server: str
    port: int
    protocol: str
    enabled: bool


@dataclass(slots=True)
class VirtualDevice:
    device_id: str
    device_name: str
    vendor: str
    device_type: str
    os_type: str
    management_ip: str
    interfaces: list[dict] = field(default_factory=list)
    zones: list[dict] = field(default_factory=list)
    address_objects: list[dict] = field(default_factory=list)
    service_objects: list[dict] = field(default_factory=list)
    policies: list[PolicyRule] = field(default_factory=list)
    routes: list[RouteEntry] = field(default_factory=list)
    syslog: SyslogSettings | None = None
