from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_compliance_report_summarizes_filing_objects():
    asset_response = client.post(
        "/api/assets",
        json={
            "asset_name": "ERP-REPORT-01",
            "asset_type": "server",
            "protection_object_id": 1,
            "security_domain_id": 1,
            "value_level": 5,
        },
    )
    exposure_response = client.post(
        "/api/exposures",
        json={
            "public_ip": "198.51.100.55",
            "open_port": 8443,
            "protocol": "tcp",
            "backend_asset_id": asset_response.json()["id"],
            "security_domain_id": 1,
            "log_visibility_status": "connected",
        },
    )
    account_response = client.post(
        "/api/accounts",
        json={
            "account_name": "report_admin",
            "account_type": "admin",
            "permission_level": "high",
            "via_bastion": True,
            "mfa_enabled": True,
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
            "port": 8443,
            "flow_type": "north_south",
        },
    )
    control_point_response = client.post(
        "/api/control-points",
        json={
            "device_id": 1,
            "control_type": "fw-policy",
            "source_domain_id": 1,
            "destination_domain_id": 1,
            "supports_simulation": True,
            "priority": 10,
        },
    )

    assert asset_response.status_code == 201
    assert exposure_response.status_code == 201
    assert account_response.status_code == 201
    assert flow_response.status_code == 201
    assert control_point_response.status_code == 201

    response = client.get("/api/compliance/report")

    assert response.status_code == 200
    body = response.json()

    assert body["filing_readiness"] == 100
    assert "备案对象共 8 类" in body["summary"]
    assert len(body["sections"]) == 8

    sections = {section["section_id"]: section for section in body["sections"]}
    assert sections["assets"]["count"] >= 2
    assert "ERP-REPORT-01" in sections["assets"]["sample_items"]
    assert sections["devices"]["status"] == "ready"
    assert sections["flows"]["workspace_href"] == "/topology?view=flow-view"
