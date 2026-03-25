# Topology Detail Linkage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the topology workspace from a demo-level viewer into a more operator-friendly work surface with richer object metadata and stronger flow linkage.

**Architecture:** Extend topology API projections to return stable node and edge metadata that reflects original objects, then update the web topology workspace and details panel to consume and present that metadata without changing the existing routing model. Keep the change focused on topology so events/orchestration links continue to work as-is.

**Tech Stack:** FastAPI, pytest, Next.js, React, TypeScript, Vitest

---

### Task 1: Enrich topology projection payloads

**Files:**
- Modify: `apps/api/app/api/topology.py`
- Modify: `apps/api/app/services/topology_projection.py`
- Modify: `apps/api/tests/test_topology_projection.py`
- Modify: `apps/api/tests/test_topology_api.py`

- [ ] **Step 1: Write failing projection tests**

Add assertions for:

- asset/domain nodes carrying original object metadata needed by the details panel
- flow view returning operator-meaningful edge records rather than an empty edge list

- [ ] **Step 2: Run focused API tests to verify failure**

Run: `/Users/mr.ma/Documents/demo/.venv/bin/pytest apps/api/tests/test_topology_projection.py apps/api/tests/test_topology_api.py -v`
Expected: FAIL on the new topology metadata assertions

- [ ] **Step 3: Implement minimal API changes**

Return:

- domain labels and grouped ownership hints for domain nodes
- value level and domain metadata for asset nodes
- protocol/port/risk/source/destination metadata for flow view edges

- [ ] **Step 4: Re-run focused API tests**

Run: `/Users/mr.ma/Documents/demo/.venv/bin/pytest apps/api/tests/test_topology_projection.py apps/api/tests/test_topology_api.py -v`
Expected: PASS


### Task 2: Surface richer topology details in the web workspace

**Files:**
- Modify: `apps/web/components/topology/topology-canvas.tsx`
- Modify: `apps/web/components/topology/details-panel.tsx`
- Modify: `apps/web/components/topology/topology-workspace.tsx`
- Modify: `apps/web/components/topology/topology-workspace.test.tsx`
- Modify: `apps/web/components/topology/topology-canvas.test.tsx`

- [ ] **Step 1: Write failing UI tests**

Add assertions for:

- enriched asset/domain detail fields being shown in the details panel
- flow view showing key-flow entries from the API edge payload
- details panel links still preserving exact topology/event focus parameters

- [ ] **Step 2: Run focused web tests to verify failure**

Run: `npm --workspace apps/web run test -- topology`
Expected: FAIL on the new topology detail assertions

- [ ] **Step 3: Implement minimal UI changes**

Update the topology types and rendering so that:

- selected assets/domains show their original metadata
- selected flow nodes/edges show clearer source-target context
- flow view key-flow list works from actual edges instead of appearing empty

- [ ] **Step 4: Re-run focused web tests**

Run: `npm --workspace apps/web run test -- topology`
Expected: PASS


### Task 3: Verify the full slice and record the handoff

**Files:**
- Modify: `docs/architecture/2026-03-23-current-state-and-handoff.md`

- [ ] **Step 1: Run topology verification commands**

Run:

- `npm test`
- `npm --workspace apps/web run build`
- `/Users/mr.ma/Documents/demo/.venv/bin/pytest apps/api/tests -v`

Expected: PASS

- [ ] **Step 2: Update the handoff doc**

Record:

- what topology metadata was added
- which topology detail and linkage behaviors are now supported
- what still remains for later

- [ ] **Step 3: Commit and push**

```bash
git add apps/api apps/web docs/architecture/2026-03-23-current-state-and-handoff.md docs/superpowers/plans/2026-03-25-topology-detail-linkage.md
git commit -m "feat: enrich topology detail linkage"
git push -u origin codex/topology-detail-linkage
```
