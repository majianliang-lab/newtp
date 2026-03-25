def normalize_event(parsed: dict[str, str]) -> dict[str, str | int]:
    event_name = parsed.get("event", "")
    threat_type = parsed.get("threat_type", "")
    engine = parsed.get("engine", "")

    event_type = "policy_hit"
    if event_name == "policy_change":
        event_type = "policy_change"
    elif event_name == "threat" and threat_type == "ips":
        event_type = "ips_alert"
    elif event_name == "malware" and engine == "av":
        event_type = "antivirus_alert"

    normalized: dict[str, str | int] = {
        "event_type": event_type,
        "vendor": parsed.get("vendor", "unknown"),
        "device_id": parsed.get("device", "unknown"),
        "device_type": parsed.get("device_type", "unknown"),
        "os_type": parsed.get("os", "unknown"),
        "action": parsed.get("action", "unknown"),
        "policy_id": parsed.get("policy", "unknown"),
        "source_ip": parsed.get("src", ""),
        "destination_ip": parsed.get("dst", ""),
        "protocol": parsed.get("proto", ""),
        "destination_port": int(parsed["dport"]) if parsed.get("dport") else 0,
        "source_zone": parsed.get("src_zone", "unknown"),
        "destination_zone": parsed.get("dst_zone", "unknown"),
    }

    for field in (
        "admin",
        "change_type",
        "signature_id",
        "severity",
        "malware_name",
        "host_ip",
        "engine",
        "threat_type",
        "event",
    ):
        if field in parsed:
            normalized[field] = parsed[field]

    return normalized
