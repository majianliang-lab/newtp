# Topology Security Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-first intelligent topology management, security orchestration, and NGTOS simulation platform that supports topology visualization, policy simulation, AI-assisted workflows, syslog ingestion, and guard-network response scenarios.

**Architecture:** Use a monorepo with a Next.js web app, a FastAPI control-plane API, PostgreSQL for the object model, Redis for jobs/cache, a Python topology/rule engine, a Python NGTOS device simulator, and a UDP syslog collector. Keep the first version logic-simulated rather than packet-forwarding so the platform can deliver a full closed loop quickly on one machine.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Cytoscape.js or React Flow, FastAPI, SQLAlchemy, PostgreSQL, Redis, Pydantic, Python asyncio, OpenAI GPT-5.4 API, Docker Compose

---

## Proposed File Structure

### Workspace Layout

- Create: `apps/web`
- Create: `apps/api`
- Create: `services/sim-core`
- Create: `services/syslog-collector`
- Create: `packages/contracts`
- Create: `packages/ui`
- Create: `infra/docker-compose.yml`
- Create: `docs/architecture`
- Create: `seed-data`

### Responsibility Map

- `apps/web`: operator-facing product UI, topology views, workbenches, dashboards
- `apps/api`: control plane API, auth, object model CRUD, orchestration endpoints, export endpoints
- `services/sim-core`: NGTOS virtual devices, traffic generator, policy simulation, scenario runner
- `services/syslog-collector`: UDP 514 listener, parser, normalizer, event forwarder
- `packages/contracts`: shared schemas for assets, flows, devices, policies, events
- `packages/ui`: reusable UI components for cards, tables, topology side panels, status chips
- `seed-data`: demo customers, assets, domains, device configs, scenarios

---

### Task 1: Create the monorepo scaffold

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.gitignore`
- Create: `README.md`

- [ ] **Step 1: Write the failing setup check**

Document expected workspace commands in `README.md`:

```text
pnpm install
pnpm dev
```

- [ ] **Step 2: Run setup commands to confirm the workspace is not initialized**

Run: `pnpm install`
Expected: FAIL because workspace files do not exist yet

- [ ] **Step 3: Create the minimal monorepo scaffold**

Add:

- root `package.json`
- `pnpm-workspace.yaml`
- `turbo.json`
- base `.gitignore`

- [ ] **Step 4: Re-run setup bootstrap**

Run: `pnpm install`
Expected: PASS and workspace lockfile is created

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-workspace.yaml turbo.json .gitignore README.md
git commit -m "chore: initialize monorepo scaffold"
```

---

### Task 2: Scaffold the web application shell

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/page.tsx`
- Create: `apps/web/app/globals.css`
- Create: `apps/web/components/navigation/app-shell.tsx`
- Create: `apps/web/components/navigation/sidebar.tsx`
- Create: `apps/web/components/navigation/topbar.tsx`
- Create: `apps/web/components/dashboard/summary-cards.tsx`
- Create: `apps/web/tsconfig.json`

- [ ] **Step 1: Write a failing render test**

Create:

`apps/web/components/navigation/app-shell.test.tsx`

```tsx
import { render, screen } from "@testing-library/react";
import { AppShell } from "./app-shell";

test("renders global navigation for the platform", () => {
  render(<AppShell>content</AppShell>);
  expect(screen.getByText("动态拓扑中心")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter web test app-shell`
Expected: FAIL because app shell files are missing

- [ ] **Step 3: Implement the minimal app shell**

Create the Next.js app shell with:

- left sidebar
- top bar
- content slot
- placeholder summary cards

- [ ] **Step 4: Run the test again**

Run: `pnpm --filter web test app-shell`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web
git commit -m "feat: scaffold web shell and global navigation"
```

---

### Task 3: Create shared contracts for core topology objects

**Files:**
- Create: `packages/contracts/package.json`
- Create: `packages/contracts/src/index.ts`
- Create: `packages/contracts/src/protection-object.ts`
- Create: `packages/contracts/src/security-domain.ts`
- Create: `packages/contracts/src/asset.ts`
- Create: `packages/contracts/src/exposure.ts`
- Create: `packages/contracts/src/account.ts`
- Create: `packages/contracts/src/flow.ts`
- Create: `packages/contracts/src/device.ts`
- Create: `packages/contracts/src/control-point.ts`
- Create: `packages/contracts/src/event.ts`

- [ ] **Step 1: Write a failing schema test**

Create:

`packages/contracts/src/index.test.ts`

```ts
import { assetSchema } from "./asset";

test("asset schema exposes security domain ownership", () => {
  expect(assetSchema.shape.securityDomainId).toBeDefined();
});
```

- [ ] **Step 2: Run the test to confirm failure**

Run: `pnpm --filter @topology/contracts test`
Expected: FAIL because contracts package is missing

- [ ] **Step 3: Implement the schemas**

Use Zod or equivalent to define canonical schemas for:

- assets
- exposures
- accounts
- flows
- devices
- control points

- [ ] **Step 4: Re-run the test**

Run: `pnpm --filter @topology/contracts test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/contracts
git commit -m "feat: add shared contracts for topology objects"
```

---

### Task 4: Build the control-plane API skeleton

**Files:**
- Create: `apps/api/pyproject.toml`
- Create: `apps/api/app/main.py`
- Create: `apps/api/app/config.py`
- Create: `apps/api/app/db.py`
- Create: `apps/api/app/models/__init__.py`
- Create: `apps/api/app/api/router.py`
- Create: `apps/api/app/api/health.py`
- Create: `apps/api/tests/test_health.py`

- [ ] **Step 1: Write the failing API health test**

```python
from fastapi.testclient import TestClient
from app.main import app

def test_health_endpoint():
    client = TestClient(app)
    response = client.get("/api/health")
    assert response.status_code == 200
```

- [ ] **Step 2: Run the test to verify failure**

Run: `cd apps/api && pytest tests/test_health.py -v`
Expected: FAIL because API app is missing

- [ ] **Step 3: Implement the FastAPI skeleton**

Add:

- app entrypoint
- health route
- config
- db bootstrap
- api router

- [ ] **Step 4: Run the test again**

Run: `cd apps/api && pytest tests/test_health.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api
git commit -m "feat: scaffold control plane api"
```

---

### Task 5: Implement the object-model database tables

**Files:**
- Create: `apps/api/app/models/protection_object.py`
- Create: `apps/api/app/models/security_domain.py`
- Create: `apps/api/app/models/asset.py`
- Create: `apps/api/app/models/exposure.py`
- Create: `apps/api/app/models/account.py`
- Create: `apps/api/app/models/flow.py`
- Create: `apps/api/app/models/device.py`
- Create: `apps/api/app/models/control_point.py`
- Create: `apps/api/app/models/event.py`
- Create: `apps/api/alembic.ini`
- Create: `apps/api/alembic/env.py`
- Create: `apps/api/alembic/versions/0001_initial_schema.py`
- Create: `apps/api/tests/test_models.py`

- [ ] **Step 1: Write failing model tests**

```python
def test_asset_has_security_domain_fk():
    from app.models.asset import Asset
    assert "security_domain_id" in Asset.__table__.columns
```

- [ ] **Step 2: Run tests to confirm failure**

Run: `cd apps/api && pytest tests/test_models.py -v`
Expected: FAIL because models are missing

- [ ] **Step 3: Implement the initial schema**

Create tables for:

- protection objects
- security domains
- assets
- exposures
- accounts
- flows
- devices
- control points
- events

- [ ] **Step 4: Re-run the tests**

Run: `cd apps/api && pytest tests/test_models.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/app/models apps/api/alembic apps/api/tests/test_models.py
git commit -m "feat: add core topology database schema"
```

---

### Task 6: Add CRUD APIs for the primary template tables

**Files:**
- Create: `apps/api/app/schemas/asset.py`
- Create: `apps/api/app/schemas/exposure.py`
- Create: `apps/api/app/schemas/account.py`
- Create: `apps/api/app/schemas/flow.py`
- Create: `apps/api/app/schemas/device.py`
- Create: `apps/api/app/schemas/control_point.py`
- Create: `apps/api/app/api/assets.py`
- Create: `apps/api/app/api/exposures.py`
- Create: `apps/api/app/api/accounts.py`
- Create: `apps/api/app/api/flows.py`
- Create: `apps/api/app/api/devices.py`
- Create: `apps/api/app/api/control_points.py`
- Create: `apps/api/tests/test_asset_api.py`

- [ ] **Step 1: Write a failing API test for asset creation**

```python
def test_create_asset():
    payload = {"asset_name": "DC01", "security_domain_id": 1, "asset_type": "server"}
    response = client.post("/api/assets", json=payload)
    assert response.status_code == 201
```

- [ ] **Step 2: Run the test to verify failure**

Run: `cd apps/api && pytest tests/test_asset_api.py -v`
Expected: FAIL because asset endpoint is missing

- [ ] **Step 3: Implement minimal CRUD routes**

Support create/list/get/update for:

- assets
- exposures
- accounts
- flows
- devices
- control points

- [ ] **Step 4: Re-run the test**

Run: `cd apps/api && pytest tests/test_asset_api.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/app/api apps/api/app/schemas apps/api/tests/test_asset_api.py
git commit -m "feat: add primary object crud apis"
```

---

### Task 7: Build the template entry center UI

**Files:**
- Create: `apps/web/app/(platform)/compliance/page.tsx`
- Create: `apps/web/components/forms/template-center.tsx`
- Create: `apps/web/components/forms/asset-form.tsx`
- Create: `apps/web/components/forms/exposure-form.tsx`
- Create: `apps/web/components/forms/account-form.tsx`
- Create: `apps/web/components/forms/flow-form.tsx`
- Create: `apps/web/components/forms/device-form.tsx`
- Create: `apps/web/components/forms/control-point-form.tsx`
- Create: `apps/web/components/forms/template-center.test.tsx`

- [ ] **Step 1: Write a failing UI test**

```tsx
test("template center shows primary entry tabs", () => {
  render(<TemplateCenter />);
  expect(screen.getByText("高价值资产")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test and confirm failure**

Run: `pnpm --filter web test template-center`
Expected: FAIL because the component does not exist

- [ ] **Step 3: Implement the minimal template entry center**

Include tabs for:

- 高价值资产
- 互联网暴露面
- 账号权限矩阵
- 数据流向
- 安全设备
- 控制点

- [ ] **Step 4: Re-run the test**

Run: `pnpm --filter web test template-center`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/(platform)/compliance apps/web/components/forms
git commit -m "feat: add template entry center"
```

---

### Task 8: Implement the topology graph API and projection service

**Files:**
- Create: `apps/api/app/services/topology_projection.py`
- Create: `apps/api/app/api/topology.py`
- Create: `apps/api/tests/test_topology_projection.py`

- [ ] **Step 1: Write a failing projection test**

```python
def test_projection_groups_assets_by_domain():
    graph = build_domain_topology(seed_data)
    assert graph["nodes"][0]["type"] == "domain"
```

- [ ] **Step 2: Run the test to verify failure**

Run: `cd apps/api && pytest tests/test_topology_projection.py -v`
Expected: FAIL because projection service is missing

- [ ] **Step 3: Implement topology projection**

Build graph outputs for:

- domain view
- asset view
- flow view
- exposure view

- [ ] **Step 4: Re-run the test**

Run: `cd apps/api && pytest tests/test_topology_projection.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/app/services/topology_projection.py apps/api/app/api/topology.py apps/api/tests/test_topology_projection.py
git commit -m "feat: add topology projection service"
```

---

### Task 9: Build the dynamic topology center UI

**Files:**
- Create: `apps/web/app/(platform)/topology/page.tsx`
- Create: `apps/web/components/topology/topology-canvas.tsx`
- Create: `apps/web/components/topology/view-switcher.tsx`
- Create: `apps/web/components/topology/details-panel.tsx`
- Create: `apps/web/components/topology/filter-bar.tsx`
- Create: `apps/web/components/topology/topology-canvas.test.tsx`

- [ ] **Step 1: Write a failing topology test**

```tsx
test("renders the security-domain view switcher", () => {
  render(<TopologyCanvas graph={graphFixture} />);
  expect(screen.getByText("安全域视角")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test to confirm failure**

Run: `pnpm --filter web test topology-canvas`
Expected: FAIL because topology center is missing

- [ ] **Step 3: Implement the first topology center**

Support:

- graph rendering
- view switching
- node selection
- edge details
- status filtering

- [ ] **Step 4: Re-run the test**

Run: `pnpm --filter web test topology-canvas`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/(platform)/topology apps/web/components/topology
git commit -m "feat: add dynamic topology center"
```

---

### Task 10: Create the NGTOS virtual device simulator

**Files:**
- Create: `services/sim-core/pyproject.toml`
- Create: `services/sim-core/sim_core/models/device.py`
- Create: `services/sim-core/sim_core/models/policy.py`
- Create: `services/sim-core/sim_core/models/route.py`
- Create: `services/sim-core/sim_core/repository.py`
- Create: `services/sim-core/sim_core/tests/test_device_repository.py`
- Create: `services/sim-core/sim_core/seeds/topsec_branch_fw.json`

- [ ] **Step 1: Write a failing simulator repository test**

```python
def test_load_ngtos_device_seed():
    device = load_device_seed("topsec_branch_fw")
    assert device.vendor == "Topsec"
```

- [ ] **Step 2: Run the test and confirm failure**

Run: `cd services/sim-core && pytest sim_core/tests/test_device_repository.py -v`
Expected: FAIL because sim service is missing

- [ ] **Step 3: Implement the minimal device simulator model**

Support JSON-backed NGTOS-like fields:

- interfaces
- zones
- address objects
- service objects
- policies
- routes
- syslog settings

- [ ] **Step 4: Re-run the test**

Run: `cd services/sim-core && pytest sim_core/tests/test_device_repository.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add services/sim-core
git commit -m "feat: add ngtos virtual device simulator model"
```

---

### Task 11: Add the logical traffic generator

**Files:**
- Create: `services/sim-core/sim_core/traffic/generator.py`
- Create: `services/sim-core/sim_core/traffic/scenarios.py`
- Create: `services/sim-core/sim_core/tests/test_traffic_generator.py`
- Create: `seed-data/traffic/baseline_flows.json`

- [ ] **Step 1: Write a failing traffic generation test**

```python
def test_generate_smb_baseline_flow():
    flows = generate_baseline_flows(seed_fixture)
    assert any(flow.port == 445 for flow in flows)
```

- [ ] **Step 2: Run the test and confirm failure**

Run: `cd services/sim-core && pytest sim_core/tests/test_traffic_generator.py -v`
Expected: FAIL because generator is missing

- [ ] **Step 3: Implement the baseline traffic generator**

Support generated traffic classes:

- normal business flows
- ops/admin flows
- logging flows
- abnormal scan flows

- [ ] **Step 4: Re-run the test**

Run: `cd services/sim-core && pytest sim_core/tests/test_traffic_generator.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add services/sim-core/sim_core/traffic seed-data/traffic
git commit -m "feat: add logical traffic generator"
```

---

### Task 12: Add policy matching and hit-log generation

**Files:**
- Create: `services/sim-core/sim_core/engine/policy_matcher.py`
- Create: `services/sim-core/sim_core/engine/path_resolver.py`
- Create: `services/sim-core/sim_core/tests/test_policy_matcher.py`

- [ ] **Step 1: Write a failing policy match test**

```python
def test_office_to_file_server_matches_allow_policy():
    result = match_flow_to_policy(flow_fixture, device_fixture)
    assert result.action == "permit"
```

- [ ] **Step 2: Run the test to verify failure**

Run: `cd services/sim-core && pytest sim_core/tests/test_policy_matcher.py -v`
Expected: FAIL because matcher is missing

- [ ] **Step 3: Implement the matcher**

The matcher must:

- resolve source and destination domains
- identify the relevant virtual Topsec device
- evaluate policies in order
- emit allow/deny results with matching policy metadata

- [ ] **Step 4: Re-run the test**

Run: `cd services/sim-core && pytest sim_core/tests/test_policy_matcher.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add services/sim-core/sim_core/engine
git commit -m "feat: add policy matching engine"
```

---

### Task 13: Implement the UDP syslog collector

**Files:**
- Create: `services/syslog-collector/pyproject.toml`
- Create: `services/syslog-collector/syslog_collector/server.py`
- Create: `services/syslog-collector/syslog_collector/parser.py`
- Create: `services/syslog-collector/syslog_collector/tests/test_parser.py`

- [ ] **Step 1: Write a failing parser test**

```python
def test_parse_topsec_hit_log():
    parsed = parse_message("<134>device=fw-hq action=deny dport=445")
    assert parsed["action"] == "deny"
```

- [ ] **Step 2: Run the test and verify failure**

Run: `cd services/syslog-collector && pytest syslog_collector/tests/test_parser.py -v`
Expected: FAIL because collector is missing

- [ ] **Step 3: Implement the collector**

Support:

- UDP 514 listener
- key=value parser
- normalized event output

- [ ] **Step 4: Re-run the test**

Run: `cd services/syslog-collector && pytest syslog_collector/tests/test_parser.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add services/syslog-collector
git commit -m "feat: add syslog collector service"
```

---

### Task 14: Build the AI orchestration service

**Files:**
- Create: `apps/api/app/services/ai_orchestrator.py`
- Create: `apps/api/app/services/intent_parser.py`
- Create: `apps/api/app/services/impact_simulator.py`
- Create: `apps/api/app/services/policy_optimizer.py`
- Create: `apps/api/app/api/orchestration.py`
- Create: `apps/api/tests/test_intent_parser.py`

- [ ] **Step 1: Write a failing intent parser test**

```python
def test_parse_emergency_445_block_intent():
    result = parse_intent("立即阻断全网 TCP 445 横向访问，防止勒索病毒扩散。")
    assert result.port == 445
```

- [ ] **Step 2: Run the test to confirm failure**

Run: `cd apps/api && pytest tests/test_intent_parser.py -v`
Expected: FAIL because orchestrator services are missing

- [ ] **Step 3: Implement the minimal orchestration pipeline**

Support:

- natural language intent parsing
- historical hit lookup
- candidate impact analysis
- recommended exception generation

- [ ] **Step 4: Re-run the test**

Run: `cd apps/api && pytest tests/test_intent_parser.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/app/services apps/api/app/api/orchestration.py apps/api/tests/test_intent_parser.py
git commit -m "feat: add ai orchestration pipeline"
```

---

### Task 15: Add the 445 emergency response scenario

**Files:**
- Create: `services/sim-core/sim_core/scenarios/smb_ransomware.py`
- Create: `seed-data/scenarios/smb_ransomware.json`
- Create: `services/sim-core/sim_core/tests/test_smb_ransomware.py`

- [ ] **Step 1: Write a failing scenario test**

```python
def test_scenario_marks_infected_host_and_generates_445_scans():
    state = run_smb_ransomware_scenario()
    assert state.infected_host == "10.10.32.45"
```

- [ ] **Step 2: Run the test and confirm failure**

Run: `cd services/sim-core && pytest sim_core/tests/test_smb_ransomware.py -v`
Expected: FAIL because the scenario runner is missing

- [ ] **Step 3: Implement the scenario**

The scenario must generate:

- suspicious 445 scan traffic
- EDR/NDR style alerts
- candidate business dependencies
- impact data for simulation

- [ ] **Step 4: Re-run the test**

Run: `cd services/sim-core && pytest sim_core/tests/test_smb_ransomware.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add services/sim-core/sim_core/scenarios seed-data/scenarios
git commit -m "feat: add smb ransomware response scenario"
```

---

### Task 16: Build the AI orchestration center UI

**Files:**
- Create: `apps/web/app/(platform)/orchestration/page.tsx`
- Create: `apps/web/components/orchestration/intent-input.tsx`
- Create: `apps/web/components/orchestration/simulation-panel.tsx`
- Create: `apps/web/components/orchestration/recommendation-panel.tsx`
- Create: `apps/web/components/orchestration/execution-panel.tsx`
- Create: `apps/web/components/orchestration/validation-panel.tsx`
- Create: `apps/web/components/orchestration/orchestration-page.test.tsx`

- [ ] **Step 1: Write a failing UI test**

```tsx
test("shows the simulation result panel", () => {
  render(<OrchestrationPage />);
  expect(screen.getByText("仿真结果")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `pnpm --filter web test orchestration-page`
Expected: FAIL because the page is missing

- [ ] **Step 3: Implement the orchestration center**

Include:

- natural language input
- impact simulation results
- optimized policy recommendation list
- execution plan with approval state
- validation results

- [ ] **Step 4: Re-run the test**

Run: `pnpm --filter web test orchestration-page`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/(platform)/orchestration apps/web/components/orchestration
git commit -m "feat: add ai orchestration center"
```

---

### Task 17: Build the guard-network and incident workbench

**Files:**
- Create: `apps/web/app/(platform)/response/page.tsx`
- Create: `apps/web/components/response/guard-dashboard.tsx`
- Create: `apps/web/components/response/blocklist-panel.tsx`
- Create: `apps/web/components/response/host-isolation-panel.tsx`
- Create: `apps/web/components/response/report-panel.tsx`
- Create: `apps/web/components/response/guard-dashboard.test.tsx`

- [ ] **Step 1: Write a failing UI test**

```tsx
test("shows guard-network battle cards", () => {
  render(<GuardDashboard />);
  expect(screen.getByText("黑名单批量处置")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test and confirm failure**

Run: `pnpm --filter web test guard-dashboard`
Expected: FAIL because guard dashboard is missing

- [ ] **Step 3: Implement the workbench**

Include:

- guard posture widgets
- batch blocklist handling
- host isolation queue
- response timeline

- [ ] **Step 4: Re-run the test**

Run: `pnpm --filter web test guard-dashboard`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/(platform)/response apps/web/components/response
git commit -m "feat: add guard-network response workbench"
```

---

### Task 18: Add export pipelines for compliance deliverables

**Files:**
- Create: `apps/api/app/services/exporter.py`
- Create: `apps/api/app/api/exports.py`
- Create: `apps/api/tests/test_exporter.py`

- [ ] **Step 1: Write a failing exporter test**

```python
def test_export_asset_register():
    file_bytes = export_asset_register(seed_context)
    assert len(file_bytes) > 0
```

- [ ] **Step 2: Run the test to verify failure**

Run: `cd apps/api && pytest tests/test_exporter.py -v`
Expected: FAIL because exporter is missing

- [ ] **Step 3: Implement the basic exporters**

Support exports for:

- asset register
- exposure register
- account matrix
- flow matrix
- device register
- dynamic topology snapshot metadata

- [ ] **Step 4: Re-run the test**

Run: `cd apps/api && pytest tests/test_exporter.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/app/services/exporter.py apps/api/app/api/exports.py apps/api/tests/test_exporter.py
git commit -m "feat: add compliance export pipelines"
```

---

### Task 19: Compose local infrastructure and seed demo data

**Files:**
- Create: `infra/docker-compose.yml`
- Create: `infra/.env.example`
- Create: `seed-data/demo-enterprise.json`
- Create: `seed-data/devices/topsec-hq-fw.json`
- Create: `seed-data/devices/topsec-dc-fw.json`
- Create: `seed-data/devices/topsec-office-fw.json`
- Create: `seed-data/scenarios/new-employee-onboarding.json`

- [ ] **Step 1: Write a failing startup note**

Add to `README.md` the intended startup command:

```text
docker compose -f infra/docker-compose.yml up
```

- [ ] **Step 2: Try to start the stack before infra exists**

Run: `docker compose -f infra/docker-compose.yml up`
Expected: FAIL because compose file is missing

- [ ] **Step 3: Create local infra definitions**

Compose should include:

- postgres
- redis
- api
- web
- sim-core
- syslog-collector

- [ ] **Step 4: Re-run the stack start**

Run: `docker compose -f infra/docker-compose.yml up`
Expected: services boot or fail only on missing implementation details

- [ ] **Step 5: Commit**

```bash
git add infra seed-data README.md
git commit -m "feat: add local infra and demo seed data"
```

---

### Task 20: Verification and polish

**Files:**
- Modify: `README.md`
- Modify: `docs/architecture/overview.md`
- Modify: `apps/web`
- Modify: `apps/api`
- Modify: `services/sim-core`
- Modify: `services/syslog-collector`

- [ ] **Step 1: Run frontend tests**

Run: `pnpm --filter web test`
Expected: PASS

- [ ] **Step 2: Run API tests**

Run: `cd apps/api && pytest`
Expected: PASS

- [ ] **Step 3: Run simulator tests**

Run: `cd services/sim-core && pytest`
Expected: PASS

- [ ] **Step 4: Run collector tests**

Run: `cd services/syslog-collector && pytest`
Expected: PASS

- [ ] **Step 5: Run one end-to-end local scenario**

Run the 445 scenario and verify:

- AI intent parsed
- simulation generated impact numbers
- optimized policy suggested
- hit logs emitted

- [ ] **Step 6: Commit**

```bash
git add README.md docs/architecture/overview.md apps/web apps/api services/sim-core services/syslog-collector
git commit -m "chore: verify local topology platform mvp"
```

---

## Notes

- Replace placeholder tests and code snippets with the real framework setup chosen during implementation.
- Because the current workspace is not a git repository, initialize git before using the commit steps above.
- Keep the first release logic-simulated; do not expand to real packet forwarding until the closed loop is stable.
- Use the design spec at `docs/superpowers/specs/2026-03-23-topology-management-platform-design.md` as the source of truth.
