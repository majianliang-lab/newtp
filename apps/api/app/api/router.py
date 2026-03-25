from fastapi import APIRouter

from app.api.accounts import router as accounts_router
from app.api.assets import router as assets_router
from app.api.change_records import router as change_records_router
from app.api.collector import router as collector_router
from app.api.compliance import router as compliance_router
from app.api.control_points import router as control_points_router
from app.api.dashboard import router as dashboard_router
from app.api.devices import router as devices_router
from app.api.events import router as events_router
from app.api.exposures import router as exposures_router
from app.api.flows import router as flows_router
from app.api.health import router as health_router
from app.api.orchestration import router as orchestration_router
from app.api.operations import router as operations_router
from app.api.protection_objects import router as protection_objects_router
from app.api.security_domains import router as security_domains_router
from app.api.simulation import router as simulation_router
from app.api.topology import router as topology_router

api_router = APIRouter()
api_router.include_router(accounts_router)
api_router.include_router(assets_router)
api_router.include_router(change_records_router)
api_router.include_router(collector_router)
api_router.include_router(compliance_router)
api_router.include_router(control_points_router)
api_router.include_router(dashboard_router)
api_router.include_router(devices_router)
api_router.include_router(events_router)
api_router.include_router(exposures_router)
api_router.include_router(flows_router)
api_router.include_router(health_router)
api_router.include_router(orchestration_router)
api_router.include_router(operations_router)
api_router.include_router(protection_objects_router)
api_router.include_router(security_domains_router)
api_router.include_router(simulation_router)
api_router.include_router(topology_router)
