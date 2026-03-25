from fastapi.testclient import TestClient

from app.main import app
from app.services.intent_parser import parse_intent


client = TestClient(app)


def test_parse_emergency_445_block_intent():
    result = parse_intent("立即阻断全网 TCP 445 横向访问，防止勒索病毒扩散。")

    assert result.port == 445
    assert result.action == "block"
    assert result.scope == "global"
    assert result.scenario == "smb-445-containment"


def test_parse_host_isolation_intent():
    result = parse_intent("立即隔离感染主机 10.10.32.45，阻止进一步扩散。")

    assert result.action == "isolate"
    assert result.scope == "targeted"
    assert result.scenario == "smb-445-containment"


def test_parse_blacklist_block_intent():
    result = parse_intent("根据情报批量封堵黑名单 IP 198.51.100.8 和 203.0.113.5。")

    assert result.action == "blacklist_block"
    assert result.objective == "blacklist_containment"
    assert result.scenario == "blacklist-containment"


def test_parse_service_enable_intent():
    result = parse_intent("为新上线业务放通 ERP 到支付网关的 TCP 443 访问。")

    assert result.action == "allow"
    assert result.port == 443
    assert result.objective == "business_enablement"
    assert result.scenario == "service-enable-change"


def test_parse_exposure_reduction_intent():
    result = parse_intent("收敛公网暴露面，关闭不必要的 RDP 3389 暴露。")

    assert result.action == "reduce_exposure"
    assert result.port == 3389
    assert result.objective == "exposure_reduction"
    assert result.scenario == "exposure-reduction"


def test_orchestration_simulation_returns_replay_and_recommendations():
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

    assert asset_response.status_code == 201
    assert flow_response.status_code == 201

    response = client.post(
        "/api/orchestration/simulate",
        json={"prompt": "立即阻断全网 TCP 445 横向访问，防止勒索病毒扩散。"},
    )

    assert response.status_code == 200
    body = response.json()

    assert body["intent"]["port"] == 445
    assert body["intent"]["scenario"] == "smb-445-containment"
    assert body["replay"]["scenario_id"] == "smb-445-containment"
    assert body["recommended_actions"][0]["action_type"] == "blacklist_block"
    assert body["recommended_exceptions"][0]["policy_id"] == "allow-office-to-file"
    assert body["recommended_exceptions"][0]["target_asset_node_id"] == f"asset-{asset_response.json()['id']}"
    assert body["recommended_exceptions"][0]["target_flow_node_id"] == f"flow-node-{flow_response.json()['id']}"
    assert body["recommended_exceptions"][0]["target_edge_id"] == f"flow-{flow_response.json()['id']}"
    assert body["approval_state"]["status"] == "pending_approval"
    assert "SOC 值班主管" in body["approval_state"]["required_roles"]
    assert body["execution_plan"][0]["title"] == "复核白名单与误杀候选"
    assert body["execution_plan"][1]["status"] == "ready"


def test_orchestration_simulation_supports_host_isolation_intent():
    response = client.post(
        "/api/orchestration/simulate",
        json={"prompt": "立即隔离感染主机 10.10.32.45，阻止进一步扩散。"},
    )

    assert response.status_code == 200
    body = response.json()

    assert body["intent"]["action"] == "isolate"
    assert body["recommended_actions"][0]["action_type"] == "host_isolation"
    assert len(body["recommended_actions"]) == 1
    assert body["approval_state"]["status"] == "pending_approval"


def test_orchestration_simulation_supports_service_enable_intent():
    response = client.post(
        "/api/orchestration/simulate",
        json={"prompt": "为新上线业务放通 ERP 到支付网关的 TCP 443 访问。"},
    )

    assert response.status_code == 200
    body = response.json()

    assert body["intent"]["action"] == "allow"
    assert body["intent"]["scenario"] == "service-enable-change"
    assert body["recommended_actions"][0]["action_type"] == "service_allow"
    assert body["approval_state"]["status"] == "pending_approval"
    assert body["execution_plan"][0]["title"] == "确认业务窗口与放通范围"
    assert len(body["explanation_chain"]) == 3
