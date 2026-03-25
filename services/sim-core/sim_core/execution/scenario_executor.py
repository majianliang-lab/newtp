from dataclasses import dataclass

from sim_core.engine.policy_matcher import PolicyMatchResult, evaluate_flow
from sim_core.logging.formatter import format_hit_log
from sim_core.models.device import VirtualDevice
from sim_core.traffic.scenarios import SimulatedFlow


@dataclass(slots=True)
class ExecutionRecord:
    flow: SimulatedFlow
    result: PolicyMatchResult
    syslog_message: str


@dataclass(slots=True)
class ExecutionBatch:
    records: list[ExecutionRecord]


def execute_flows(device: VirtualDevice, flows: list[SimulatedFlow]) -> ExecutionBatch:
    records: list[ExecutionRecord] = []

    for flow in flows:
        result = evaluate_flow(device, flow)
        syslog_message = format_hit_log(device, flow, result)
        records.append(
            ExecutionRecord(flow=flow, result=result, syslog_message=syslog_message)
        )

    return ExecutionBatch(records=records)
