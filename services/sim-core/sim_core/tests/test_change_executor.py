from sim_core.execution.change_executor import simulate_policy_change
from sim_core.repository import load_device_seed


def test_simulate_policy_change_returns_change_record_and_log():
    device = load_device_seed("topsec_branch_fw")

    record = simulate_policy_change(
        device,
        admin="soc_admin",
        change_type="policy_insert",
        policy_id="deny-eastwest-445",
        summary="block tcp 445 east-west",
    )

    assert record.device_id == "fw-topsec-branch-01"
    assert record.change_type == "policy_insert"
    assert record.policy_id == "deny-eastwest-445"
    assert record.admin == "soc_admin"
    assert "event=policy_change" in record.syslog_message
