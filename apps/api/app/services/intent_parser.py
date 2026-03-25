import re

from app.schemas.orchestration import ParsedIntentRead


def parse_intent(prompt: str) -> ParsedIntentRead:
    normalized_prompt = prompt.lower()

    protocol = detect_protocol(normalized_prompt)
    port = detect_port(prompt, normalized_prompt)

    if "隔离" in prompt:
        action = "isolate"
    elif "黑名单" in prompt or ("情报" in prompt and ("封堵" in prompt or "阻断" in prompt)):
        action = "blacklist_block"
    elif "放通" in prompt or "开通" in prompt:
        action = "allow"
    elif "暴露面" in prompt or ("收敛" in prompt and ("公网" in prompt or "暴露" in prompt)):
        action = "reduce_exposure"
    elif "阻断" in prompt or "封堵" in prompt:
        action = "block"
    else:
        action = "review"
    scope = "global" if ("全网" in prompt or "批量" in prompt or "公网" in prompt) else "targeted"
    objective = map_objective(prompt, action)
    scenario = map_scenario(action, port)

    return ParsedIntentRead(
        action=action,
        scope=scope,
        protocol=protocol,
        port=port,
        objective=objective,
        scenario=scenario,
    )


def detect_protocol(normalized_prompt: str) -> str:
    if "tcp" in normalized_prompt:
        return "tcp"
    if "udp" in normalized_prompt:
        return "udp"
    if "https" in normalized_prompt or "http" in normalized_prompt or "rdp" in normalized_prompt:
        return "tcp"
    return "unknown"


def detect_port(prompt: str, normalized_prompt: str) -> int:
    if "445" in prompt:
        return 445
    if "3389" in prompt or "rdp" in normalized_prompt:
        return 3389
    if "443" in prompt or "https" in normalized_prompt:
        return 443
    if "3306" in prompt or "mysql" in normalized_prompt:
        return 3306
    if "22" in prompt or "ssh" in normalized_prompt:
        return 22
    if "80" in prompt or "http" in normalized_prompt:
        return 80

    match = re.search(r"(?<![\d.])(\d{2,5})(?![\d.])", prompt)
    return int(match.group(1)) if match else 0


def map_objective(prompt: str, action: str) -> str:
    if action == "isolate":
        return "infected_host_isolation"
    if action == "blacklist_block":
        return "blacklist_containment"
    if action == "allow":
        return "business_enablement"
    if action == "reduce_exposure":
        return "exposure_reduction"
    if "勒索" in prompt or "横向" in prompt:
        return "ransomware_containment"
    return "policy_review"


def map_scenario(action: str, port: int) -> str:
    if action == "isolate" or (action == "block" and port == 445):
        return "smb-445-containment"
    if action == "blacklist_block":
        return "blacklist-containment"
    if action == "allow":
        return "service-enable-change"
    if action == "reduce_exposure":
        return "exposure-reduction"
    return "generic-simulation"
