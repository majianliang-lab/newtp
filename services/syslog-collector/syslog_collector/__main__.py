import asyncio

from syslog_collector.server import load_runtime_config
from syslog_collector.server import run_default_syslog_collector
from syslog_collector.server import send_runtime_heartbeat


async def _heartbeat_loop() -> None:
    config = load_runtime_config()

    while True:
        send_runtime_heartbeat(config)
        await asyncio.sleep(config.heartbeat_interval_seconds)


async def _main() -> None:
    config = load_runtime_config()
    transport, _protocol = await run_default_syslog_collector()
    heartbeat_task = asyncio.create_task(_heartbeat_loop())

    try:
        print(
            f"syslog-collector listening on {config.host}:{config.port}, forwarding to {config.api_ingest_url}"
        )
        await asyncio.Future()
    finally:
        heartbeat_task.cancel()
        transport.close()


def main() -> None:
    asyncio.run(_main())


if __name__ == "__main__":
    main()
