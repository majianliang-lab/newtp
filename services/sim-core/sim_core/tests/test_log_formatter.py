from pathlib import Path

from sim_core.engine.policy_matcher import evaluate_flow
from sim_core.logging.formatter import (
    format_antivirus_alert_log,
    format_hit_log,
    format_ips_alert_log,
    format_policy_change_log,
)
from sim_core.repository import load_device_seed
from sim_core.traffic.generator import generate_baseline_flows, load_flow_seed


def test_format_topsec_hit_log_from_matched_flow():
    device = load_device_seed("topsec_branch_fw")
    seed_fixture = load_flow_seed(
        Path(__file__).resolve().parents[4] / "seed-data" / "traffic" / "baseline_flows.json"
    )
    flow = generate_baseline_flows(seed_fixture)[0]
    result = evaluate_flow(device, flow)

    message = format_hit_log(device, flow, result)

    assert message.startswith("<134>")
    assert "device=TOPSEC-BRANCH-FW-01" in message
    assert "vendor=Topsec" in message
    assert "os=NGTOS" in message
    assert "action=permit" in message
    assert "policy=allow-office-to-file" in message
    assert "dport=445" in message


def test_format_policy_change_log():
    device = load_device_seed("topsec_branch_fw")

    message = format_policy_change_log(
        device,
        admin="soc_admin",
        change_type="policy_insert",
        policy_id="deny-eastwest-445",
        summary="block tcp 445 east-west",
    )

    assert message.startswith("<134>")
    assert "event=policy_change" in message
    assert "admin=soc_admin" in message
    assert "change_type=policy_insert" in message
    assert "policy=deny-eastwest-445" in message


def test_format_ips_alert_log():
    device = load_device_seed("topsec_hq_ips")

    message = format_ips_alert_log(
        device,
        signature_id="IPS-445-001",
        severity="critical",
        src_ip="10.10.32.45",
        dst_ip="10.20.30.15",
        dst_port=445,
    )

    assert "event=threat" in message
    assert "threat_type=ips" in message
    assert "signature_id=IPS-445-001" in message
    assert "severity=critical" in message


def test_format_antivirus_alert_log():
    device = load_device_seed("topsec_dc_av")

    message = format_antivirus_alert_log(
        device,
        malware_name="WannaLike.Test",
        severity="high",
        host_ip="10.20.30.15",
        file_path="C:/Windows/temp/sample.exe",
    )

    assert "event=malware" in message
    assert "engine=av" in message
    assert "malware_name=WannaLike.Test" in message
    assert "host_ip=10.20.30.15" in message
