import asyncio
import json
from collections.abc import Callable, Iterable
from dataclasses import dataclass
import os
from urllib import request

from syslog_collector.normalizer import normalize_event
from syslog_collector.parser import parse_message

NormalizedEvent = dict[str, str | int]
EventSender = Callable[[str, bytes], None]

DEFAULT_COLLECTOR_HOST = "0.0.0.0"
DEFAULT_COLLECTOR_PORT = 5514
DEFAULT_COLLECTOR_ID = "collector-local-01"
DEFAULT_API_INGEST_URL = "http://localhost:8000/api/events/ingest"
DEFAULT_API_HEARTBEAT_URL = "http://localhost:8000/api/collector/heartbeat"
DEFAULT_HEARTBEAT_INTERVAL_SECONDS = 30


@dataclass(frozen=True)
class RuntimeConfig:
    collector_id: str = DEFAULT_COLLECTOR_ID
    host: str = DEFAULT_COLLECTOR_HOST
    port: int = DEFAULT_COLLECTOR_PORT
    api_ingest_url: str = DEFAULT_API_INGEST_URL
    api_heartbeat_url: str = DEFAULT_API_HEARTBEAT_URL
    heartbeat_interval_seconds: int = DEFAULT_HEARTBEAT_INTERVAL_SECONDS


class EventDispatcher:
    def __init__(self, consumers: Iterable[Callable[[NormalizedEvent], None]] | None = None):
        self._consumers = list(consumers or [])

    def register(self, consumer: Callable[[NormalizedEvent], None]) -> None:
        self._consumers.append(consumer)

    def dispatch(self, event: NormalizedEvent) -> None:
        for consumer in self._consumers:
            consumer(event)


class HttpEventConsumer:
    def __init__(self, ingest_url: str, sender: EventSender | None = None):
        self._ingest_url = ingest_url
        self._sender = sender or _default_sender

    def __call__(self, event: NormalizedEvent) -> None:
        payload = json.dumps(event).encode("utf-8")
        self._sender(self._ingest_url, payload)


class SyslogCollectorProtocol(asyncio.DatagramProtocol):
    def __init__(self, dispatcher: EventDispatcher):
        self.dispatcher = dispatcher

    def datagram_received(self, data: bytes, addr) -> None:  # type: ignore[override]
        message = data.decode("utf-8", errors="ignore")
        parsed = parse_message(message)
        normalized = normalize_event(parsed)
        self.dispatcher.dispatch(normalized)


async def start_syslog_collector(
    host: str, port: int, dispatcher: EventDispatcher
):
    loop = asyncio.get_running_loop()
    return await loop.create_datagram_endpoint(
        lambda: SyslogCollectorProtocol(dispatcher),
        local_addr=(host, port),
    )


def load_runtime_config(env: dict[str, str] | None = None) -> RuntimeConfig:
    source = env or os.environ
    return RuntimeConfig(
        collector_id=source.get("SYSLOG_COLLECTOR_ID", DEFAULT_COLLECTOR_ID),
        host=source.get("SYSLOG_COLLECTOR_HOST", DEFAULT_COLLECTOR_HOST),
        port=int(source.get("SYSLOG_COLLECTOR_PORT", str(DEFAULT_COLLECTOR_PORT))),
        api_ingest_url=source.get("SYSLOG_COLLECTOR_API_INGEST_URL", DEFAULT_API_INGEST_URL),
        api_heartbeat_url=source.get(
            "SYSLOG_COLLECTOR_API_HEARTBEAT_URL", DEFAULT_API_HEARTBEAT_URL
        ),
        heartbeat_interval_seconds=int(
            source.get(
                "SYSLOG_COLLECTOR_HEARTBEAT_INTERVAL_SECONDS",
                str(DEFAULT_HEARTBEAT_INTERVAL_SECONDS),
            )
        ),
    )


def build_default_dispatcher(
    env: dict[str, str] | None = None, sender: EventSender | None = None
) -> EventDispatcher:
    config = load_runtime_config(env)
    dispatcher = EventDispatcher()
    dispatcher.register(HttpEventConsumer(config.api_ingest_url, sender=sender))
    return dispatcher


async def run_default_syslog_collector(
    env: dict[str, str] | None = None, sender: EventSender | None = None
):
    config = load_runtime_config(env)
    dispatcher = build_default_dispatcher(env, sender=sender)
    return await start_syslog_collector(config.host, config.port, dispatcher)


def _default_sender(url: str, payload: bytes) -> None:
    req = request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with _build_local_opener().open(req):
        return None


def _build_local_opener() -> request.OpenerDirector:
    return request.build_opener(request.ProxyHandler({}))


def send_runtime_heartbeat(
    config: RuntimeConfig, sender: EventSender | None = None
) -> None:
    payload = json.dumps(
        {
            "collector_id": config.collector_id,
            "host": config.host,
            "port": config.port,
            "api_ingest_url": config.api_ingest_url,
            "heartbeat_interval_seconds": config.heartbeat_interval_seconds,
        }
    ).encode("utf-8")
    (sender or _default_sender)(config.api_heartbeat_url, payload)
