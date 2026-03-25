from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_list_assets():
    response = client.get("/api/assets")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_list_exposures():
    response = client.get("/api/exposures")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_list_accounts():
    response = client.get("/api/accounts")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_list_flows():
    response = client.get("/api/flows")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_list_devices():
    response = client.get("/api/devices")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_list_control_points():
    response = client.get("/api/control-points")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_list_security_domains():
    response = client.get("/api/security-domains")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_list_protection_objects():
    response = client.get("/api/protection-objects")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
