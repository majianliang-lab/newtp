from dataclasses import dataclass
import ipaddress

from sim_core.models.device import VirtualDevice
from sim_core.traffic.scenarios import SimulatedFlow


@dataclass(slots=True)
class PolicyMatchResult:
    matched: bool
    policy_id: str
    action: str
    log_enabled: bool
    source_zone: str
    destination_zone: str


def evaluate_flow(device: VirtualDevice, flow: SimulatedFlow) -> PolicyMatchResult:
    source_zone = _resolve_zone(device, flow.source_ip)
    destination_zone = _resolve_zone(device, flow.destination_ip)

    for policy in device.policies:
        if policy.source_zone != source_zone or policy.destination_zone != destination_zone:
            continue

        if not _address_matches(device, policy.destination_address, flow.destination_ip):
            continue

        if not _service_matches(device, policy.services, flow.protocol, flow.port):
            continue

        return PolicyMatchResult(
            matched=True,
            policy_id=policy.policy_id,
            action=policy.action,
            log_enabled=policy.log_enabled,
            source_zone=source_zone,
            destination_zone=destination_zone,
        )

    return PolicyMatchResult(
        matched=False,
        policy_id="implicit-deny",
        action="deny",
        log_enabled=True,
        source_zone=source_zone,
        destination_zone=destination_zone,
    )


def _resolve_zone(device: VirtualDevice, ip: str) -> str:
    target_ip = ipaddress.ip_address(ip)

    for interface in device.interfaces:
        network = ipaddress.ip_interface(interface["ip"]).network
        if target_ip in network:
            return interface["zone"]

    return "unknown"


def _address_matches(device: VirtualDevice, policy_addresses: list[str], target_ip: str) -> bool:
    if not policy_addresses or "any" in policy_addresses:
        return True

    resolved_values = {
        address_object["name"]: address_object["value"]
        for address_object in device.address_objects
    }

    for address in policy_addresses:
        if address == target_ip:
            return True

        if resolved_values.get(address) == target_ip:
            return True

    return False


def _service_matches(
    device: VirtualDevice, policy_services: list[str], protocol: str, port: int
) -> bool:
    if not policy_services or "any" in policy_services:
        return True

    resolved_services = {
        service_object["name"]: service_object
        for service_object in device.service_objects
    }

    for service_name in policy_services:
        service = resolved_services.get(service_name)
        if not service:
            continue

        if service.get("protocol", "").lower() != protocol.lower():
            continue

        if str(service.get("destination_port")) == str(port):
            return True

    return False
