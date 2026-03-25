from pathlib import Path

from sim_core.execution.scenario_executor import execute_flows
from sim_core.repository import load_device_seed
from sim_core.traffic.generator import (
    generate_baseline_flows,
    generate_scan_flows,
    load_flow_seed,
)


def test_execute_flows_returns_results_and_syslog_messages():
    device = load_device_seed("topsec_branch_fw")
    seed_fixture = load_flow_seed(
        Path(__file__).resolve().parents[4] / "seed-data" / "traffic" / "baseline_flows.json"
    )
    baseline_flow = generate_baseline_flows(seed_fixture)[0]
    scan_flow = generate_scan_flows(
        source_ip="10.10.32.45",
        target_ips=["10.20.99.45"],
        port=445,
    )[0]

    execution = execute_flows(device, [baseline_flow, scan_flow])

    assert len(execution.records) == 2
    assert execution.records[0].result.action == "permit"
    assert execution.records[0].syslog_message.startswith("<134>")
    assert execution.records[1].result.action == "deny"
    assert "policy=implicit-deny" in execution.records[1].syslog_message
