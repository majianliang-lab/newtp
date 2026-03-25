from fastapi.testclient import TestClient

from app.main import app
from app.services.change_record_store import clear_change_records
from app.services.collector_status_store import clear_collector_status
from app.services.event_store import clear_live_events


client = TestClient(app)


def test_dashboard_overview_aggregates_platform_metrics():
    clear_live_events()
    clear_change_records()
    clear_collector_status()

    asset_response = client.post(
        "/api/assets",
        json={
            "asset_name": "DMZ-WEB-01",
            "asset_type": "server",
            "protection_object_id": 1,
            "security_domain_id": 1,
            "value_level": 4,
        },
    )
    exposure_response = client.post(
        "/api/exposures",
        json={
            "public_ip": "203.0.113.20",
            "open_port": 443,
            "protocol": "tcp",
            "backend_asset_id": asset_response.json()["id"],
            "security_domain_id": 1,
            "log_visibility_status": "connected",
        },
    )
    device_response = client.post(
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
    event_response = client.post(
        "/api/events/ingest",
        json={
            "event_type": "ips_alert",
            "device_id": "fw-hq-01",
            "severity": "high",
            "destination_ip": "DMZ-WEB-01",
            "protocol": "tcp",
            "destination_port": 443,
        },
    )

    assert asset_response.status_code == 201
    assert exposure_response.status_code == 201
    assert device_response.status_code == 201
    assert event_response.status_code == 201

    orchestration_submit_response = client.post(
        "/api/orchestration/submit",
        json={"prompt": "立即阻断全网 TCP 445 横向访问，防止勒索病毒扩散。"},
    )
    collector_response = client.post(
        "/api/collector/heartbeat",
        json={
            "collector_id": "collector-local-01",
            "host": "0.0.0.0",
            "port": 5514,
            "api_ingest_url": "http://localhost:8000/api/events/ingest",
            "heartbeat_interval_seconds": 30,
        },
    )
    second_collector_response = client.post(
        "/api/collector/heartbeat",
        json={
            "collector_id": "collector-branch-02",
            "host": "10.10.10.20",
            "port": 5515,
            "api_ingest_url": "http://localhost:8000/api/events/ingest",
            "heartbeat_interval_seconds": 60,
        },
    )
    execute_response = client.post(
        "/api/simulation/actions/smb-445/execute",
        json={"action_id": "action-blacklist-block-01"},
    )

    assert orchestration_submit_response.status_code == 201
    assert collector_response.status_code == 201
    assert second_collector_response.status_code == 201
    assert execute_response.status_code == 200

    response = client.get("/api/dashboard/overview")

    assert response.status_code == 200
    body = response.json()

    assert body["high_value_asset_count"] >= 1
    assert body["exposure_count"] >= 1
    assert 0 < body["log_coverage_rate"] <= 100
    assert body["high_risk_event_count"] >= 1
    assert body["pending_change_count"] == 1
    assert body["executed_change_count"] == 1
    assert body["collector_total_count"] == 2
    assert body["collector_online_count"] == 2
    assert body["collector_status"]["collector_id"] == "collector-branch-02"
    assert len(body["collector_statuses"]) == 2
    assert body["collector_statuses"][0]["collector_id"] == "collector-branch-02"
    assert body["collector_statuses"][1]["collector_id"] == "collector-local-01"
    assert body["collector_status"]["online"] is True
    assert body["recent_changes"][0]["source"] == "war_room"
    assert body["recent_changes"][1]["source"] == "orchestration"
    assert body["focus"]["scenario_id"] == "smb-445-containment"
    assert body["focus"]["title"] == "445 护网应急推演"
