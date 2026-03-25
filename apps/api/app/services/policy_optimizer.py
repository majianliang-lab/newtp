from app.schemas.simulation import SimulationActionRead, SimulationReplayRead
from app.services.replay_scenarios import build_smb_445_actions


def recommend_actions_and_exceptions(
    scenario: str,
    replay: SimulationReplayRead,
    action: str = "block",
) -> tuple[list[SimulationActionRead], list[dict[str, str | int]]]:
    if scenario == "smb-445-containment":
        action_plan = build_smb_445_actions()
        if action == "isolate":
            recommended_actions = [
                item for item in action_plan.actions if item.action_type == "host_isolation"
            ]
            recommended_exceptions = []
        else:
            recommended_actions = action_plan.actions
            recommended_exceptions = replay.evidence.whitelist_exception_hits

        return recommended_actions, recommended_exceptions

    if scenario == "blacklist-containment":
        return [build_blacklist_action()], []

    if scenario == "service-enable-change":
        return [build_service_enable_action()], []

    if scenario == "exposure-reduction":
        return [build_exposure_reduction_action()], []

    raise ValueError(f"unsupported scenario: {scenario}")


def build_blacklist_action() -> SimulationActionRead:
    return SimulationActionRead(
        action_id="action-threat-intel-blacklist-01",
        action_type="blacklist_block",
        title="批量下发情报黑名单封堵",
        description="将情报中心下发的恶意 IP 写入边界设备黑名单地址组，并在互联网入口统一拒绝。",
        target_devices=["fw-internet-edge-01", "fw-hq-core-01"],
        target_entities=["threat-intel-feed"],
        execution_mode="planned",
        priority="high",
        ngtos_intent="object-group address threat_intel_blocklist",
        rollback_hint="移除黑名单地址组引用并恢复入口策略。",
    )


def build_service_enable_action() -> SimulationActionRead:
    return SimulationActionRead(
        action_id="action-service-allow-01",
        action_type="service_allow",
        title="下发新业务放通策略",
        description="按源、目的和 443/TCP 端口收敛范围，下发最小化业务放通策略，并保留日志审计。",
        target_devices=["fw-hq-core-01"],
        target_entities=["ERP-APP-01", "PAY-GW-01"],
        execution_mode="planned",
        priority="medium",
        ngtos_intent="policy add permit service https source ERP-APP-01 destination PAY-GW-01 log enable",
        rollback_hint="删除本次放通策略并恢复默认拒绝。",
    )


def build_exposure_reduction_action() -> SimulationActionRead:
    return SimulationActionRead(
        action_id="action-exposure-reduction-01",
        action_type="exposure_disable",
        title="关闭公网高危端口暴露",
        description="收敛公网暴露策略，关闭高危远程运维端口，仅保留堡垒机或审批后访问路径。",
        target_devices=["fw-internet-edge-01"],
        target_entities=["DMZ-WEB-01", "bastion-gateway"],
        execution_mode="planned",
        priority="high",
        ngtos_intent="policy update deny service rdp inbound-untrusted-to-dmz",
        rollback_hint="恢复原公网暴露策略或改为仅堡垒机来源可达。",
    )
