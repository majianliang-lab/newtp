from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_get_domain_topology():
    response = client.get("/api/topology/domain-view")

    assert response.status_code == 200
    body = response.json()
    assert "nodes" in body
    assert "edges" in body
    domain_node = next(node for node in body["nodes"] if node["id"] == "domain-1")
    assert domain_node["type"] == "domain"
    assert domain_node["domain_type"] == "data"
    assert domain_node["protection_object_name"] == "默认三级对象"
    assert domain_node["owner_team"] == "SOC"
    assert domain_node["asset_count"] >= 1


def test_get_asset_topology():
    response = client.get("/api/topology/asset-view")

    assert response.status_code == 200
    body = response.json()
    assert "nodes" in body
    assert "edges" in body
    asset_node = next(node for node in body["nodes"] if node["id"] == "asset-1")
    assert asset_node["type"] == "asset"
    assert asset_node["security_domain_name"] == "默认数据域"
    assert asset_node["asset_type"] == "server"
    assert asset_node["value_level"] == 5
    assert asset_node["protection_object_name"] == "默认三级对象"


def test_get_flow_topology():
    create_response = client.post(
        "/api/flows",
        json={
            "source_asset_id": 1,
            "source_domain_id": 1,
            "destination_asset_id": 1,
            "destination_domain_id": 1,
            "protocol": "tcp",
            "port": 445,
            "flow_type": "east_west",
        },
    )

    assert create_response.status_code == 201
    created_flow = create_response.json()

    response = client.get("/api/topology/flow-view")

    assert response.status_code == 200
    body = response.json()
    assert "nodes" in body
    assert "edges" in body
    edge = next(
        edge for edge in body["edges"] if edge["id"] == f"flow-edge-{created_flow['id']}"
    )
    assert edge["related_flow_node_id"] == f"flow-node-{created_flow['id']}"
    assert edge["source_label"] == "SEED-ASSET-01"
    assert edge["destination_label"] == "SEED-ASSET-01"
    assert edge["source_domain_name"] == "默认数据域"
    assert edge["destination_domain_name"] == "默认数据域"
    assert edge["protocol"] == "tcp"
    assert edge["port"] == 445
    assert edge["risk"] == "high"
