from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_ingest_and_list_live_events():
    asset_response = client.post(
        "/api/assets",
        json={
            "asset_name": "10.20.30.15",
            "asset_type": "server",
            "protection_object_id": 1,
            "security_domain_id": 1,
            "value_level": 4,
        },
    )
    assert asset_response.status_code == 201

    flow_response = client.post(
        "/api/flows",
        json={
            "source_asset_id": 1,
            "source_domain_id": 1,
            "destination_asset_id": asset_response.json()["id"],
            "destination_domain_id": 1,
            "protocol": "tcp",
            "port": 445,
            "flow_type": "east_west",
        },
    )
    assert flow_response.status_code == 201

    payload = {
        "event_type": "ips_alert",
        "vendor": "Topsec",
        "device_id": "ips-hq-01",
        "device_type": "ips",
        "os_type": "NGTOS",
        "action": "alert",
        "policy_id": "implicit-deny",
        "source_ip": "10.10.32.45",
        "destination_ip": "10.20.30.15",
        "protocol": "tcp",
        "destination_port": 445,
        "source_zone": "office_zone",
        "destination_zone": "server_zone",
        "severity": "critical",
    }

    ingest_response = client.post("/api/events/ingest", json=payload)

    assert ingest_response.status_code == 201

    list_response = client.get("/api/events/live")

    assert list_response.status_code == 200
    body = list_response.json()

    assert isinstance(body, list)
    assert body[0]["event_type"] == "ips_alert"
    assert body[0]["device_id"] == "ips-hq-01"
    assert body[0]["target_asset_node_id"] == f"asset-{asset_response.json()['id']}"
    assert body[0]["target_flow_node_id"] == f"flow-node-{flow_response.json()['id']}"
    assert body[0]["target_edge_id"] == f"flow-{flow_response.json()['id']}"
