from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_get_domain_topology():
    response = client.get("/api/topology/domain-view")

    assert response.status_code == 200
    body = response.json()
    assert "nodes" in body
    assert "edges" in body


def test_get_asset_topology():
    response = client.get("/api/topology/asset-view")

    assert response.status_code == 200
    body = response.json()
    assert "nodes" in body
    assert "edges" in body


def test_get_flow_topology():
    response = client.get("/api/topology/flow-view")

    assert response.status_code == 200
    body = response.json()
    assert "nodes" in body
    assert "edges" in body
