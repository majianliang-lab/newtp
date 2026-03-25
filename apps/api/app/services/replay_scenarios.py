from collections import Counter
from pathlib import Path
import sys

from sqlalchemy.orm import Session

from app.models.asset import Asset
from app.models.flow import Flow
from app.schemas.simulation import (
    ReplayEvidence,
    ReplayEvidenceItem,
    ReplayImpactedAssetRef,
    SimulationActionPlanRead,
    SimulationActionExecutionRead,
    SimulationActionRead,
    SimulationReplayRead,
)
from app.services.change_record_store import create_change_record


def _ensure_local_service_paths() -> Path:
    repo_root = Path(__file__).resolve().parents[4]
    service_roots = (
        repo_root / "services" / "sim-core",
        repo_root / "services" / "syslog-collector",
    )

    for service_root in service_roots:
        service_root_str = str(service_root)
        if service_root_str not in sys.path:
            sys.path.append(service_root_str)

    return repo_root


REPO_ROOT = _ensure_local_service_paths()

from sim_core.execution.replay_engine import replay_smb_containment_window
from sim_core.repository import load_device_seed
from sim_core.traffic.generator import (
    generate_baseline_flows,
    generate_scan_flows,
    load_flow_seed,
)
from syslog_collector.normalizer import normalize_event
from syslog_collector.parser import parse_message


def build_smb_445_replay(db: Session | None = None) -> SimulationReplayRead:
    ngfw = load_device_seed("topsec_branch_fw")
    ips = load_device_seed("topsec_hq_ips")
    av = load_device_seed("topsec_dc_av")

    baseline_seed = load_flow_seed(REPO_ROOT / "seed-data" / "traffic" / "baseline_flows.json")
    baseline_flows = generate_baseline_flows(baseline_seed)
    attack_flows = generate_scan_flows(
        source_ip="10.10.32.45",
        target_ips=["10.20.1.10", "10.20.30.15", "10.20.99.45"],
        port=445,
    )

    replay = replay_smb_containment_window(
        ngfw_device=ngfw,
        baseline_flows=baseline_flows,
        attack_flows=attack_flows,
        ips_device=ips,
        av_device=av,
    )

    events = [normalize_event(parse_message(message)) for message in replay.syslog_messages]
    event_type_counts = dict(Counter(str(event["event_type"]) for event in events))

    replay_read = SimulationReplayRead(
        scenario_id="smb-445-containment",
        title="445 护网应急推演",
        stats=replay.stats,
        evidence=replay.evidence,
        events=events,
        event_type_counts=event_type_counts,
    )

    if db is not None:
        return annotate_replay_with_target_refs(replay_read, db)

    return replay_read


def build_smb_445_actions() -> SimulationActionPlanRead:
    replay = build_smb_445_replay()
    impacted_assets = replay.evidence.impacted_assets
    suspicious_host = "10.10.32.45"

    return SimulationActionPlanRead(
        scenario_id=replay.scenario_id,
        title="445 护网处置建议",
        actions=[
            SimulationActionRead(
                action_id="action-blacklist-block-01",
                action_type="blacklist_block",
                title="批量下发 445 黑名单阻断",
                description="在办公域与服务器域边界设备上批量阻断 SMB 横向流量，并保留白名单例外。",
                target_devices=["fw-hq-core-01", "fw-branch-01"],
                target_entities=[suspicious_host, *impacted_assets],
                execution_mode="planned",
                priority="critical",
                ngtos_intent=(
                    "object-group address smb_emergency_blocklist\n"
                    f" network-object {suspicious_host}\n"
                    " policy interzone deny_smb_blocklist"
                ),
                rollback_hint="删除地址组 smb_emergency_blocklist 并回退 deny_smb_blocklist 策略。",
            ),
            SimulationActionRead(
                action_id="action-host-isolation-01",
                action_type="host_isolation",
                title=f"隔离感染主机 {suspicious_host}",
                description="仅保留与 EDR 管控中心通信，其余流量全部拒绝，防止横向扩散。",
                target_devices=["fw-hq-core-01"],
                target_entities=[suspicious_host],
                execution_mode="planned",
                priority="critical",
                ngtos_intent=(
                    "object address infected_host_10_10_32_45\n"
                    f" host {suspicious_host}\n"
                    " policy interzone isolate_infected_host deny"
                ),
                rollback_hint="删除 infected_host_10_10_32_45 对象并撤销 isolate_infected_host 策略。",
            ),
        ],
    )


def execute_smb_445_action(action_id: str) -> SimulationActionExecutionRead:
    action_plan = build_smb_445_actions()
    action = next((candidate for candidate in action_plan.actions if candidate.action_id == action_id), None)

    if action is None:
        raise ValueError(f"unknown action: {action_id}")

    generated_event_types = (
        ["policy_change", "policy_hit"]
        if action.action_type == "blacklist_block"
        else ["policy_change", "antivirus_alert"]
    )

    summary = (
        f"已模拟执行 {len(action.target_devices)} 台天融信设备上的黑名单阻断动作。"
        if action.action_type == "blacklist_block"
        else f"已模拟执行 {len(action.target_devices)} 台天融信设备上的主机隔离动作。"
    )

    receipt = SimulationActionExecutionRead(
        action_id=action.action_id,
        status="executed",
        executed_device_count=len(action.target_devices),
        generated_event_types=generated_event_types,
        summary=summary,
    )
    create_change_record(
        source="war_room",
        title=action.title,
        status="executed",
        approval_status="approved",
        summary=summary,
        target_devices=action.target_devices,
        target_entities=action.target_entities,
        execution_mode=action.execution_mode,
        related_href="/war-room",
    )
    return receipt


def annotate_replay_with_target_refs(
    replay: SimulationReplayRead, db: Session
) -> SimulationReplayRead:
    assets = db.query(Asset).order_by(Asset.id).all()
    flows = db.query(Flow).order_by(Flow.id).all()

    asset_node_id_by_label = {asset.asset_name: f"asset-{asset.id}" for asset in assets}
    asset_label_by_id = {asset.id: asset.asset_name for asset in assets}
    flow_target_ids_by_signature = {
        build_flow_signature(
            flow.protocol,
            flow.port,
            asset_label_by_id.get(flow.destination_asset_id, f"asset-{flow.destination_asset_id}"),
        ): (f"flow-node-{flow.id}", f"flow-{flow.id}")
        for flow in flows
    }

    impacted_asset_refs = [
        ReplayImpactedAssetRef(
            label=asset_label,
            target_node_id=asset_node_id_by_label.get(asset_label),
        )
        for asset_label in replay.evidence.impacted_assets
    ]

    whitelist_exception_hits = [
        annotate_evidence_item(
            item,
            asset_node_id_by_label=asset_node_id_by_label,
            flow_target_ids_by_signature=flow_target_ids_by_signature,
        )
        for item in replay.evidence.whitelist_exception_hits
    ]
    false_positive_candidates = [
        annotate_evidence_item(
            item,
            asset_node_id_by_label=asset_node_id_by_label,
            flow_target_ids_by_signature=flow_target_ids_by_signature,
        )
        for item in replay.evidence.false_positive_candidates
    ]
    annotated_events = [
        annotate_replay_event(
            event,
            asset_node_id_by_label=asset_node_id_by_label,
            flow_target_ids_by_signature=flow_target_ids_by_signature,
        )
        for event in replay.events
    ]

    return replay.model_copy(
        update={
            "evidence": ReplayEvidence(
                impacted_assets=replay.evidence.impacted_assets,
                impacted_asset_refs=impacted_asset_refs,
                whitelist_exception_hits=whitelist_exception_hits,
                false_positive_candidates=false_positive_candidates,
                ai_summary=replay.evidence.ai_summary,
            ),
            "events": annotated_events,
        }
    )


def annotate_evidence_item(
    item: ReplayEvidenceItem,
    *,
    asset_node_id_by_label: dict[str, str],
    flow_target_ids_by_signature: dict[str, tuple[str, str]],
) -> ReplayEvidenceItem:
    flow_target_ids = flow_target_ids_by_signature.get(
        build_flow_signature("tcp", item.port, item.destination_ip)
    )

    return item.model_copy(
        update={
            "target_asset_node_id": asset_node_id_by_label.get(item.destination_ip),
            "target_flow_node_id": flow_target_ids[0] if flow_target_ids else None,
            "target_edge_id": flow_target_ids[1] if flow_target_ids else None,
        }
    )


def build_flow_signature(protocol: str, port: int, destination_label: str) -> str:
    return f"{protocol}:{port}:{destination_label}"


def annotate_replay_event(
    event: dict[str, str | int],
    *,
    asset_node_id_by_label: dict[str, str],
    flow_target_ids_by_signature: dict[str, tuple[str, str]],
) -> dict[str, str | int]:
    annotated_event = dict(event)
    target_label = str(annotated_event.get("destination_ip") or annotated_event.get("host_ip") or "")

    if target_label:
        target_asset_node_id = asset_node_id_by_label.get(target_label)
        if target_asset_node_id:
            annotated_event["target_asset_node_id"] = target_asset_node_id

    port = annotated_event.get("destination_port")
    if not target_label or not isinstance(port, int) or port <= 0:
        return annotated_event

    protocol = str(annotated_event.get("protocol") or "tcp")
    flow_target_ids = flow_target_ids_by_signature.get(
        build_flow_signature(protocol, port, target_label)
    )
    if flow_target_ids is None:
        return annotated_event

    annotated_event["target_flow_node_id"] = flow_target_ids[0]
    annotated_event["target_edge_id"] = flow_target_ids[1]
    return annotated_event
