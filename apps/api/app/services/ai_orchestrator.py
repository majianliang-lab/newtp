from sqlalchemy.orm import Session

from app.schemas.orchestration import ApprovalStateRead
from app.schemas.orchestration import ExecutionPlanStepRead
from app.schemas.orchestration import OrchestrationSimulationRead
from app.schemas.simulation import SimulationReplayRead
from app.services.impact_simulator import simulate_intent_impact
from app.services.intent_parser import parse_intent
from app.services.policy_optimizer import recommend_actions_and_exceptions


def orchestrate_prompt(prompt: str, db: Session | None = None) -> OrchestrationSimulationRead:
    intent = parse_intent(prompt)
    replay = simulate_intent_impact(intent.scenario, db)
    recommended_actions, recommended_exceptions = recommend_actions_and_exceptions(
        intent.scenario, replay, intent.action
    )

    return OrchestrationSimulationRead(
        intent=intent,
        replay=replay,
        recommended_actions=recommended_actions,
        recommended_exceptions=recommended_exceptions,
        approval_state=build_approval_state(intent.action),
        explanation_chain=build_explanation_chain(intent.action, replay, recommended_exceptions),
        execution_plan=build_execution_plan(intent.action),
    )


def build_approval_state(action: str) -> ApprovalStateRead:
    if action == "allow":
        return ApprovalStateRead(
            status="pending_approval",
            required_roles=["业务系统负责人", "网络安全平台主管"],
            rationale="当前动作涉及新增业务放通，需要同时确认业务窗口和最小开放范围。",
        )

    if action == "reduce_exposure":
        return ApprovalStateRead(
            status="pending_approval",
            required_roles=["网络安全平台主管", "运维负责人"],
            rationale="当前动作涉及公网收口，需要先确认远程运维替代路径与回退方案。",
        )

    if action == "blacklist_block":
        return ApprovalStateRead(
            status="pending_approval",
            required_roles=["SOC 值班主管", "边界安全负责人"],
            rationale="当前动作涉及威胁情报批量封堵，需要先确认情报时效和影响范围。",
        )

    if action == "isolate":
        return ApprovalStateRead(
            status="pending_approval",
            required_roles=["SOC 值班主管", "终端安全负责人"],
            rationale="当前动作涉及隔离感染主机，需要先确认终端身份与隔离窗口。",
        )

    if action == "block":
        return ApprovalStateRead(
            status="pending_approval",
            required_roles=["SOC 值班主管", "网络安全平台主管"],
            rationale="当前动作涉及跨域批量阻断，需要先复核误杀候选与白名单例外。",
        )

    return ApprovalStateRead(
        status="draft",
        required_roles=["SOC 值班主管"],
        rationale="当前编排仍需人工确认后再进入执行。",
    )


def build_execution_plan(action: str) -> list[ExecutionPlanStepRead]:
    if action == "allow":
        return [
            ExecutionPlanStepRead(
                step_id="confirm-window",
                title="确认业务窗口与放通范围",
                owner="业务系统负责人",
                status="in_review",
                summary="确认 ERP 到支付网关的访问范围、端口和上线时间窗。",
            ),
            ExecutionPlanStepRead(
                step_id="push-allow-policy",
                title="下发最小化放通策略",
                owner="网络安全平台主管",
                status="ready",
                summary="仅放通 443/TCP 并开启命中日志，避免策略被放大。",
            ),
            ExecutionPlanStepRead(
                step_id="observe-logs",
                title="观察上线后日志与会话",
                owner="SOC 值班主管",
                status="ready",
                summary="放通后持续观察策略命中与异常访问，确认无额外暴露。",
            ),
        ]

    if action == "reduce_exposure":
        return [
            ExecutionPlanStepRead(
                step_id="confirm-maintenance-path",
                title="确认运维替代路径",
                owner="运维负责人",
                status="in_review",
                summary="确认公网高危端口关闭后，远程运维将通过堡垒机或审批链访问。",
            ),
            ExecutionPlanStepRead(
                step_id="disable-exposure",
                title="关闭公网暴露策略",
                owner="网络安全平台主管",
                status="ready",
                summary="下发暴露面收敛策略，关闭高危端口并保留必要告警。",
            ),
        ]

    if action == "blacklist_block":
        return [
            ExecutionPlanStepRead(
                step_id="verify-intel",
                title="复核情报来源与时效",
                owner="SOC 值班主管",
                status="in_review",
                summary="确认黑名单来源可靠、未过期，避免把临时业务地址误列入封堵对象。",
            ),
            ExecutionPlanStepRead(
                step_id="push-blacklist",
                title="下发黑名单封堵策略",
                owner="边界安全负责人",
                status="ready",
                summary="审批通过后在互联网入口批量写入黑名单地址组并启用拒绝策略。",
            ),
        ]

    if action == "isolate":
        return [
            ExecutionPlanStepRead(
                step_id="confirm-host",
                title="确认感染主机身份",
                owner="SOC 值班主管",
                status="in_review",
                summary="复核感染主机 IP、责任人和当前业务窗口。",
            ),
            ExecutionPlanStepRead(
                step_id="isolate-host",
                title="执行主机隔离",
                owner="终端安全负责人",
                status="ready",
                summary="审批通过后仅保留与 EDR 管控中心通信，其余流量全部拒绝。",
            ),
        ]

    return [
        ExecutionPlanStepRead(
            step_id="review-exceptions",
            title="复核白名单与误杀候选",
            owner="SOC 值班主管",
            status="in_review",
            summary="先确认 allow-office-to-file 等例外仍需保留。",
        ),
        ExecutionPlanStepRead(
            step_id="push-policy",
            title="下发阻断策略",
            owner="网络安全平台主管",
            status="ready",
            summary="审批通过后向边界设备批量下发 445 阻断策略。",
        ),
    ]


def build_explanation_chain(
    action: str,
    replay: SimulationReplayRead,
    recommended_exceptions: list[dict[str, str | int]],
) -> list[str]:
    if action == "isolate":
        return [
            "已识别为感染主机隔离意图，重点目标是阻止失陷终端继续横向扩散。",
            f"回放显示当前受影响资产包括 {', '.join(replay.evidence.impacted_assets)}。",
            "建议先审批再执行主机隔离，仅保留必要管控链路并持续观察终端告警。",
        ]

    if action == "blacklist_block":
        return [
            "已识别为威胁情报黑名单封堵意图，目标是快速阻断互联网入口恶意地址。",
            replay.evidence.ai_summary,
            "建议先确认情报来源和有效期，再批量下发黑名单地址组并观察命中日志。",
        ]

    if action == "allow":
        return [
            "已识别为新业务上线放通意图，目标是在最小开放范围内恢复业务访问。",
            replay.evidence.ai_summary,
            "建议在业务窗口内下发精确放通策略，并同步开启日志审计与上线观察。",
        ]

    if action == "reduce_exposure":
        return [
            "已识别为公网暴露面收敛意图，目标是关闭高危暴露口并降低外网攻击面。",
            replay.evidence.ai_summary,
            "建议先确认远程运维替代路径，再关闭公网高危端口并保留回退方案。",
        ]

    whitelist_message = (
        f"回放显示仍有 {len(recommended_exceptions)} 条例外需要保留。"
        if recommended_exceptions
        else "回放未发现必须保留的白名单例外。"
    )
    return [
        "已识别为全网 445 横向阻断意图。",
        whitelist_message,
        "建议先审批后批量下发阻断策略，再观察实时事件。",
    ]
