import json
from pathlib import Path

from sim_core.traffic.scenarios import SimulatedFlow


def load_flow_seed(path: Path) -> list[dict]:
    return json.loads(path.read_text(encoding="utf-8"))


def generate_baseline_flows(seed_fixture: list[dict]) -> list[SimulatedFlow]:
    return [
        SimulatedFlow(
            flow_id=entry["flow_id"],
            source_ip=entry["source_ip"],
            destination_ip=entry["destination_ip"],
            protocol=entry["protocol"],
            port=entry["port"],
            flow_type=entry["flow_type"],
            direction=entry["direction"],
            packets_per_second=entry["packets_per_second"],
        )
        for entry in seed_fixture
    ]


def generate_scan_flows(source_ip: str, target_ips: list[str], port: int) -> list[SimulatedFlow]:
    return [
        SimulatedFlow(
            flow_id=f"scan-{source_ip}-{target_ip}-{port}",
            source_ip=source_ip,
            destination_ip=target_ip,
            protocol="tcp",
            port=port,
            flow_type="attack_scan",
            direction="attack",
            packets_per_second=2000,
        )
        for target_ip in target_ips
    ]
