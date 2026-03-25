"use client";

import React, { startTransition, useState } from "react";

import { simulateOrchestration, submitOrchestration } from "../../lib/api";

type OrchestrationResponse = {
  intent: {
    action: string;
    scope: string;
    protocol: string;
    port: number;
    objective: string;
    scenario: string;
  };
  replay: {
    scenario_id: string;
    title: string;
    stats: {
      permit_count: number;
      deny_count: number;
      false_positive_candidates: number;
      policy_change_count: number;
      security_event_count: number;
    };
      evidence: {
        impacted_assets: string[];
        false_positive_reasons?: string[];
        whitelist_exception_hits: Array<{
          flow_id: string;
          policy_id: string;
          destination_ip: string;
          source_ip: string;
          port: number;
          whitelist_reason?: string;
        }>;
        ai_summary: string;
      };
  };
  recommended_actions: Array<{
    action_id: string;
    action_type: string;
    title: string;
    description: string;
    target_devices: string[];
    target_entities: string[];
    execution_mode: string;
    priority: string;
    ngtos_intent: string;
    rollback_hint: string;
  }>;
  recommended_exceptions: Array<{
    flow_id: string;
    policy_id: string;
    destination_ip: string;
    source_ip: string;
    port: number;
  }>;
  approval_state: {
    status: string;
    required_roles: string[];
    rationale: string;
    impact_summary?: string | string[];
  };
  explanation_chain: string[];
  execution_plan: Array<{
    step_id: string;
    title: string;
    owner: string;
    status: string;
    summary: string;
    impact_summary?: string | string[];
  }>;
};

type ChangeRecord = {
  record_id: string;
  source: string;
  title: string;
  status: string;
  approval_status: string;
  summary: string;
  target_devices: string[];
  target_entities: string[];
  execution_mode: string;
  related_href: string;
};

const defaultPrompt = "立即阻断全网 TCP 445 横向访问，防止勒索病毒扩散。";
const promptExamples = [
  "立即阻断全网 TCP 445 横向访问，防止勒索病毒扩散。",
  "立即隔离感染主机 10.10.32.45，阻止进一步扩散。",
  "根据情报批量封堵黑名单 IP 198.51.100.8 和 203.0.113.5。",
  "为新上线业务放通 ERP 到支付网关的 TCP 443 访问。",
  "收敛公网暴露面，关闭不必要的 RDP 3389 暴露。"
];

export function OrchestrationWorkspace() {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [result, setResult] = useState<OrchestrationResponse | null>(null);
  const [submissionRecord, setSubmissionRecord] = useState<ChangeRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);

    try {
      const nextResult = (await simulateOrchestration({ prompt })) as OrchestrationResponse;
      startTransition(() => {
        setResult(nextResult);
        setSubmissionRecord(null);
      });
    } catch {
      setResult(null);
      setError("编排请求失败，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmitApproval() {
    setIsSubmittingApproval(true);
    setError(null);

    try {
      const nextRecord = (await submitOrchestration({ prompt })) as ChangeRecord;
      setSubmissionRecord(nextRecord);
    } catch {
      setSubmissionRecord(null);
      setError("审批提交流程失败，请稍后重试。");
    } finally {
      setIsSubmittingApproval(false);
    }
  }

  return (
    <section style={{ padding: "0 24px 24px" }}>
      <div
        style={{
          background: "var(--panel)",
          border: "1px solid var(--line)",
          borderRadius: 20,
          padding: 20,
          boxShadow: "0 18px 40px rgba(15, 23, 42, 0.05)"
        }}
      >
        <div style={{ display: "grid", gap: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "start" }}>
            <div>
              <h2 style={{ margin: 0 }}>AI 编排中心</h2>
              <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
                让模型先理解意图、再做回放推演、给出处置建议和白名单例外。
              </p>
            </div>
            <div
              style={{
                borderRadius: 999,
                padding: "8px 12px",
                background: "rgba(11, 99, 206, 0.1)",
                color: "#0b63ce",
                fontWeight: 800
              }}
            >
              GPT-5.4 编排链
            </div>
          </div>

          <section
            style={{
              background: "linear-gradient(180deg, #f7fbff 0%, #eef6ff 100%)",
              border: "1px solid var(--line)",
              borderRadius: 18,
              padding: 18
            }}
          >
            <h3 style={{ marginTop: 0 }}>编排意图</h3>
            <textarea
              aria-label="编排意图输入"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              style={{
                width: "100%",
                minHeight: 108,
                borderRadius: 14,
                border: "1px solid var(--line)",
                padding: 14,
                resize: "vertical",
                font: "inherit"
              }}
            />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
              {promptExamples.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPrompt(item)}
                  style={{
                    borderRadius: 999,
                    border: "1px solid var(--line)",
                    padding: "6px 10px",
                    background: "#fff",
                    color: "#0f172a",
                    fontSize: 12,
                    cursor: "pointer"
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 12, alignItems: "center" }}>
              <div style={{ color: "var(--muted)", fontSize: 13 }}>
                当前已支持 445 阻断、感染隔离、黑名单封堵、新业务放通、暴露面收敛。
              </div>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={isSubmitting}
                style={{
                  borderRadius: 999,
                  border: "none",
                  padding: "10px 16px",
                  background: "#0b63ce",
                  color: "#fff",
                  fontWeight: 800,
                  cursor: "pointer",
                  opacity: isSubmitting ? 0.7 : 1
                }}
              >
                {isSubmitting ? "编排中..." : "生成编排建议"}
              </button>
            </div>
            {error ? (
              <div
                style={{
                  marginTop: 12,
                  borderRadius: 14,
                  padding: 12,
                  background: "#fff5f3",
                  border: "1px solid rgba(180, 35, 24, 0.2)",
                  color: "#b42318",
                  fontWeight: 700
                }}
              >
                {error}
              </div>
            ) : null}
          </section>

          {result ? (
            <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 16 }}>
              <section
                style={{
                  background: "#fff",
                  border: "1px solid var(--line)",
                  borderRadius: 18,
                  padding: 18
                }}
              >
                <h3 style={{ marginTop: 0 }}>解析与推演结果</h3>
                <div style={{ display: "grid", gap: 12 }}>
                  <div
                    style={{
                      borderRadius: 14,
                      padding: 14,
                      background: "#f8fafc",
                      border: "1px solid var(--line)"
                    }}
                  >
                    <div style={{ fontWeight: 800 }}>意图解析</div>
                    <div style={{ marginTop: 8 }}>{translateAction(result.intent.action)} / {translateScope(result.intent.scope)} / {result.intent.protocol}/{result.intent.port}</div>
                    <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                      目标：{translateObjective(result.intent.objective)}
                    </div>
                    <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                      场景：{result.intent.scenario}
                    </div>
                  </div>

                  <div
                    style={{
                      borderRadius: 14,
                      padding: 14,
                      background: "linear-gradient(180deg, #fff8f6 0%, #fff1ee 100%)",
                      border: "1px solid #f4c7bf"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
                      <div style={{ fontWeight: 800 }}>{result.replay.title}</div>
                      <div
                        style={{
                          borderRadius: 999,
                          padding: "6px 10px",
                          background: "#fff",
                          border: "1px solid #f4c7bf",
                          fontWeight: 700,
                          fontSize: 12
                        }}
                      >
                        {result.replay.scenario_id}
                      </div>
                    </div>
                    <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 13 }}>
                      {result.replay.evidence.ai_summary}
                    </div>
                    <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", marginTop: 12 }}>
                      <MetricCard label="允许流量" value={`${result.replay.stats.permit_count} 条`} />
                      <MetricCard label="阻断流量" value={`${result.replay.stats.deny_count} 条`} />
                      <MetricCard label="误杀候选" value={`${result.replay.stats.false_positive_candidates} 条`} />
                      <MetricCard label="策略变更" value={`${result.replay.stats.policy_change_count} 次`} />
                      <MetricCard label="安全事件" value={`${result.replay.stats.security_event_count} 条`} />
                    </div>
                    <div style={{ marginTop: 12, color: "var(--muted)", fontSize: 13 }}>
                      受影响资产
                    </div>
                    <div style={{ marginTop: 6, fontWeight: 700 }}>
                      {result.replay.evidence.impacted_assets.join(", ")}
                    </div>
                    {result.replay.evidence.false_positive_reasons?.length ? (
                      <div
                        style={{
                          marginTop: 12,
                          borderRadius: 14,
                          padding: 14,
                          background: "#fff",
                          border: "1px solid rgba(244, 199, 191, 0.7)"
                        }}
                      >
                        <div style={{ fontWeight: 800 }}>误杀评估</div>
                        <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                          {result.replay.stats.false_positive_candidates} 个候选的解释
                        </div>
                        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                          {result.replay.evidence.false_positive_reasons.map((item, index) => (
                            <div key={`${index}-${item}`} style={{ color: "var(--muted)", fontSize: 13 }}>
                              {index + 1}. {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {result.replay.evidence.whitelist_exception_hits.some((item) => item.whitelist_reason) ? (
                      <div
                        style={{
                          marginTop: 12,
                          borderRadius: 14,
                          padding: 14,
                          background: "#fff",
                          border: "1px solid rgba(11, 99, 206, 0.18)"
                        }}
                      >
                        <div style={{ fontWeight: 800 }}>白名单保留原因</div>
                        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                          {result.replay.evidence.whitelist_exception_hits.map((item) =>
                            item.whitelist_reason ? (
                              <div key={item.flow_id} style={{ color: "var(--muted)", fontSize: 13 }}>
                                <strong style={{ color: "#0f172a" }}>{item.policy_id}</strong>
                                <div style={{ marginTop: 4 }}>{item.whitelist_reason}</div>
                              </div>
                            ) : null
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div
                    style={{
                      borderRadius: 14,
                      padding: 14,
                      background: "#f8fafc",
                      border: "1px solid var(--line)"
                    }}
                  >
                    <div style={{ fontWeight: 800 }}>解释链</div>
                    <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                      {result.explanation_chain.map((item, index) => (
                        <div key={`${index}-${item}`} style={{ color: "var(--muted)", fontSize: 13 }}>
                          {index + 1}. {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <div style={{ display: "grid", gap: 16 }}>
                <section
                  style={{
                    background: "#fff",
                    border: "1px solid var(--line)",
                    borderRadius: 18,
                    padding: 18
                  }}
                >
                  <h3 style={{ marginTop: 0 }}>审批态</h3>
                  <div
                    style={{
                      borderRadius: 14,
                      padding: 14,
                      background: "#f8fafc",
                      border: "1px solid var(--line)"
                    }}
                  >
                    <div style={{ fontWeight: 800 }}>{result.approval_state.status}</div>
                    <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 13 }}>审批角色</div>
                    <div style={{ marginTop: 4, fontWeight: 700 }}>
                      {result.approval_state.required_roles.join(", ")}
                    </div>
                    <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 13 }}>
                      {result.approval_state.rationale}
                    </div>
                    {result.approval_state.impact_summary ? (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ color: "var(--muted)", fontSize: 13 }}>审批影响</div>
                        <div style={{ marginTop: 4, fontWeight: 700 }}>
                          {renderTextBlock(result.approval_state.impact_summary)}
                        </div>
                      </div>
                    ) : null}
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                      <button
                        type="button"
                        onClick={() => void handleSubmitApproval()}
                        disabled={isSubmittingApproval}
                        style={{
                          borderRadius: 999,
                          border: "none",
                          padding: "10px 14px",
                          background: "#0b63ce",
                          color: "#fff",
                          fontWeight: 800,
                          cursor: "pointer",
                          opacity: isSubmittingApproval ? 0.7 : 1
                        }}
                      >
                        {isSubmittingApproval ? "提交中..." : "提交审批流"}
                      </button>
                      <a
                        href="/strategy"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          borderRadius: 999,
                          padding: "10px 14px",
                          background: "rgba(11, 99, 206, 0.1)",
                          color: "#0b63ce",
                          textDecoration: "none",
                          fontWeight: 800
                        }}
                      >
                        前往策略工作台
                      </a>
                    </div>
                    {submissionRecord ? (
                      <div
                        style={{
                          marginTop: 14,
                          borderRadius: 14,
                          padding: 14,
                          background: "#eef6ff",
                          border: "1px solid rgba(11, 99, 206, 0.2)"
                        }}
                      >
                        <div style={{ fontWeight: 800 }}>{submissionRecord.summary}</div>
                        <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 13 }}>
                          记录编号 {submissionRecord.record_id}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </section>

                <section
                  style={{
                    background: "#fff",
                    border: "1px solid var(--line)",
                    borderRadius: 18,
                    padding: 18
                  }}
                >
                  <h3 style={{ marginTop: 0 }}>执行计划</h3>
                  <div style={{ display: "grid", gap: 10 }}>
                    {result.execution_plan.map((step) => (
                      <article
                        key={step.step_id}
                        style={{
                          borderRadius: 14,
                          padding: 14,
                          background: "#f8fafc",
                          border: "1px solid var(--line)"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
                          <strong>{step.title}</strong>
                          <span
                            style={{
                              borderRadius: 999,
                              padding: "4px 10px",
                              background: "rgba(11, 99, 206, 0.1)",
                              color: "#0b63ce",
                              fontWeight: 700,
                              fontSize: 12
                            }}
                          >
                            {step.status}
                          </span>
                        </div>
                        <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>负责人：{step.owner}</div>
                        <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>{step.summary}</div>
                        {step.impact_summary ? (
                          <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 13 }}>
                            执行影响：{renderTextBlock(step.impact_summary)}
                          </div>
                        ) : null}
                      </article>
                    ))}
                  </div>
                </section>

                <section
                  style={{
                    background: "#fff",
                    border: "1px solid var(--line)",
                    borderRadius: 18,
                    padding: 18
                  }}
                >
                  <h3 style={{ marginTop: 0 }}>推荐动作</h3>
                  <div style={{ display: "grid", gap: 10 }}>
                    {result.recommended_actions.map((action) => (
                      <article
                        key={action.action_id}
                        style={{
                          borderRadius: 14,
                          padding: 14,
                          background: "#f8fafc",
                          border: "1px solid var(--line)"
                        }}
                      >
                        <strong>{action.title}</strong>
                        <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>{action.description}</div>
                        <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 13 }}>
                          设备
                        </div>
                        <div style={{ marginTop: 4, fontWeight: 700 }}>
                          {action.target_devices.join(", ")}
                        </div>
                        <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 13 }}>
                          对象
                        </div>
                        <div style={{ marginTop: 4, fontWeight: 700 }}>
                          {action.target_entities.join(", ")}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>

                <section
                  style={{
                    background: "#fff",
                    border: "1px solid var(--line)",
                    borderRadius: 18,
                    padding: 18
                  }}
                >
                  <h3 style={{ marginTop: 0 }}>推荐例外</h3>
                  <div style={{ display: "grid", gap: 10 }}>
                    {result.recommended_exceptions.map((item) => (
                      <article
                        key={item.flow_id}
                        style={{
                          borderRadius: 14,
                          padding: 14,
                          background: "#f8fafc",
                          border: "1px solid var(--line)"
                        }}
                      >
                        <strong>{item.policy_id}</strong>
                        <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                          {item.source_ip} → {item.destination_ip}:{item.port}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        borderRadius: 12,
        padding: 12,
        background: "#fff",
        border: "1px solid rgba(244, 199, 191, 0.7)"
      }}
    >
      <div style={{ fontSize: 12, color: "var(--muted)" }}>{label}</div>
      <div style={{ marginTop: 6, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function renderTextBlock(value: string | string[]) {
  return Array.isArray(value) ? value.join("；") : value;
}

function translateAction(action: string) {
  if (action === "block") {
    return "阻断";
  }
  if (action === "isolate") {
    return "隔离";
  }
  if (action === "blacklist_block") {
    return "黑名单封堵";
  }
  if (action === "allow") {
    return "放通";
  }
  if (action === "reduce_exposure") {
    return "暴露面收敛";
  }

  return action;
}

function translateScope(scope: string) {
  if (scope === "global") {
    return "global";
  }
  if (scope === "targeted") {
    return "targeted";
  }
  return scope;
}

function translateObjective(objective: string) {
  if (objective === "infected_host_isolation") {
    return "感染主机隔离";
  }
  if (objective === "blacklist_containment") {
    return "黑名单封堵";
  }
  if (objective === "business_enablement") {
    return "新业务放通";
  }
  if (objective === "exposure_reduction") {
    return "暴露面收敛";
  }
  if (objective === "ransomware_containment") {
    return "防止勒索病毒扩散";
  }
  return objective;
}
