# Human-First 10 Minute Start

This page is for the first run when you want the fewest moving parts possible.

## The public road

- `just run`: canonical public mainline wrapper for `pnpm uiq run --profile pr --target web.local`
- `just run-legacy`: lower-level record/extract/replay helper path, not the public default mainline

Internal automation surfaces should map `run` to that same orchestrator-first command, not to a helper path, not the public default mainline, and not to an older manual workshop entry.

## Step 1 - Check prerequisites

You need:

- Python 3.11+
- Node.js 20+
- `pnpm`
- `uv`
- `just`

## Step 2 - Install the workspace

```bash
just setup
```

Expected result:

- Python dependencies sync through `uv`
- workspace packages install through `pnpm`
- browser dependencies for the automation runner are available locally

## Step 3 - Run the canonical flow

```bash
just run
```

Expected result:

- a run is emitted under `.runtime-cache/artifacts/runs/<runId>/`
- the run writes `manifest.json` and report files you can inspect
- the command may still exit non-zero if PR gates fail, but the evidence bundle
  remains the first place to inspect what happened

## If it fails

Start in this order:

1. confirm the direct orchestrator command also resolves: `pnpm uiq run --profile pr --target web.local`
2. inspect the run surface guide at [docs/reference/run-evidence-example.md](../reference/run-evidence-example.md)
3. use `just run-legacy` only when you are intentionally debugging the helper path, not the public default mainline
