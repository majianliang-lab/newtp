from dataclasses import dataclass


@dataclass(slots=True)
class RouteEntry:
    destination: str
    next_hop: str
    outbound_interface: str
    admin_distance: int = 10
