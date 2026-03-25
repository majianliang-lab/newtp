from pathlib import Path

from sim_core.repository import load_device_seed
from sim_core.traffic.generator import generate_baseline_flows, generate_scan_flows, load_flow_seed
from sim_core.engine.policy_matcher import evaluate_flow


def test_baseline_flow_matches_topsec_policy():
    device = load_device_seed("topsec_branch_fw")
    seed_fixture = load_flow_seed(
        Path(__file__).resolve().parents[4] / "seed-data" / "traffic" / "baseline_flows.json"
    )
    flow = generate_baseline_flows(seed_fixture)[0]

    result = evaluate_flow(device, flow)

    assert result.matched is True
    assert result.policy_id == "allow-office-to-file"
    assert result.action == "permit"
    assert result.log_enabled is True


def test_scan_flow_without_matching_rule_is_denied():
    device = load_device_seed("topsec_branch_fw")
    flow = generate_scan_flows(
        source_ip="10.10.32.45",
        target_ips=["10.20.99.45"],
        port=445,
    )[0]

    result = evaluate_flow(device, flow)

    assert result.matched is False
    assert result.policy_id == "implicit-deny"
    assert result.action == "deny"
