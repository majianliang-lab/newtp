from syslog_collector.parser import parse_message


def test_parse_topsec_hit_log():
    parsed = parse_message(
        "<134>device=fw-hq vendor=Topsec os=NGTOS action=deny dport=445 src=10.10.32.45 dst=10.20.30.15"
    )

    assert parsed["vendor"] == "Topsec"
    assert parsed["action"] == "deny"
    assert parsed["dport"] == "445"
