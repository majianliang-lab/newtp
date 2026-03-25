from dataclasses import dataclass

from sim_core.logging.formatter import format_policy_change_log
from sim_core.models.device import VirtualDevice


@dataclass(slots=True)
class PolicyChangeRecord:
    device_id: str
    admin: str
    change_type: str
    policy_id: str
    summary: str
    syslog_message: str


def simulate_policy_change(
    device: VirtualDevice,
    admin: str,
    change_type: str,
    policy_id: str,
    summary: str,
) -> PolicyChangeRecord:
    return PolicyChangeRecord(
        device_id=device.device_id,
        admin=admin,
        change_type=change_type,
        policy_id=policy_id,
        summary=summary,
        syslog_message=format_policy_change_log(
            device=device,
            admin=admin,
            change_type=change_type,
            policy_id=policy_id,
            summary=summary,
        ),
    )
