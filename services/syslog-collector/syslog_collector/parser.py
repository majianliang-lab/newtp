def parse_message(message: str) -> dict[str, str]:
    cleaned = message.strip()

    if cleaned.startswith("<") and ">" in cleaned:
      cleaned = cleaned.split(">", 1)[1]

    parsed: dict[str, str] = {}

    for token in cleaned.split():
        if "=" not in token:
            continue

        key, value = token.split("=", 1)
        parsed[key] = value

    return parsed
