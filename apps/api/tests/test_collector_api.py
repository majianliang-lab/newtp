from fastapi.testclient import TestClient

from app.main import app
from app.services.collector_status_store import clear_collector_status


client = TestClient(app)


def test_collector_status_reports_runtime_heartbeat():
    clear_collector_status()

    heartbeat_response = client.post(
        "/api/collector/heartbeat",
        json={
            "collector_id": "collector-local-01",
            "host": "0.0.0.0",
            "port": 5514,
            "api_ingest_url": "http://localhost:8000/api/events/ingest",
            "heartbeat_interval_seconds": 30,
        },
    )

    assert heartbeat_response.status_code == 201
    heartbeat_body = heartbeat_response.json()
    assert heartbeat_body["online"] is True
    assert heartbeat_body["collector_id"] == "collector-local-01"

    status_response = client.get("/api/collector/status")

    assert status_response.status_code == 200
    status_body = status_response.json()
    assert status_body["collector_id"] == "collector-local-01"
    assert status_body["port"] == 5514
    assert status_body["online"] is True


def test_collector_status_lists_multiple_runtime_heartbeats():
    clear_collector_status()

    client.post(
        "/api/collector/heartbeat",
        json={
            "collector_id": "collector-local-01",
            "host": "0.0.0.0",
            "port": 5514,
            "api_ingest_url": "http://localhost:8000/api/events/ingest",
            "heartbeat_interval_seconds": 30,
        },
    )
    client.post(
        "/api/collector/heartbeat",
        json={
            "collector_id": "collector-branch-02",
            "host": "10.10.10.20",
            "port": 5515,
            "api_ingest_url": "http://localhost:8000/api/events/ingest",
            "heartbeat_interval_seconds": 60,
        },
    )

    status_response = client.get("/api/collector/status")
    list_response = client.get("/api/collector/statuses")

    assert status_response.status_code == 200
    assert status_response.json()["collector_id"] == "collector-branch-02"

    assert list_response.status_code == 200
    body = list_response.json()
    assert len(body) == 2
    assert body[0]["collector_id"] == "collector-branch-02"
    assert body[1]["collector_id"] == "collector-local-01"
