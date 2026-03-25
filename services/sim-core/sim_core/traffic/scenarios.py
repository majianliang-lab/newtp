from dataclasses import dataclass


@dataclass(slots=True)
class SimulatedFlow:
    flow_id: str
    source_ip: str
    destination_ip: str
    protocol: str
    port: int
    flow_type: str
    direction: str
    packets_per_second: int
