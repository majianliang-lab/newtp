import asyncio
import socket
from urllib import request

import pytest

from syslog_collector.normalizer import normalize_event
from syslog_collector.server import EventDispatcher
from syslog_collector.server import HttpEventConsumer
from syslog_collector.server import SyslogCollectorProtocol
from syslog_collector.server import _build_local_opener
from syslog_collector.server import build_default_dispatcher
from syslog_collector.server import load_runtime_config
from syslog_collector.server import send_runtime_heartbeat
from syslog_collector.server import start_syslog_collector


def test_event_dispatcher_fans_out_to_multiple_consumers():
    primary: list[dict[str, str | int]] = []
    secondary: list[dict[str, str | int]] = []
    dispatcher = EventDispatcher([primary.append, secondary.append])

    event = {
        "event_type": "policy_hit",
        "device_id": "fw-hq",
        "action": "deny",
        "destination_port": 445,
    }

    dispatcher.dispatch(event)

    assert primary == [event]
    assert secondary == [event]


def test_protocol_normalizes_and_dispatches_event():
    events: list[dict[str, str | int]] = []
    dispatcher = EventDispatcher([events.append])
    protocol = SyslogCollectorProtocol(dispatcher)

    protocol.datagram_received(
        b"<134>device=fw-hq vendor=Topsec action=deny dport=445 src=10.10.32.45 dst=10.20.99.45 proto=tcp",
        ("127.0.0.1", 5514),
    )

    assert events == [
        normalize_event(
            {
                "device": "fw-hq",
                "vendor": "Topsec",
                "action": "deny",
                "dport": "445",
                "src": "10.10.32.45",
                "dst": "10.20.99.45",
                "proto": "tcp",
            }
        )
    ]


def test_http_event_consumer_posts_event_to_api():
    captured: dict[str, str | bytes] = {}

    def fake_sender(url: str, payload: bytes) -> None:
        captured["url"] = url
        captured["payload"] = payload

    consumer = HttpEventConsumer(
        ingest_url="http://localhost:8000/api/events/ingest", sender=fake_sender
    )

    consumer(
        {
            "event_type": "ips_alert",
            "device_id": "ips-hq",
            "action": "alert",
            "destination_port": 445,
        }
    )

    assert captured["url"] == "http://localhost:8000/api/events/ingest"
    assert b'"event_type": "ips_alert"' in captured["payload"]
    assert b'"destination_port": 445' in captured["payload"]


def test_build_default_dispatcher_registers_http_consumer():
    captured: dict[str, str | bytes] = {}

    def fake_sender(url: str, payload: bytes) -> None:
        captured["url"] = url
        captured["payload"] = payload

    dispatcher = build_default_dispatcher(
        env={"SYSLOG_COLLECTOR_API_INGEST_URL": "http://localhost:8000/api/events/ingest"},
        sender=fake_sender,
    )

    dispatcher.dispatch(
        {
            "event_type": "policy_hit",
            "device_id": "fw-hq",
            "action": "deny",
            "destination_port": 445,
        }
    )

    assert captured["url"] == "http://localhost:8000/api/events/ingest"
    assert b'"event_type": "policy_hit"' in captured["payload"]


def test_load_runtime_config_reads_env_overrides():
    config = load_runtime_config(
        {
            "SYSLOG_COLLECTOR_ID": "collector-edge-01",
            "SYSLOG_COLLECTOR_HOST": "127.0.0.1",
            "SYSLOG_COLLECTOR_PORT": "5515",
            "SYSLOG_COLLECTOR_API_INGEST_URL": "http://localhost:9000/api/events/ingest",
            "SYSLOG_COLLECTOR_API_HEARTBEAT_URL": "http://localhost:9000/api/collector/heartbeat",
            "SYSLOG_COLLECTOR_HEARTBEAT_INTERVAL_SECONDS": "15",
        }
    )

    assert config.collector_id == "collector-edge-01"
    assert config.host == "127.0.0.1"
    assert config.port == 5515
    assert config.api_ingest_url == "http://localhost:9000/api/events/ingest"
    assert config.api_heartbeat_url == "http://localhost:9000/api/collector/heartbeat"
    assert config.heartbeat_interval_seconds == 15


def test_send_runtime_heartbeat_posts_collector_status():
    captured: dict[str, str | bytes] = {}

    def fake_sender(url: str, payload: bytes) -> None:
        captured["url"] = url
        captured["payload"] = payload

    config = load_runtime_config(
        {
            "SYSLOG_COLLECTOR_ID": "collector-edge-01",
            "SYSLOG_COLLECTOR_HOST": "127.0.0.1",
            "SYSLOG_COLLECTOR_PORT": "5515",
            "SYSLOG_COLLECTOR_API_INGEST_URL": "http://localhost:9000/api/events/ingest",
            "SYSLOG_COLLECTOR_API_HEARTBEAT_URL": "http://localhost:9000/api/collector/heartbeat",
            "SYSLOG_COLLECTOR_HEARTBEAT_INTERVAL_SECONDS": "15",
        }
    )

    send_runtime_heartbeat(config, sender=fake_sender)

    assert captured["url"] == "http://localhost:9000/api/collector/heartbeat"
    assert b'"collector_id": "collector-edge-01"' in captured["payload"]
    assert b'"heartbeat_interval_seconds": 15' in captured["payload"]


def test_build_local_opener_disables_proxy_handler():
    opener = _build_local_opener()

    assert "ProxyHandler" not in [type(handler).__name__ for handler in opener.handlers]
    assert any(
        isinstance(handler, request.HTTPHandler) for handler in opener.handlers
    )


@pytest.mark.anyio
async def test_udp_collector_receives_datagram():
    events: list[dict[str, str | int]] = []
    dispatcher = EventDispatcher([events.append])
    transport, _protocol = await start_syslog_collector("127.0.0.1", 0, dispatcher)

    try:
        port = transport.get_extra_info("sockname")[1]
        client = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        client.sendto(
            b"<134>device=fw-hq vendor=Topsec action=deny dport=445",
            ("127.0.0.1", port),
        )
        client.close()
        await asyncio.sleep(0.05)
    finally:
        transport.close()

    assert events
    assert events[0]["action"] == "deny"
    assert events[0]["event_type"] == "policy_hit"
