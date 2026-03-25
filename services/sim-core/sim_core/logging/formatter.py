from sim_core.engine.policy_matcher import PolicyMatchResult
from sim_core.models.device import VirtualDevice
from sim_core.traffic.scenarios import SimulatedFlow


def format_hit_log(
    device: VirtualDevice, flow: SimulatedFlow, result: PolicyMatchResult
) -> str:
    return (
        f"<134>device={device.device_name} "
        f"vendor={device.vendor} "
        f"device_type={device.device_type} "
        f"os={device.os_type} "
        f"action={result.action} "
        f"policy={result.policy_id} "
        f"src={flow.source_ip} "
        f"dst={flow.destination_ip} "
        f"proto={flow.protocol} "
        f"dport={flow.port} "
        f"src_zone={result.source_zone} "
        f"dst_zone={result.destination_zone}"
    )


def format_policy_change_log(
    device: VirtualDevice,
    admin: str,
    change_type: str,
    policy_id: str,
    summary: str,
) -> str:
    return (
        f"<134>device={device.device_name} "
        f"vendor={device.vendor} "
        f"device_type={device.device_type} "
        f"os={device.os_type} "
        f"event=policy_change "
        f"admin={admin} "
        f"change_type={change_type} "
        f"policy={policy_id} "
        f"summary={summary.replace(' ', '_')}"
    )


def format_ips_alert_log(
    device: VirtualDevice,
    signature_id: str,
    severity: str,
    src_ip: str,
    dst_ip: str,
    dst_port: int,
) -> str:
    return (
        f"<134>device={device.device_name} "
        f"vendor={device.vendor} "
        f"device_type={device.device_type} "
        f"event=threat "
        f"threat_type=ips "
        f"signature_id={signature_id} "
        f"severity={severity} "
        f"src={src_ip} "
        f"dst={dst_ip} "
        f"dport={dst_port}"
    )


def format_antivirus_alert_log(
    device: VirtualDevice,
    malware_name: str,
    severity: str,
    host_ip: str,
    file_path: str,
) -> str:
    return (
        f"<134>device={device.device_name} "
        f"vendor={device.vendor} "
        f"device_type={device.device_type} "
        f"event=malware "
        f"engine=av "
        f"malware_name={malware_name} "
        f"severity={severity} "
        f"host_ip={host_ip} "
        f"file_path={file_path.replace(' ', '_')}"
    )
