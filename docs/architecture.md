# Architecture

ProofTrail is a monorepo for auditable browser automation.

## System Shape

- `apps/api/`: FastAPI backend for orchestration, APIs, and persistence
- `apps/web/`: operator-facing UI for launch, task review, and flow workshop
- `apps/automation-runner/`: record, replay, and reconstruction pipeline
- `apps/mcp-server/`: MCP-facing adapter
- `packages/`: shared orchestration, driver, probe, and prompt logic

## Operating Contracts

- Orchestrator-first: `pnpm uiq <command>` composes profile + target and writes
  the run through one public mainline instead of a manual shell maze.
- Manifest-first: every run writes `.runtime-cache/artifacts/runs/<runId>/`
  evidence that can be inspected, replayed, and discussed later.

## Main Local Flow

1. `just setup`
2. `just run`
3. inspect validation and run artifacts locally

## Runtime Boundaries

- Public source code is tracked in the repository.
- Runtime outputs belong under `.runtime-cache/` and are not part of the public
  source surface.
- Local agent runtime directories, logs, and planning trails are not part of
  the live storefront route.
