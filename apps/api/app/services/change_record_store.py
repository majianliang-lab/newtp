from app.schemas.change_record import ChangeRecordRead

_change_records: list[ChangeRecordRead] = []
_change_record_counter = 0


def list_change_records() -> list[ChangeRecordRead]:
    return [record.model_copy() for record in _change_records]


def create_change_record(
    *,
    source: str,
    title: str,
    status: str,
    approval_status: str,
    summary: str,
    target_devices: list[str],
    target_entities: list[str],
    execution_mode: str,
    related_href: str,
) -> ChangeRecordRead:
    global _change_record_counter

    _change_record_counter += 1
    record = ChangeRecordRead(
        record_id=f"change-{_change_record_counter:03d}",
        source=source,
        title=title,
        status=status,
        approval_status=approval_status,
        summary=summary,
        target_devices=target_devices,
        target_entities=target_entities,
        execution_mode=execution_mode,
        related_href=related_href,
    )
    _change_records.insert(0, record)
    return record.model_copy()


def approve_change_record(record_id: str) -> ChangeRecordRead:
    for index, record in enumerate(_change_records):
        if record.record_id != record_id:
            continue

        approved_record = record.model_copy(
            update={
                "status": "approved",
                "approval_status": "approved",
                "summary": "审批通过，可进入策略下发。"
                if record.source == "orchestration"
                else "审批通过，可继续执行。",
            }
        )
        _change_records[index] = approved_record
        return approved_record.model_copy()

    raise ValueError(f"unknown change record: {record_id}")


def clear_change_records() -> None:
    global _change_record_counter

    _change_records.clear()
    _change_record_counter = 0
