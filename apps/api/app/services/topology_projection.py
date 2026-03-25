def build_domain_topology(
    domains: list[dict], assets: list[dict], flows: list[dict]
) -> dict[str, list[dict]]:
    nodes: list[dict] = []
    edges: list[dict] = []
    max_risk_by_domain_id: dict[int, str] = {}
    asset_count_by_domain_id: dict[int, int] = {}

    for asset in assets:
        asset_count_by_domain_id[asset["security_domain_id"]] = (
            asset_count_by_domain_id.get(asset["security_domain_id"], 0) + 1
        )
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
                "domain_type": domain.get("domain_type"),
                "protection_object_id": domain.get("protection_object_id"),
                "protection_object_name": domain.get("protection_object_name"),
                "protection_object_level": domain.get("protection_object_level"),
                "owner_team": domain.get("owner_team"),
                "asset_count": asset_count_by_domain_id.get(domain["id"], 0),
                "metadata": {
                    "domain_type": domain.get("domain_type"),
                    "protection_object_name": domain.get("protection_object_name"),
                    "protection_object_level": domain.get("protection_object_level"),
                    "owner_team": domain.get("owner_team"),
                    "asset_count": asset_count_by_domain_id.get(domain["id"], 0),
                },
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
                "asset_type": asset.get("asset_type"),
                "security_domain_id": asset.get("security_domain_id"),
                "security_domain_name": asset.get("security_domain_name"),
                "protection_object_id": asset.get("protection_object_id"),
                "protection_object_name": asset.get("protection_object_name"),
                "protection_object_level": asset.get("protection_object_level"),
                "value_level": asset.get("value_level"),
                "metadata": {
                    "asset_type": asset.get("asset_type"),
                    "security_domain_name": asset.get("security_domain_name"),
                    "protection_object_name": asset.get("protection_object_name"),
                    "protection_object_level": asset.get("protection_object_level"),
                    "value_level": asset.get("value_level"),
                },
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
                "source_domain_name": flow.get("source_domain_name"),
                "destination_domain_name": flow.get("destination_domain_name"),
                "source_asset_label": flow.get("source_asset_label"),
                "destination_asset_label": flow.get("destination_asset_label"),
                "metadata": {
                    "source_domain_name": flow.get("source_domain_name"),
                    "destination_domain_name": flow.get("destination_domain_name"),
                    "source_asset_label": flow.get("source_asset_label"),
                    "destination_asset_label": flow.get("destination_asset_label"),
                },
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
                "asset_type": asset.get("asset_type"),
                "security_domain_id": asset.get("security_domain_id"),
                "security_domain_name": asset.get("security_domain_name"),
                "protection_object_id": asset.get("protection_object_id"),
                "protection_object_name": asset.get("protection_object_name"),
                "protection_object_level": asset.get("protection_object_level"),
                "value_level": asset.get("value_level"),
                "metadata": {
                    "asset_type": asset.get("asset_type"),
                    "security_domain_name": asset.get("security_domain_name"),
                    "protection_object_name": asset.get("protection_object_name"),
                    "protection_object_level": asset.get("protection_object_level"),
                    "value_level": asset.get("value_level"),
                },
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
                "source_domain_name": flow.get("source_domain_name"),
                "destination_domain_name": flow.get("destination_domain_name"),
                "source_asset_label": flow.get("source_asset_label"),
                "destination_asset_label": flow.get("destination_asset_label"),
                "metadata": {
                    "source_domain_name": flow.get("source_domain_name"),
                    "destination_domain_name": flow.get("destination_domain_name"),
                    "source_asset_label": flow.get("source_asset_label"),
                    "destination_asset_label": flow.get("destination_asset_label"),
                },
            }
        )

    return {"nodes": nodes, "edges": edges}


def build_flow_topology(flows: list[dict]) -> dict[str, list[dict]]:
    nodes: list[dict] = []
    edges: list[dict] = []

    for flow in flows:
        flow_node_id = f"flow-node-{flow['id']}"
        nodes.append(
            {
                "id": flow_node_id,
                "type": "flow",
                "label": f"{flow['source_domain_name']}->{flow['destination_domain_name']}",
                "risk": "high" if flow.get("flow_type") == "east_west" else "medium",
                "flow_type": flow.get("flow_type", "flow"),
                "protocol": flow.get("protocol", "tcp"),
                "port": flow["port"],
                "source_asset_label": flow.get("source_asset_label"),
                "destination_asset_label": flow.get("destination_asset_label"),
                "source_domain_name": flow.get("source_domain_name"),
                "destination_domain_name": flow.get("destination_domain_name"),
                "metadata": {
                    "source_domain_name": flow.get("source_domain_name"),
                    "destination_domain_name": flow.get("destination_domain_name"),
                    "source_asset_label": flow.get("source_asset_label"),
                    "destination_asset_label": flow.get("destination_asset_label"),
                },
            }
        )
        edges.append(
            {
                "id": f"flow-edge-{flow['id']}",
                "from": flow_node_id,
                "to": flow_node_id,
                "type": "flow",
                "label": f"{flow.get('source_asset_label') or flow.get('source_domain_name')} -> {flow.get('destination_asset_label') or flow.get('destination_domain_name')}",
                "flow_type": flow.get("flow_type", "flow"),
                "protocol": flow.get("protocol", "tcp"),
                "port": flow["port"],
                "risk": "high" if flow.get("flow_type") == "east_west" else "medium",
                "source_label": flow.get("source_asset_label") or flow.get("source_domain_name"),
                "destination_label": flow.get("destination_asset_label") or flow.get("destination_domain_name"),
                "related_flow_node_id": flow_node_id,
                "source_domain_name": flow.get("source_domain_name"),
                "destination_domain_name": flow.get("destination_domain_name"),
                "source_asset_label": flow.get("source_asset_label"),
                "destination_asset_label": flow.get("destination_asset_label"),
                "key_flows": [
                    {
                        "id": f"key-flow-{flow['id']}",
                        "label": f"{flow.get('source_asset_label') or flow.get('source_domain_name')} -> {flow.get('destination_asset_label') or flow.get('destination_domain_name')}",
                        "source_asset_label": flow.get("source_asset_label"),
                        "destination_asset_label": flow.get("destination_asset_label"),
                        "protocol": flow.get("protocol", "tcp"),
                        "port": flow["port"],
                    }
                ],
                "metadata": {
                    "source_domain_name": flow.get("source_domain_name"),
                    "destination_domain_name": flow.get("destination_domain_name"),
                    "source_asset_label": flow.get("source_asset_label"),
                    "destination_asset_label": flow.get("destination_asset_label"),
                },
            }
        )

    return {"nodes": nodes, "edges": edges}
