from fastapi.testclient import TestClient

from app.main import app
from app.services.change_record_store import clear_change_records
from app.services.collector_status_store import clear_collector_status
from app.services.event_store import clear_live_events


client = TestClient(app)


def test_operations_overview_aggregates_runtime_and_ingest_status():
    clear_live_events()
    clear_change_records()
    clear_collector_status()

    first_device = client.post(
        "/api/devices",
        json={
            "device_name": "FW-HQ-01",
            "vendor": "Topsec",
            "os_type": "NGTOS",
            "device_type": "edge-fw",
            "management_ip": "10.0.0.1",
            "security_domain_id": 1,
            "log_ingest_status": "connected",
            "policy_push_capability": True,
        },
    )
    second_device = client.post(
        "/api/devices",
        json={
            "device_name": "AV-BRANCH-01",
            "vendor": "Topsec",
            "os_type": "NGAV",
            "device_type": "av",
            "management_ip": "10.0.1.3",
            "security_domain_id": 1,
            "log_ingest_status": "disconnected",
            "policy_push_capability": False,
        },
    )
    high_event = client.post(
        "/api/events/ingest",
        json={
            "event_type": "ips_alert",
            "device_id": "fw-hq-01",
            "severity": "high",
            "destination_ip": "10.20.1.10",
            "protocol": "tcp",
            "destination_port": 445,
        },
    )
    medium_event = client.post(
        "/api/events/ingest",
        json={
            "event_type": "policy_change",
            "device_id": "fw-hq-01",
            "severity": "medium",
            "destination_ip": "10.20.1.20",
            "protocol": "tcp",
            "destination_port": 443,
        },
    )
    pending_change = client.post(
        "/api/orchestration/submit",
        json={"prompt": "立即阻断全网 TCP 445 横向访问，防止勒索病毒扩散。"},
    )
    executed_change = client.post(
        "/api/simulation/actions/smb-445/execute",
        json={"action_id": "action-blacklist-block-01"},
    )
    collector_hq = client.post(
        "/api/collector/heartbeat",
        json={
            "collector_id": "collector-hq",
            "host": "0.0.0.0",
            "port": 514,
            "api_ingest_url": "http://localhost:8000/api/events/ingest",
            "heartbeat_interval_seconds": 15,
        },
    )
    collector_branch = client.post(
        "/api/collector/heartbeat",
        json={
            "collector_id": "collector-branch",
            "host": "10.10.10.20",
            "port": 1514,
            "api_ingest_url": "http://localhost:8000/api/events/ingest",
            "heartbeat_interval_seconds": 30,
        },
    )

    assert first_device.status_code == 201
    assert second_device.status_code == 201
    assert high_event.status_code == 201
    assert medium_event.status_code == 201
    assert pending_change.status_code == 201
    assert executed_change.status_code == 200
    assert collector_hq.status_code == 201
    assert collector_branch.status_code == 201

    response = client.get("/api/operations/overview")

    assert response.status_code == 200
    body = response.json()

    assert body["collector_online_count"] == 2
    assert body["collector_total_count"] == 2
    assert body["device_total_count"] >= 2
    assert body["connected_device_count"] >= 1
    assert body["disconnected_device_count"] >= 1
    assert 0 < body["log_coverage_rate"] < 100
    assert body["collector_coverage_rate"] == 100
    assert body["live_event_count"] >= 2
    assert body["high_risk_event_count"] >= 1
    assert body["pending_change_count"] == 1
    assert body["recent_events"][0]["event_type"] == "ips_alert"
    assert body["disconnected_devices"][0]["device_name"] == "AV-BRANCH-01"
    assert body["collector_statuses"][0]["collector_id"] == "collector-branch"
    assert body["diagnostic_groups"][0]["title"] == "Collector 异常"
    assert body["diagnostic_groups"][1]["title"] == "设备接入异常"
    assert body["diagnostic_groups"][2]["title"] == "事件与处置"
    assert body["diagnostic_groups"][0]["items"][0]["title"] == "Collector 运行稳定"
    assert body["diagnostic_groups"][1]["items"][0]["priority_label"] == "P2"
    assert body["diagnostic_groups"][2]["items"][0]["priority_label"] == "P1"
    assert body["recommended_actions"][0]["title"] == "处理高优先事件"
    assert body["recommended_actions"][0]["scope_label"] == "event"
    assert body["recommended_actions"][0]["impact_count"] >= 1
    assert body["recommended_actions"][0]["targets"][0]["label"] == "10.20.1.10"
    assert body["recommended_actions"][0]["targets"][0]["href"] == "/events?search=10.20.1.10&targetLabel=10.20.1.10"
    assert body["recommended_actions"][0]["targets"][1]["label"] == "tcp/445 流向"
    assert body["recommended_actions"][0]["targets"][1]["href"] == "/topology?view=flow-view&search=tcp%20445%2010.20.1.10&targetType=flow&targetProtocol=tcp&targetPort=445&targetDestination=10.20.1.10"
    assert body["recommended_actions"][1]["title"] == "设备接入待补齐"
    assert body["recommended_actions"][1]["scope_label"] == "device"
    assert body["recommended_actions"][1]["targets"][0]["label"] == "AV-BRANCH-01"
    assert body["recommended_actions"][1]["targets"][0]["href"] == "/strategy?searchDevice=AV-BRANCH-01"
    assert body["recommended_actions"][1 - 0]["targets"]  # keep deterministic object shape check nearby
    assert body["recommended_actions"][2]["title"] == "推进待审批变更"
    assert body["recommended_actions"][2]["targets"][0]["label"]
    assert body["recommended_actions"][2]["targets"][0]["href"] == "/strategy?recordId=change-001"
    assert body["diagnostics"][0]["title"] == "设备接入待补齐"
    assert body["diagnostics"][0]["action_href"] == "/compliance"
    assert body["diagnostics"][0]["targets"][0]["href"] == "/strategy?searchDevice=AV-BRANCH-01"
    assert body["diagnostics"][1]["title"] == "处理高优先事件"
    assert body["diagnostics"][1]["action_href"] == "/events"
    assert body["diagnostics"][2]["targets"][0]["href"] == "/strategy?recordId=change-001"
