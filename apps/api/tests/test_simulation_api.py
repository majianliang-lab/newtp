from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_get_smb_replay_returns_structured_result():
    response = client.get("/api/simulation/replay/smb-445")

    assert response.status_code == 200
    body = response.json()

    assert body["scenario_id"] == "smb-445-containment"
    assert body["title"] == "445 护网应急推演"
    assert body["stats"]["permit_count"] >= 1
    assert body["stats"]["deny_count"] >= 1
    assert body["stats"]["policy_change_count"] == 1
    assert body["stats"]["security_event_count"] >= 2
    assert "10.20.30.15" in body["evidence"]["impacted_assets"]
    assert body["evidence"]["whitelist_exception_hits"][0]["policy_id"] == "allow-office-to-file"
    assert body["evidence"]["ai_summary"].startswith("窗口内共回放")


def test_get_smb_replay_includes_normalized_events():
    response = client.get("/api/simulation/replay/smb-445")

    assert response.status_code == 200
    body = response.json()

    event_types = {event["event_type"] for event in body["events"]}

    assert "policy_hit" in event_types
    assert "policy_change" in event_types
    assert "ips_alert" in event_types
    assert "antivirus_alert" in event_types
    assert body["event_type_counts"]["policy_change"] == 1
    assert body["event_type_counts"]["ips_alert"] == 1
    assert body["event_type_counts"]["antivirus_alert"] == 1


def test_get_smb_replay_includes_topology_target_refs():
    asset_1 = client.post(
        "/api/assets",
        json={
            "asset_name": "10.20.30.15",
            "asset_type": "server",
            "protection_object_id": 1,
            "security_domain_id": 1,
            "value_level": 4,
        },
    )
    asset_2 = client.post(
        "/api/assets",
        json={
            "asset_name": "10.20.99.45",
            "asset_type": "server",
            "protection_object_id": 1,
            "security_domain_id": 1,
            "value_level": 3,
        },
    )
    asset_3 = client.post(
        "/api/assets",
        json={
            "asset_name": "10.30.40.20",
            "asset_type": "server",
            "protection_object_id": 1,
            "security_domain_id": 1,
            "value_level": 3,
        },
    )
    asset_4 = client.post(
        "/api/assets",
        json={
            "asset_name": "10.20.1.10",
            "asset_type": "server",
            "protection_object_id": 1,
            "security_domain_id": 1,
            "value_level": 4,
        },
    )

    assert asset_1.status_code == 201
    assert asset_2.status_code == 201
    assert asset_3.status_code == 201
    assert asset_4.status_code == 201

    flow_1 = client.post(
        "/api/flows",
        json={
            "source_asset_id": 1,
            "source_domain_id": 1,
            "destination_asset_id": asset_1.json()["id"],
            "destination_domain_id": 1,
            "protocol": "tcp",
            "port": 445,
            "flow_type": "east_west",
        },
    )
    flow_2 = client.post(
        "/api/flows",
        json={
            "source_asset_id": 1,
            "source_domain_id": 1,
            "destination_asset_id": asset_2.json()["id"],
            "destination_domain_id": 1,
            "protocol": "tcp",
            "port": 445,
            "flow_type": "east_west",
        },
    )

    assert flow_1.status_code == 201
    assert flow_2.status_code == 201

    flow_3 = client.post(
        "/api/flows",
        json={
            "source_asset_id": 1,
            "source_domain_id": 1,
            "destination_asset_id": asset_3.json()["id"],
            "destination_domain_id": 1,
            "protocol": "tcp",
            "port": 443,
            "flow_type": "east_west",
        },
    )

    assert flow_3.status_code == 201

    flow_4 = client.post(
        "/api/flows",
        json={
            "source_asset_id": 1,
            "source_domain_id": 1,
            "destination_asset_id": asset_4.json()["id"],
            "destination_domain_id": 1,
            "protocol": "tcp",
            "port": 445,
            "flow_type": "east_west",
        },
    )

    assert flow_4.status_code == 201

    response = client.get("/api/simulation/replay/smb-445")

    assert response.status_code == 200
    body = response.json()

    impacted_asset_refs = {
        item["label"]: item["target_node_id"] for item in body["evidence"]["impacted_asset_refs"]
    }
    false_positive_candidate = body["evidence"]["false_positive_candidates"][0]
    whitelist_hit = body["evidence"]["whitelist_exception_hits"][0]
    ips_alert = next(event for event in body["events"] if event["event_type"] == "ips_alert")
    antivirus_alert = next(event for event in body["events"] if event["event_type"] == "antivirus_alert")

    assert impacted_asset_refs["10.20.30.15"] == f"asset-{asset_1.json()['id']}"
    assert impacted_asset_refs["10.20.99.45"] == f"asset-{asset_2.json()['id']}"
    assert impacted_asset_refs["10.30.40.20"] == f"asset-{asset_3.json()['id']}"
    assert whitelist_hit["target_asset_node_id"] == f"asset-{asset_1.json()['id']}"
    assert whitelist_hit["target_flow_node_id"] == f"flow-node-{flow_1.json()['id']}"
    assert whitelist_hit["target_edge_id"] == f"flow-{flow_1.json()['id']}"
    assert false_positive_candidate["destination_ip"] == "10.30.40.20"
    assert false_positive_candidate["target_asset_node_id"] == f"asset-{asset_3.json()['id']}"
    assert false_positive_candidate["target_flow_node_id"] == f"flow-node-{flow_3.json()['id']}"
    assert false_positive_candidate["target_edge_id"] == f"flow-{flow_3.json()['id']}"
    assert ips_alert["destination_ip"] == "10.20.1.10"
    assert ips_alert["target_asset_node_id"] == f"asset-{asset_4.json()['id']}"
    assert ips_alert["target_flow_node_id"] == f"flow-node-{flow_4.json()['id']}"
    assert ips_alert["target_edge_id"] == f"flow-{flow_4.json()['id']}"
    assert antivirus_alert["host_ip"] == "10.20.1.10"
    assert antivirus_alert["target_asset_node_id"] == f"asset-{asset_4.json()['id']}"


def test_get_smb_actions_returns_recommended_response_actions():
    response = client.get("/api/simulation/actions/smb-445")

    assert response.status_code == 200
    body = response.json()

    assert body["scenario_id"] == "smb-445-containment"
    assert body["title"] == "445 护网处置建议"
    assert len(body["actions"]) == 2
    assert body["actions"][0]["action_type"] == "blacklist_block"
    assert body["actions"][1]["action_type"] == "host_isolation"
    assert "fw" in body["actions"][0]["target_devices"][0]
    assert body["actions"][0]["ngtos_intent"].startswith("object-group address")
    assert body["actions"][1]["target_entities"][0] == "10.10.32.45"


def test_execute_smb_action_returns_execution_receipt():
    response = client.post(
        "/api/simulation/actions/smb-445/execute",
        json={"action_id": "action-blacklist-block-01"},
    )

    assert response.status_code == 200
    body = response.json()

    assert body["action_id"] == "action-blacklist-block-01"
    assert body["status"] == "executed"
    assert body["executed_device_count"] == 2
    assert "policy_change" in body["generated_event_types"]
    assert body["summary"].startswith("已模拟执行")
