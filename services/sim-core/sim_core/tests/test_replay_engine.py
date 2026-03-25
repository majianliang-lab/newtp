from pathlib import Path

from sim_core.execution.replay_engine import replay_smb_containment_window
from sim_core.repository import load_device_seed
from sim_core.traffic.generator import (
    generate_baseline_flows,
    generate_scan_flows,
    load_flow_seed,
)
from sim_core.traffic.scenarios import SimulatedFlow


def test_replay_window_aggregates_stats_and_security_logs():
    ngfw = load_device_seed("topsec_branch_fw")
    ips = load_device_seed("topsec_hq_ips")
    av = load_device_seed("topsec_dc_av")
    seed_fixture = load_flow_seed(
        Path(__file__).resolve().parents[4] / "seed-data" / "traffic" / "baseline_flows.json"
    )
    baseline_flow = generate_baseline_flows(seed_fixture)[0]
    scan_flow = generate_scan_flows(
        source_ip="10.10.32.45",
        target_ips=["10.20.99.45"],
        port=445,
    )[0]

    replay = replay_smb_containment_window(
        ngfw_device=ngfw,
        baseline_flows=[baseline_flow],
        attack_flows=[scan_flow],
        ips_device=ips,
        av_device=av,
    )

    assert replay.stats["permit_count"] == 1
    assert replay.stats["deny_count"] == 1
    assert replay.stats["implicit_deny_count"] == 1
    assert replay.stats["false_positive_candidates"] == 0
    assert any("event=policy_change" in message for message in replay.syslog_messages)
    assert any("threat_type=ips" in message for message in replay.syslog_messages)
    assert any("engine=av" in message for message in replay.syslog_messages)
    assert "10.20.30.15" in replay.evidence["impacted_assets"]
    assert "10.20.99.45" in replay.evidence["impacted_assets"]
    assert replay.evidence["whitelist_exception_hits"][0]["policy_id"] == "allow-office-to-file"
    assert replay.evidence["whitelist_exception_hits"][0]["destination_ip"] == "10.20.30.15"
    assert replay.evidence["ai_summary"].startswith("窗口内共回放")


def test_replay_window_marks_denied_baseline_flow_as_false_positive_candidate():
    ngfw = load_device_seed("topsec_branch_fw")
    denied_business_flow = SimulatedFlow(
        flow_id="baseline-denied-445",
        source_ip="10.10.88.12",
        destination_ip="10.20.99.45",
        protocol="tcp",
        port=445,
        flow_type="east_west",
        direction="business",
        packets_per_second=60,
    )

    replay = replay_smb_containment_window(
        ngfw_device=ngfw,
        baseline_flows=[denied_business_flow],
        attack_flows=[],
    )

    assert replay.stats["permit_count"] == 0
    assert replay.stats["deny_count"] == 1
    assert replay.stats["false_positive_candidates"] == 1
    assert replay.evidence["false_positive_candidates"][0]["flow_id"] == "baseline-denied-445"
    assert replay.evidence["false_positive_candidates"][0]["destination_ip"] == "10.20.99.45"
