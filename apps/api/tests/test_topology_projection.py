from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.topology_projection import (
    build_asset_topology,
    build_domain_topology,
    build_flow_topology,
)


def test_projection_groups_assets_by_domain():
    graph = build_domain_topology(
        domains=[
            {
                "id": 1,
                "name": "办公域",
                "domain_type": "office",
                "protection_object_name": "总部办公网",
                "protection_object_level": "三级",
            },
            {
                "id": 2,
                "name": "数据域",
                "domain_type": "data",
                "protection_object_name": "总部办公网",
                "protection_object_level": "三级",
            },
        ],
        assets=[
            {"id": 1, "asset_name": "FILE-SRV01", "security_domain_id": 2},
        ],
        flows=[
            {"id": "flow-1", "source_domain_id": 1, "destination_domain_id": 2, "port": 445},
        ],
    )

    assert graph["nodes"][0]["type"] == "domain"
    assert graph["nodes"][0]["domain_type"] == "office"
    assert graph["nodes"][0]["protection_object_name"] == "总部办公网"
    assert graph["nodes"][1]["asset_count"] == 1


def test_domain_projection_maps_risk_from_high_value_assets():
    graph = build_domain_topology(
        domains=[
            {"id": 1, "name": "办公域"},
            {"id": 2, "name": "数据域"},
        ],
        assets=[
            {"id": 1, "asset_name": "SEED-ASSET-01", "security_domain_id": 1, "value_level": 3},
            {"id": 2, "asset_name": "DB-01", "security_domain_id": 2, "value_level": 5},
        ],
        flows=[],
    )

    risk_by_node_id = {node["id"]: node["risk"] for node in graph["nodes"] if node["type"] == "domain"}

    assert risk_by_node_id["domain-1"] == "medium"
    assert risk_by_node_id["domain-2"] == "high"


def test_asset_projection_links_assets_with_flow_edges():
    graph = build_asset_topology(
        assets=[
            {
                "id": 1,
                "asset_name": "SEED-ASSET-01",
                "asset_type": "host",
                "security_domain_id": 1,
                "security_domain_name": "办公域",
                "protection_object_name": "总部办公网",
                "protection_object_level": "三级",
                "value_level": 3,
            },
            {
                "id": 2,
                "asset_name": "DB-01",
                "asset_type": "database",
                "security_domain_id": 2,
                "security_domain_name": "数据域",
                "protection_object_name": "总部办公网",
                "protection_object_level": "三级",
                "value_level": 5,
            },
        ],
        flows=[
            {
                "id": 1,
                "source_asset_id": 1,
                "destination_asset_id": 2,
                "port": 445,
                "flow_type": "east_west",
            }
        ],
    )

    assert graph["nodes"][0]["label"] == "SEED-ASSET-01"
    assert graph["nodes"][0]["asset_type"] == "host"
    assert graph["nodes"][0]["security_domain_name"] == "办公域"
    assert graph["nodes"][1]["value_level"] == 5
    assert graph["edges"][0]["from"] == "asset-1"
    assert graph["edges"][0]["to"] == "asset-2"
    assert graph["edges"][0]["flow_type"] == "east_west"
    assert graph["edges"][0]["port"] == 445
    assert graph["edges"][0]["protocol"] == "tcp"


def test_flow_projection_creates_flow_nodes():
    graph = build_flow_topology(
        flows=[
            {
                "id": 1,
                "source_domain_name": "办公域",
                "destination_domain_name": "数据域",
                "source_asset_id": 1,
                "destination_asset_id": 2,
                "source_asset_label": "OFFICE-PC-01",
                "destination_asset_label": "10.20.30.15",
                "port": 445,
                "flow_type": "east_west",
            }
        ]
    )

    assert graph["nodes"][0]["type"] == "flow"
    assert graph["nodes"][0]["label"] == "办公域->数据域"
    assert graph["nodes"][0]["source_asset_label"] == "OFFICE-PC-01"
    assert graph["nodes"][0]["destination_asset_label"] == "10.20.30.15"
    assert graph["nodes"][0]["source_domain_name"] == "办公域"
    assert graph["nodes"][0]["destination_domain_name"] == "数据域"
    assert graph["edges"][0]["source_label"] == "OFFICE-PC-01"
    assert graph["edges"][0]["destination_label"] == "10.20.30.15"
    assert graph["edges"][0]["related_flow_node_id"] == "flow-node-1"
