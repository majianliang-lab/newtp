# Orchestration Explanation Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the AI orchestration workspace more operationally credible by explaining false-positive risk, whitelist preservation reasons, and approval/execution impact more clearly.

**Architecture:** Extend the orchestration API response with richer explanation-oriented fields, then update the web orchestration workspace to render those fields in a compact operator-facing layout. Keep existing routes, prompts, and current supported intent types intact.

**Tech Stack:** FastAPI, pytest, Next.js, React, TypeScript, Vitest

---

### Task 1: Enrich orchestration API explanation payloads

**Files:**
- Modify: `apps/api/app/schemas/orchestration.py`
- Modify: `apps/api/app/services/ai_orchestrator.py`
- Modify: `apps/api/tests/test_intent_parser.py`

- [ ] **Step 1: Write failing API tests**

Add assertions proving the simulation payload now includes:

- false-positive assessment summary
- structured whitelist preservation reasons
- clearer approval/execution impact summaries

- [ ] **Step 2: Run focused API tests to verify failure**

Run: `PYTHONPATH=apps/api /Users/mr.ma/Documents/demo/.venv/bin/pytest apps/api/tests/test_intent_parser.py -v`
Expected: FAIL on the new explanation assertions

- [ ] **Step 3: Implement minimal API changes**

Keep supported intents unchanged, but enrich the returned orchestration payload with explanation-focused fields that the UI can render directly.

- [ ] **Step 4: Re-run focused API tests**

Run: `PYTHONPATH=apps/api /Users/mr.ma/Documents/demo/.venv/bin/pytest apps/api/tests/test_intent_parser.py -v`
Expected: PASS


### Task 2: Surface the richer explanation model in the web workspace

**Files:**
- Modify: `apps/web/components/orchestration/orchestration-workspace.tsx`
- Modify: `apps/web/components/orchestration/orchestration-workspace.test.tsx`

- [ ] **Step 1: Write failing UI tests**

Add assertions for:

- false-positive assessment rendering
- whitelist exception reason rendering
- approval/execution impact summary rendering

- [ ] **Step 2: Run focused web tests to verify failure**

Run: `npm --workspace apps/web run test -- orchestration`
Expected: FAIL on the new UI assertions

- [ ] **Step 3: Implement minimal UI changes**

Show the new explanation fields without breaking the current orchestration flow.

- [ ] **Step 4: Re-run focused web tests**

Run: `npm --workspace apps/web run test -- orchestration`
Expected: PASS


### Task 3: Verify the slice and update handoff docs

**Files:**
- Modify: `docs/architecture/2026-03-23-current-state-and-handoff.md`

- [ ] **Step 1: Run verification**

Run:

- `npm test`
- `npm --workspace apps/web run build`
- `PYTHONPATH=apps/api /Users/mr.ma/Documents/demo/.venv/bin/pytest apps/api/tests -v`

Expected: PASS

- [ ] **Step 2: Update handoff**

Record what explanation-chain enhancements were added and what still remains.

- [ ] **Step 3: Commit and push**

```bash
git add apps/api apps/web docs/architecture/2026-03-23-current-state-and-handoff.md docs/superpowers/plans/2026-03-25-orchestration-explanation-enhancement.md
git commit -m "feat: enrich orchestration explanations"
git push -u origin codex/orchestration-explain
```
