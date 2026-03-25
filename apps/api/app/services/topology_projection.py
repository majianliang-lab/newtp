def build_domain_topology(
    domains: list[dict], assets: list[dict], flows: list[dict]
) -> dict[str, list[dict]]:
    nodes: list[dict] = []
    edges: list[dict] = []
    max_risk_by_domain_id: dict[int, str] = {}

    for asset in assets:
        risk = "high" if asset.get("value_level", 0) >= 4 else "medium"
        current_risk = max_risk_by_domain_id.get(asset["security_domain_id"])
        if current_risk == "high":
            continue
        max_risk_by_domain_id[asset["security_domain_id"]] = risk

    for domain in domains:
        nodes.append(
            {
                "id": f"domain-{domain['id']}",
                "type": "domain",
                "label": domain["name"],
                "risk": max_risk_by_domain_id.get(domain["id"], "medium"),
            }
        )

    for asset in assets:
        nodes.append(
            {
                "id": f"asset-{asset['id']}",
                "type": "asset",
                "label": asset["asset_name"],
                "parent": f"domain-{asset['security_domain_id']}",
                "risk": "high" if asset.get("value_level", 0) >= 4 else "medium",
            }
        )

    for flow in flows:
        edges.append(
            {
                "id": f"flow-{flow['id']}",
                "from": f"domain-{flow['source_domain_id']}",
                "to": f"domain-{flow['destination_domain_id']}",
                "type": "flow",
                "label": f"TCP/{flow['port']}",
                "flow_type": flow.get("flow_type", "flow"),
                "protocol": flow.get("protocol", "tcp"),
                "port": flow["port"],
                "risk": "high" if flow.get("flow_type") == "east_west" else "medium",
            }
        )

    return {"nodes": nodes, "edges": edges}


def build_asset_topology(assets: list[dict], flows: list[dict]) -> dict[str, list[dict]]:
    nodes: list[dict] = []
    edges: list[dict] = []

    for asset in assets:
        nodes.append(
            {
                "id": f"asset-{asset['id']}",
                "type": "asset",
                "label": asset["asset_name"],
                "risk": "high" if asset.get("value_level", 0) >= 4 else "medium",
            }
        )

    for flow in flows:
        edges.append(
            {
                "id": f"flow-{flow['id']}",
                "from": f"asset-{flow['source_asset_id']}",
                "to": f"asset-{flow['destination_asset_id']}",
                "type": "flow",
                "label": f"{flow.get('flow_type', 'flow')} / TCP-{flow['port']}",
                "flow_type": flow.get("flow_type", "flow"),
                "protocol": flow.get("protocol", "tcp"),
                "port": flow["port"],
                "risk": "high" if flow.get("flow_type") == "east_west" else "medium",
            }
        )

    return {"nodes": nodes, "edges": edges}


def build_flow_topology(flows: list[dict]) -> dict[str, list[dict]]:
    nodes: list[dict] = []

    for flow in flows:
        nodes.append(
            {
                "id": f"flow-node-{flow['id']}",
                "type": "flow",
                "label": f"{flow['source_domain_name']}->{flow['destination_domain_name']}",
                "risk": "high" if flow.get("flow_type") == "east_west" else "medium",
                "flow_type": flow.get("flow_type", "flow"),
                "protocol": flow.get("protocol", "tcp"),
                "port": flow["port"],
                "source_asset_label": flow.get("source_asset_label"),
                "destination_asset_label": flow.get("destination_asset_label"),
            }
        )

    return {"nodes": nodes, "edges": []}
