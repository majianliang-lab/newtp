from dataclasses import dataclass

from sim_core.execution.change_executor import simulate_policy_change
from sim_core.execution.scenario_executor import ExecutionBatch, execute_flows
from sim_core.logging.formatter import (
    format_antivirus_alert_log,
    format_ips_alert_log,
)
from sim_core.models.device import VirtualDevice
from sim_core.traffic.scenarios import SimulatedFlow


@dataclass(slots=True)
class ReplayWindow:
    execution: ExecutionBatch
    syslog_messages: list[str]
    stats: dict[str, int]
    evidence: dict[str, object]


def replay_smb_containment_window(
    ngfw_device: VirtualDevice,
    baseline_flows: list[SimulatedFlow],
    attack_flows: list[SimulatedFlow],
    ips_device: VirtualDevice | None = None,
    av_device: VirtualDevice | None = None,
) -> ReplayWindow:
    execution = execute_flows(ngfw_device, [*baseline_flows, *attack_flows])
    syslog_messages = [record.syslog_message for record in execution.records]

    change_record = simulate_policy_change(
        device=ngfw_device,
        admin="soc_admin",
        change_type="policy_insert",
        policy_id="deny-eastwest-445",
        summary="block tcp 445 east-west",
    )
    syslog_messages.append(change_record.syslog_message)

    if attack_flows and ips_device:
        first_attack = attack_flows[0]
        syslog_messages.append(
            format_ips_alert_log(
                device=ips_device,
                signature_id="IPS-445-001",
                severity="critical",
                src_ip=first_attack.source_ip,
                dst_ip=first_attack.destination_ip,
                dst_port=first_attack.port,
            )
        )

    if attack_flows and av_device:
        first_attack = attack_flows[0]
        syslog_messages.append(
            format_antivirus_alert_log(
                device=av_device,
                malware_name="WannaLike.Test",
                severity="high",
                host_ip=first_attack.destination_ip,
                file_path="C:/Windows/temp/sample.exe",
            )
        )

    permit_count = sum(1 for record in execution.records if record.result.action == "permit")
    deny_count = sum(1 for record in execution.records if record.result.action == "deny")
    implicit_deny_count = sum(
        1 for record in execution.records if record.result.policy_id == "implicit-deny"
    )
    false_positive_candidates = sum(
        1
        for record in execution.records
        if record.flow.direction == "business" and record.result.action == "deny"
    )

    impacted_assets = list(
        dict.fromkeys(record.flow.destination_ip for record in execution.records)
    )
    whitelist_exception_hits = [
        {
            "flow_id": record.flow.flow_id,
            "policy_id": record.result.policy_id,
            "destination_ip": record.flow.destination_ip,
            "source_ip": record.flow.source_ip,
            "port": record.flow.port,
        }
        for record in execution.records
        if record.flow.direction == "business" and record.result.action == "permit"
    ]
    false_positive_details = [
        {
            "flow_id": record.flow.flow_id,
            "destination_ip": record.flow.destination_ip,
            "source_ip": record.flow.source_ip,
            "policy_id": record.result.policy_id,
            "port": record.flow.port,
        }
        for record in execution.records
        if record.flow.direction == "business" and record.result.action == "deny"
    ]
    ai_summary = (
        f"窗口内共回放 {len(execution.records)} 条流量，"
        f"允许 {permit_count} 条，阻断 {deny_count} 条，"
        f"误杀候选 {false_positive_candidates} 条。"
    )

    return ReplayWindow(
        execution=execution,
        syslog_messages=syslog_messages,
        stats={
            "permit_count": permit_count,
            "deny_count": deny_count,
            "implicit_deny_count": implicit_deny_count,
            "false_positive_candidates": false_positive_candidates,
            "policy_change_count": 1,
            "security_event_count": len(syslog_messages) - len(execution.records) - 1,
        },
        evidence={
            "impacted_assets": impacted_assets,
            "whitelist_exception_hits": whitelist_exception_hits,
            "false_positive_candidates": false_positive_details,
            "ai_summary": ai_summary,
        },
    )
