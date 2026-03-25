import json
from pathlib import Path

from sim_core.models.device import SyslogSettings, VirtualDevice
from sim_core.models.policy import PolicyRule
from sim_core.models.route import RouteEntry


SEED_DIR = Path(__file__).resolve().parent / "seeds"


def load_device_seed(seed_name: str) -> VirtualDevice:
    seed_path = SEED_DIR / f"{seed_name}.json"
    payload = json.loads(seed_path.read_text(encoding="utf-8"))

    return VirtualDevice(
        device_id=payload["device_id"],
        device_name=payload["device_name"],
        vendor=payload["vendor"],
        device_type=payload["device_type"],
        os_type=payload["os_type"],
        management_ip=payload["management_ip"],
        interfaces=payload.get("interfaces", []),
        zones=payload.get("zones", []),
        address_objects=payload.get("address_objects", []),
        service_objects=payload.get("service_objects", []),
        policies=[
            PolicyRule(
                policy_id=policy["policy_id"],
                source_zone=policy["source_zone"],
                destination_zone=policy["destination_zone"],
                source_address=policy.get("source_address", []),
                destination_address=policy.get("destination_address", []),
                services=policy.get("services", []),
                action=policy.get("action", "permit"),
                log_enabled=policy.get("log_enabled", True),
            )
            for policy in payload.get("policies", [])
        ],
        routes=[
            RouteEntry(
                destination=route["destination"],
                next_hop=route["next_hop"],
                outbound_interface=route["outbound_interface"],
                admin_distance=route.get("admin_distance", 10),
            )
            for route in payload.get("routes", [])
        ],
        syslog=SyslogSettings(**payload["syslog"]),
    )
