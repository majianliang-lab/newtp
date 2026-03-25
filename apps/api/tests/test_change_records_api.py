from fastapi.testclient import TestClient

from app.main import app
from app.services.change_record_store import clear_change_records


client = TestClient(app)


def test_change_records_cover_orchestration_submission_and_simulation_execution():
    clear_change_records()

    submit_response = client.post(
        "/api/orchestration/submit",
        json={"prompt": "立即阻断全网 TCP 445 横向访问，防止勒索病毒扩散。"},
    )

    assert submit_response.status_code == 201
    submitted = submit_response.json()

    assert submitted["status"] == "pending_approval"
    assert submitted["source"] == "orchestration"
    assert submitted["approval_status"] == "pending_approval"

    list_response = client.get("/api/change-records")
    assert list_response.status_code == 200
    listed = list_response.json()
    assert listed[0]["record_id"] == submitted["record_id"]

    approve_response = client.post(f"/api/change-records/{submitted['record_id']}/approve")
    assert approve_response.status_code == 200
    approved = approve_response.json()
    assert approved["status"] == "approved"
    assert approved["approval_status"] == "approved"

    execute_response = client.post(
        "/api/simulation/actions/smb-445/execute",
        json={"action_id": "action-blacklist-block-01"},
    )
    assert execute_response.status_code == 200

    final_list = client.get("/api/change-records").json()
    assert len(final_list) >= 2
    assert final_list[0]["source"] == "war_room"
    assert final_list[0]["status"] == "executed"
    assert final_list[1]["record_id"] == submitted["record_id"]
