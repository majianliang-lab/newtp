from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_create_exposure():
    payload = {
        "public_ip": "1.2.3.4",
        "open_port": 443,
        "protocol": "tcp",
        "backend_asset_id": 1,
        "security_domain_id": 1,
        "log_visibility_status": "visible",
    }

    response = client.post("/api/exposures", json=payload)

    assert response.status_code == 201


def test_create_account():
    payload = {
        "account_name": "ops_admin",
        "account_type": "human",
        "permission_level": "admin",
        "via_bastion": True,
        "mfa_enabled": True,
    }

    response = client.post("/api/accounts", json=payload)

    assert response.status_code == 201


def test_create_flow():
    payload = {
        "source_asset_id": 1,
        "source_domain_id": 1,
        "destination_asset_id": 1,
        "destination_domain_id": 1,
        "protocol": "tcp",
        "port": 445,
        "flow_type": "east_west",
    }

    response = client.post("/api/flows", json=payload)

    assert response.status_code == 201


def test_create_device():
    payload = {
        "device_name": "fw-hq-core-01",
        "vendor": "Topsec",
        "os_type": "NGTOS",
        "device_type": "edge-fw",
        "management_ip": "10.255.0.11",
        "security_domain_id": 1,
        "log_ingest_status": "connected",
        "policy_push_capability": True,
    }

    response = client.post("/api/devices", json=payload)

    assert response.status_code == 201


def test_create_control_point():
    payload = {
        "device_id": 1,
        "control_type": "boundary_block",
        "source_domain_id": 1,
        "destination_domain_id": 1,
        "supports_simulation": True,
        "priority": 100,
    }

    response = client.post("/api/control-points", json=payload)

    assert response.status_code == 201
