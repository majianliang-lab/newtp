from pathlib import Path

from sim_core.traffic.generator import generate_baseline_flows, generate_scan_flows, load_flow_seed


def test_generate_smb_baseline_flow():
    seed_fixture = load_flow_seed(
        Path(__file__).resolve().parents[4] / "seed-data" / "traffic" / "baseline_flows.json"
    )

    flows = generate_baseline_flows(seed_fixture)

    assert any(flow.port == 445 for flow in flows)
    assert any(flow.flow_type == "east_west" for flow in flows)


def test_generate_abnormal_scan_flow():
    flows = generate_scan_flows(
        source_ip="10.10.32.45",
        target_ips=["10.20.1.10", "10.20.30.15"],
        port=445,
    )

    assert len(flows) == 2
    assert all(flow.port == 445 for flow in flows)
    assert all(flow.flow_type == "attack_scan" for flow in flows)
