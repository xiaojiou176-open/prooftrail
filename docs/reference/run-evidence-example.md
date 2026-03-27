# Run Evidence Example

The canonical public mainline is `just run`, which resolves to
`pnpm uiq run --profile pr --target web.local`.

When a run succeeds, review the evidence bundle in this order:

1. `.runtime-cache/artifacts/runs/<runId>/manifest.json`
2. `.runtime-cache/artifacts/runs/<runId>/reports/summary.json`
3. `.runtime-cache/artifacts/runs/<runId>/reports/diagnostics.index.json`
4. `.runtime-cache/artifacts/runs/<runId>/reports/log-index.json`

Example shape:

```text
.runtime-cache/artifacts/runs/<runId>/
├── manifest.json
└── reports/
    ├── summary.json
    ├── diagnostics.index.json
    └── log-index.json
```

If an internal automation surface executes `run`, it should execute `run` against that canonical chain rather than a helper path.

That means an internal automation surface executes `run` against that canonical chain instead of bypassing it with a helper-only route.

Treat `.runtime-cache/automation/` as helper-path outputs, not the canonical public mainline evidence surface.
