from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_create_asset():
    payload = {
        "asset_name": "DC01",
        "asset_type": "server",
        "protection_object_id": 1,
        "security_domain_id": 1,
        "value_level": 5,
    }

    response = client.post("/api/assets", json=payload)

    assert response.status_code == 201
