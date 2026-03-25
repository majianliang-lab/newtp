from sqlalchemy.orm import Session

from app.schemas.orchestration import ApprovalStateRead
from app.schemas.orchestration import ExecutionPlanStepRead
from app.schemas.orchestration import ExceptionReasonRead
from app.schemas.orchestration import FalsePositiveAssessmentRead
from app.schemas.orchestration import OrchestrationSimulationRead
from app.schemas.simulation import ReplayEvidenceItem
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
    false_positive_assessment = build_false_positive_assessment(
        intent.action, replay, recommended_exceptions
    )
    exception_reasons = build_exception_reasons(intent.action, recommended_exceptions)
    approval_state = build_approval_state(intent.action)
    execution_plan = build_execution_plan(intent.action)

    return OrchestrationSimulationRead(
        intent=intent,
        replay=replay,
        recommended_actions=recommended_actions,
        recommended_exceptions=recommended_exceptions,
        approval_state=approval_state,
        false_positive_assessment=false_positive_assessment,
        false_positive_assessment_summary=false_positive_assessment.summary,
        exception_reasons=exception_reasons,
        whitelist_preservation_reasons=exception_reasons,
        approval_impact_summary=approval_state.impact_summary,
        execution_impact_summary=build_execution_impact_summary(execution_plan),
        explanation_chain=build_explanation_chain(intent.action, replay, recommended_exceptions),
        execution_plan=execution_plan,
    )


def build_approval_state(action: str) -> ApprovalStateRead:
    if action == "allow":
        return ApprovalStateRead(
            status="pending_approval",
            required_roles=["业务系统负责人", "网络安全平台主管"],
            rationale="当前动作涉及新增业务放通，需要同时确认业务窗口和最小开放范围。",
            risk_level="medium",
            impact_summary="当前动作会新增受控业务访问，需要同时确认开放范围、业务窗口和日志审计要求。",
            rollback_readiness="已具备按策略粒度回退条件，放通后可快速恢复默认拒绝。",
        )

    if action == "reduce_exposure":
        return ApprovalStateRead(
            status="pending_approval",
            required_roles=["网络安全平台主管", "运维负责人"],
            rationale="当前动作涉及公网收口，需要先确认远程运维替代路径与回退方案。",
            risk_level="high",
            impact_summary="当前动作会收敛公网入口，可能影响现有远程运维和第三方访问路径。",
            rollback_readiness="关闭策略前需确认堡垒机替代链路，回退时可恢复原公网暴露策略。",
        )

    if action == "blacklist_block":
        return ApprovalStateRead(
            status="pending_approval",
            required_roles=["SOC 值班主管", "边界安全负责人"],
            rationale="当前动作涉及威胁情报批量封堵，需要先确认情报时效和影响范围。",
            risk_level="medium",
            impact_summary="当前动作会在互联网入口批量封堵威胁情报地址，主要影响外联访问边界。",
            rollback_readiness="黑名单地址组可整体移除，具备快速回退条件。",
        )

    if action == "isolate":
        return ApprovalStateRead(
            status="pending_approval",
            required_roles=["SOC 值班主管", "终端安全负责人"],
            rationale="当前动作涉及隔离感染主机，需要先确认终端身份与隔离窗口。",
            risk_level="high",
            impact_summary="当前动作会切断感染主机大部分通信，仅保留必要管控链路。",
            rollback_readiness="终端隔离策略可按单主机快速撤销，但需先确认感染态已解除。",
        )

    if action == "block":
        return ApprovalStateRead(
            status="pending_approval",
            required_roles=["SOC 值班主管", "网络安全平台主管"],
            rationale="当前动作涉及跨域批量阻断，需要先复核误杀候选与白名单例外。",
            risk_level="high",
            impact_summary="当前动作属于跨域批量阻断，可能影响文件共享、运维链路和横向业务访问。",
            rollback_readiness="已具备阻断策略与例外白名单的双向回退条件，可按设备分批撤销。",
        )

    return ApprovalStateRead(
        status="draft",
        required_roles=["SOC 值班主管"],
        rationale="当前编排仍需人工确认后再进入执行。",
        risk_level="medium",
        impact_summary="当前编排仍处于草稿评估阶段，尚未形成可直接执行的影响面。",
        rollback_readiness="需先补足执行方案后再评估回退条件。",
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
                expected_outcome="明确最小化放通范围，避免业务上线策略被扩大。",
            ),
            ExecutionPlanStepRead(
                step_id="push-allow-policy",
                title="下发最小化放通策略",
                owner="网络安全平台主管",
                status="ready",
                summary="仅放通 443/TCP 并开启命中日志，避免策略被放大。",
                expected_outcome="业务连通性恢复，同时保留最小权限和日志审计。",
            ),
            ExecutionPlanStepRead(
                step_id="observe-logs",
                title="观察上线后日志与会话",
                owner="SOC 值班主管",
                status="ready",
                summary="放通后持续观察策略命中与异常访问，确认无额外暴露。",
                expected_outcome="确认上线后没有新增暴露面和异常会话。",
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
                expected_outcome="确保暴露面收敛后仍保留受控运维路径。",
            ),
            ExecutionPlanStepRead(
                step_id="disable-exposure",
                title="关闭公网暴露策略",
                owner="网络安全平台主管",
                status="ready",
                summary="下发暴露面收敛策略，关闭高危端口并保留必要告警。",
                expected_outcome="公网高危端口关闭，外网攻击面显著缩小。",
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
                expected_outcome="封堵对象准确，避免把临时业务地址误伤。",
            ),
            ExecutionPlanStepRead(
                step_id="push-blacklist",
                title="下发黑名单封堵策略",
                owner="边界安全负责人",
                status="ready",
                summary="审批通过后在互联网入口批量写入黑名单地址组并启用拒绝策略。",
                expected_outcome="恶意地址在互联网入口被统一拦截，并可观测命中效果。",
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
                expected_outcome="确认隔离对象准确，避免误隔离关键终端。",
            ),
            ExecutionPlanStepRead(
                step_id="isolate-host",
                title="执行主机隔离",
                owner="终端安全负责人",
                status="ready",
                summary="审批通过后仅保留与 EDR 管控中心通信，其余流量全部拒绝。",
                expected_outcome="感染终端被快速隔离，同时保留必要管控能力。",
            ),
        ]

    return [
        ExecutionPlanStepRead(
            step_id="review-exceptions",
            title="复核白名单与误杀候选",
            owner="SOC 值班主管",
            status="in_review",
            summary="先确认 allow-office-to-file 等例外仍需保留。",
            expected_outcome="保留必要白名单，降低跨域批量阻断带来的误杀风险。",
        ),
        ExecutionPlanStepRead(
            step_id="push-policy",
            title="下发阻断策略",
            owner="网络安全平台主管",
            status="ready",
            summary="审批通过后向边界设备批量下发 445 阻断策略。",
            expected_outcome="445 横向访问被快速收敛，同时保持例外链路可控。",
        ),
    ]


def build_false_positive_assessment(
    action: str,
    replay: SimulationReplayRead,
    recommended_exceptions: list[ReplayEvidenceItem],
) -> FalsePositiveAssessmentRead:
    candidate_count = replay.stats.false_positive_candidates

    if action == "block":
        if candidate_count > 0 or recommended_exceptions:
            return FalsePositiveAssessmentRead(
                summary="当前回放存在误杀候选，需保留必要白名单后再执行批量阻断。",
                candidate_count=candidate_count,
                recommended_disposition="preserve_whitelist",
            )

        return FalsePositiveAssessmentRead(
            summary="当前回放未发现明显误杀候选，可按标准审批链推进阻断。",
            candidate_count=0,
            recommended_disposition="direct_block_after_approval",
        )

    return FalsePositiveAssessmentRead(
        summary="当前编排未识别到必须额外保留的误杀候选。",
        candidate_count=candidate_count,
        recommended_disposition="no_additional_exception",
    )


def build_exception_reasons(
    action: str,
    recommended_exceptions: list[ReplayEvidenceItem],
) -> list[ExceptionReasonRead]:
    if action != "block":
        return []

    reasons: list[ExceptionReasonRead] = []

    for item in recommended_exceptions:
        reasons.append(
            ExceptionReasonRead(
                flow_id=item.flow_id,
                policy_id=item.policy_id,
                reason="该白名单承载办公域到文件服务的必要文件共享，直接阻断会造成业务误杀。",
                business_impact="可能影响办公文件共享、横向资料交换或既有运维流程。",
                target_asset_node_id=item.target_asset_node_id,
                target_flow_node_id=item.target_flow_node_id,
                target_edge_id=item.target_edge_id,
            )
        )

    return reasons


def build_execution_impact_summary(
    execution_plan: list[ExecutionPlanStepRead],
) -> str:
    if not execution_plan:
        return "当前尚未形成明确执行步骤。"

    return "；".join(step.expected_outcome or step.summary for step in execution_plan)


def build_explanation_chain(
    action: str,
    replay: SimulationReplayRead,
    recommended_exceptions: list[ReplayEvidenceItem],
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
