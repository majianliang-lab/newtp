from app.schemas.simulation import ReplayEvidence
from app.schemas.simulation import ReplayStats
from sqlalchemy.orm import Session

from app.schemas.simulation import SimulationReplayRead
from app.services.replay_scenarios import build_smb_445_replay


def simulate_intent_impact(scenario: str, db: Session | None = None) -> SimulationReplayRead:
    if scenario == "smb-445-containment":
        return build_smb_445_replay(db)
    if scenario == "blacklist-containment":
        return build_blacklist_replay()
    if scenario == "service-enable-change":
        return build_service_enable_replay()
    if scenario == "exposure-reduction":
        return build_exposure_reduction_replay()

    raise ValueError(f"unsupported scenario: {scenario}")


def build_blacklist_replay() -> SimulationReplayRead:
    return SimulationReplayRead(
        scenario_id="blacklist-containment",
        title="黑名单批量封堵预演",
        stats=ReplayStats(
            permit_count=1,
            deny_count=4,
            implicit_deny_count=0,
            false_positive_candidates=0,
            policy_change_count=1,
            security_event_count=1,
        ),
        evidence=ReplayEvidence(
            impacted_assets=["Internet Edge", "DMZ 入口"],
            ai_summary="预演显示黑名单封堵会收敛互联网入口访问，当前未发现必须保留的白名单例外。",
        ),
        events=[],
        event_type_counts={"policy_change": 1, "threat_intel_alert": 1},
    )


def build_service_enable_replay() -> SimulationReplayRead:
    return SimulationReplayRead(
        scenario_id="service-enable-change",
        title="新业务放通预演",
        stats=ReplayStats(
            permit_count=4,
            deny_count=1,
            implicit_deny_count=0,
            false_positive_candidates=0,
            policy_change_count=1,
            security_event_count=0,
        ),
        evidence=ReplayEvidence(
            impacted_assets=["ERP-APP-01", "PAY-GW-01"],
            ai_summary="预演显示限定在 443/TCP 的业务放通可恢复新业务访问，新增暴露面保持可控。",
        ),
        events=[],
        event_type_counts={"policy_change": 1},
    )


def build_exposure_reduction_replay() -> SimulationReplayRead:
    return SimulationReplayRead(
        scenario_id="exposure-reduction",
        title="公网暴露面收敛预演",
        stats=ReplayStats(
            permit_count=0,
            deny_count=3,
            implicit_deny_count=1,
            false_positive_candidates=0,
            policy_change_count=1,
            security_event_count=1,
        ),
        evidence=ReplayEvidence(
            impacted_assets=["DMZ-WEB-01", "堡垒机入口"],
            ai_summary="预演显示关闭公网高危端口后可明显降低暴露风险，主要影响远程运维访问方式切换。",
        ),
        events=[],
        event_type_counts={"policy_change": 1, "exposure_alert": 1},
    )
