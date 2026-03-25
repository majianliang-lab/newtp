from syslog_collector.normalizer import normalize_event


def test_normalize_topsec_hit_log():
    event = normalize_event(
        {
            "device": "TOPSEC-BRANCH-FW-01",
            "vendor": "Topsec",
            "os": "NGTOS",
            "action": "deny",
            "policy": "implicit-deny",
            "src": "10.10.32.45",
            "dst": "10.20.99.45",
            "proto": "tcp",
            "dport": "445",
            "src_zone": "office_zone",
            "dst_zone": "server_zone",
        }
    )

    assert event["event_type"] == "policy_hit"
    assert event["vendor"] == "Topsec"
    assert event["device_id"] == "TOPSEC-BRANCH-FW-01"
    assert event["action"] == "deny"
    assert event["destination_port"] == 445


def test_normalize_policy_change_log():
    event = normalize_event(
        {
            "device": "TOPSEC-BRANCH-FW-01",
            "vendor": "Topsec",
            "os": "NGTOS",
            "event": "policy_change",
            "admin": "soc_admin",
            "change_type": "policy_insert",
            "policy": "deny-eastwest-445",
        }
    )

    assert event["event_type"] == "policy_change"
    assert event["admin"] == "soc_admin"
    assert event["change_type"] == "policy_insert"


def test_normalize_ips_alert_log():
    event = normalize_event(
        {
            "device": "TOPSEC-HQ-IPS-01",
            "vendor": "Topsec",
            "event": "threat",
            "threat_type": "ips",
            "signature_id": "IPS-445-001",
            "severity": "critical",
            "src": "10.10.32.45",
            "dst": "10.20.30.15",
            "dport": "445",
        }
    )

    assert event["event_type"] == "ips_alert"
    assert event["signature_id"] == "IPS-445-001"
    assert event["severity"] == "critical"


def test_normalize_antivirus_alert_log():
    event = normalize_event(
        {
            "device": "TOPSEC-DC-AV-01",
            "vendor": "Topsec",
            "event": "malware",
            "engine": "av",
            "malware_name": "WannaLike.Test",
            "host_ip": "10.20.30.15",
            "severity": "high",
        }
    )

    assert event["event_type"] == "antivirus_alert"
    assert event["malware_name"] == "WannaLike.Test"
    assert event["host_ip"] == "10.20.30.15"
