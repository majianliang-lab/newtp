from urllib.parse import quote

from sqlalchemy.orm import Session

from app.models.device import Device
from app.schemas.collector import CollectorStatusRead
from app.schemas.dashboard import DashboardRecentChangeRead
from app.schemas.event_stream import EventRead
from app.schemas.operations import (
    OperationsDeviceRead,
    OperationsDiagnosticRead,
    OperationsDiagnosticGroupRead,
    OperationsDiagnosticTargetRead,
    OperationsEventRead,
    OperationsOverviewRead,
)
from app.services.change_record_store import list_change_records
from app.services.collector_status_store import (
    get_collector_counts,
    list_collector_statuses,
)
from app.services.event_store import list_live_events


def build_operations_overview(db: Session) -> OperationsOverviewRead:
    devices = db.query(Device).all()
    collector_statuses = list_collector_statuses()
    live_events = list_live_events()
    change_records = list_change_records()

    connected_devices = [
        device for device in devices if device.log_ingest_status == "connected"
    ]
    disconnected_devices = [
        device for device in devices if device.log_ingest_status != "connected"
    ]
    collector_total_count, collector_online_count = get_collector_counts()
    high_risk_events = [
        event for event in live_events if str(event.severity).lower() in {"high", "critical", "4", "5"}
    ]
    pending_changes = [
        record for record in change_records if record.status == "pending_approval"
    ]
    offline_collectors = [status for status in collector_statuses if not status.online]
    diagnostics = _build_diagnostics(
        disconnected_devices=disconnected_devices,
        high_risk_events=high_risk_events,
        pending_changes=pending_changes,
        offline_collectors=offline_collectors,
    )

    return OperationsOverviewRead(
        collector_total_count=collector_total_count,
        collector_online_count=collector_online_count,
        device_total_count=len(devices),
        connected_device_count=len(connected_devices),
        disconnected_device_count=len(disconnected_devices),
        log_coverage_rate=round((len(connected_devices) / len(devices)) * 100) if devices else 0,
        collector_coverage_rate=round((collector_online_count / collector_total_count) * 100)
        if collector_total_count
        else 0,
        live_event_count=len(live_events),
        high_risk_event_count=len(high_risk_events),
        pending_change_count=len(pending_changes),
        collector_statuses=collector_statuses,
        disconnected_devices=[
            OperationsDeviceRead(
                id=device.id,
                device_name=device.device_name,
                vendor=device.vendor,
                device_type=device.device_type,
                log_ingest_status=device.log_ingest_status,
                policy_push_capability=device.policy_push_capability,
            )
            for device in disconnected_devices
        ],
        recent_events=[
            OperationsEventRead(
                id=index + 1,
                event_type=event.event_type,
                severity=event.severity,
                destination_ip=event.destination_ip,
            )
            for index, event in enumerate(_sort_events_by_priority(live_events)[:5])
        ],
        recent_changes=[
            DashboardRecentChangeRead(
                record_id=record.record_id,
                source=record.source,
                title=record.title,
                status=record.status,
                related_href=record.related_href,
            )
            for record in change_records[:5]
        ],
        diagnostics=diagnostics,
        diagnostic_groups=_build_diagnostic_groups(diagnostics),
        recommended_actions=_build_recommended_actions(diagnostics),
    )


def _build_diagnostics(
    *,
    disconnected_devices: list[Device],
    high_risk_events: list[EventRead],
    pending_changes: list,
    offline_collectors: list[CollectorStatusRead],
) -> list[OperationsDiagnosticRead]:
    diagnostics: list[OperationsDiagnosticRead] = []
    disconnected_device_count = len(disconnected_devices)
    high_risk_event_count = len(high_risk_events)
    pending_change_count = len(pending_changes)
    offline_collector_count = len(offline_collectors)

    if disconnected_device_count:
        diagnostics.append(
            OperationsDiagnosticRead(
                category="device",
                title="设备接入待补齐",
                summary=f"仍有 {disconnected_device_count} 台设备未接入日志，建议先补录接入信息再推进策略治理。",
                priority=2,
                priority_label="P2",
                impact_count=disconnected_device_count,
                scope_label="device",
                action_label="补录设备与接入",
                action_href="/compliance",
                targets=[
                    OperationsDiagnosticTargetRead(
                        label=device.device_name,
                        href=f"/strategy?searchDevice={quote(device.device_name)}",
                    )
                    for device in sorted(
                        disconnected_devices, key=lambda item: item.device_name
                    )[:3]
                ],
            )
        )

    if high_risk_event_count:
        diagnostics.append(
            OperationsDiagnosticRead(
                category="event",
                title="处理高优先事件",
                summary=f"当前有 {high_risk_event_count} 条高优先事件，建议优先进入事件中心核查证据链。",
                priority=1,
                priority_label="P1",
                impact_count=high_risk_event_count,
                scope_label="event",
                action_label="查看接入事件",
                action_href="/events",
                targets=_build_event_targets(high_risk_events),
            )
        )

    if pending_change_count:
        diagnostics.append(
            OperationsDiagnosticRead(
                category="event",
                title="推进待审批变更",
                summary=f"当前仍有 {pending_change_count} 条待审批变更，可回到策略工作台继续推进审批。",
                priority=3,
                priority_label="P3",
                impact_count=pending_change_count,
                scope_label="change",
                action_label="查看策略审批",
                action_href="/strategy",
                targets=[
                    OperationsDiagnosticTargetRead(
                        label=record.title,
                        href=f"/strategy?recordId={quote(record.record_id)}",
                    )
                    for record in pending_changes[:3]
                ],
            )
        )

    if offline_collector_count:
        diagnostics.append(
            OperationsDiagnosticRead(
                category="collector",
                title="collector 离线待处理",
                summary=f"{'多台' if offline_collector_count > 1 else '支线'} collector 离线，优先检查接入链和网络连通性。",
                priority=1,
                priority_label="P1",
                impact_count=offline_collector_count,
                scope_label="collector",
                action_label="查看接入事件",
                action_href="/events",
                targets=[
                    OperationsDiagnosticTargetRead(
                        label=status.collector_id,
                        href=f"/operations?collectorId={quote(status.collector_id)}",
                    )
                    for status in offline_collectors[:3]
                ],
            )
        )

    if not diagnostics:
        diagnostics.append(
            OperationsDiagnosticRead(
                category="event",
                title="运行态总体稳定",
                summary="采集器和设备接入状态正常，可继续处理实时事件与策略审批。",
                priority=4,
                priority_label="P4",
                impact_count=0,
                scope_label="platform",
                action_label="进入监控与事件",
                action_href="/events",
            )
        )

    return diagnostics[:4]


def _build_diagnostic_groups(
    diagnostics: list[OperationsDiagnosticRead],
) -> list[OperationsDiagnosticGroupRead]:
    collector_items = [
        item for item in diagnostics if "collector" in item.title.lower()
    ]
    device_items = [
        item for item in diagnostics if "设备" in item.title or "设备" in item.summary
    ]
    event_items = [
        item
        for item in diagnostics
        if item not in collector_items and item not in device_items
    ]

    return [
        OperationsDiagnosticGroupRead(
            category="collector",
            title="Collector 异常",
            priority=collector_items[0].priority if collector_items else 4,
            priority_label=collector_items[0].priority_label if collector_items else "P4",
            items=collector_items
            or [
                OperationsDiagnosticRead(
                    category="collector",
                    title="Collector 运行稳定",
                    summary="当前 collector 心跳正常，采集链路暂无离线实例。",
                    priority=4,
                    priority_label="P4",
                    impact_count=0,
                    scope_label="collector",
                    action_label="进入监控与事件",
                    action_href="/events",
                )
            ],
        ),
        OperationsDiagnosticGroupRead(
            category="device",
            title="设备接入异常",
            priority=device_items[0].priority if device_items else 4,
            priority_label=device_items[0].priority_label if device_items else "P4",
            items=device_items
            or [
                OperationsDiagnosticRead(
                    category="device",
                    title="设备接入稳定",
                    summary="当前设备日志接入正常，可继续关注实时事件与策略审批。",
                    priority=4,
                    priority_label="P4",
                    impact_count=0,
                    scope_label="device",
                    action_label="进入策略与设备",
                    action_href="/strategy",
                )
            ],
        ),
        OperationsDiagnosticGroupRead(
            category="event",
            title="事件与处置",
            priority=event_items[0].priority if event_items else 4,
            priority_label=event_items[0].priority_label if event_items else "P4",
            items=event_items
            or [
                OperationsDiagnosticRead(
                    category="event",
                    title="事件与处置稳定",
                    summary="当前没有新的高优先事件或待推进处置，运行态整体稳定。",
                    priority=4,
                    priority_label="P4",
                    impact_count=0,
                    scope_label="event",
                    action_label="进入监控与事件",
                    action_href="/events",
                )
            ],
        ),
    ]


def _build_recommended_actions(
    diagnostics: list[OperationsDiagnosticRead],
) -> list[OperationsDiagnosticRead]:
    category_order = {"event": 0, "collector": 1, "device": 2}
    return sorted(
        diagnostics,
        key=lambda item: (
            item.priority,
            -item.impact_count,
            category_order.get(item.category, 9),
            item.title,
        ),
    )[:3]


def _build_event_targets(
    events: list[EventRead],
) -> list[OperationsDiagnosticTargetRead]:
    targets: list[OperationsDiagnosticTargetRead] = []
    seen_labels: set[str] = set()
    seen_flow_signatures: set[str] = set()

    for event in _sort_events_by_priority(events):
        label = event.destination_ip or event.host_ip or event.source_ip or event.event_type

        if not label or label in seen_labels:
            continue

        href = f"/events?search={quote(label)}"
        if event.destination_ip:
            href = f"{href}&targetLabel={quote(event.destination_ip)}"

        targets.append(
            OperationsDiagnosticTargetRead(
                label=label,
                href=href,
            )
        )
        seen_labels.add(label)

        flow_link = _build_event_topology_target(event)
        if flow_link and flow_link.label not in seen_flow_signatures:
            targets.append(flow_link)
            seen_flow_signatures.add(flow_link.label)

        if len(targets) >= 4:
            break

    return targets


def _build_event_topology_target(
    event: EventRead,
) -> OperationsDiagnosticTargetRead | None:
    if not event.destination_ip or not event.protocol or not event.destination_port:
        return None

    params = [
        ("view", "flow-view"),
        ("search", f"{event.protocol} {event.destination_port} {event.destination_ip}"),
        ("targetType", "flow"),
        ("targetProtocol", str(event.protocol)),
        ("targetPort", str(event.destination_port)),
        ("targetDestination", event.destination_ip),
    ]

    if event.target_flow_node_id:
        params.append(("targetNodeId", event.target_flow_node_id))

    if event.target_edge_id:
        params.append(("targetEdgeId", event.target_edge_id))

    return OperationsDiagnosticTargetRead(
        label=f"{event.protocol}/{event.destination_port} 流向",
        href="/topology?"
        + "&".join(f"{key}={quote(value)}" for key, value in params),
    )


def _sort_events_by_priority(events: list[EventRead]) -> list[EventRead]:
    severity_order = {"critical": 4, "high": 3, "medium": 2, "info": 1}

    return sorted(
        events,
        key=lambda event: (
            severity_order.get(str(event.severity).lower(), 0),
            bool(event.destination_ip),
        ),
        reverse=True,
    )
