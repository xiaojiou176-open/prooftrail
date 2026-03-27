# Run Evidence Example

The canonical public mainline is `just run`, which resolves to
`pnpm uiq run --profile pr --target web.local`.

When a run succeeds, review the evidence bundle in this order:

1. `.runtime-cache/artifacts/runs/<runId>/manifest.json`
2. `.runtime-cache/artifacts/runs/<runId>/reports/summary.json`
3. `.runtime-cache/artifacts/runs/<runId>/reports/proof.stability.json`
4. `.runtime-cache/artifacts/runs/<runId>/reports/proof.coverage.json`
5. `.runtime-cache/artifacts/runs/<runId>/reports/proof.gaps.json`
6. `.runtime-cache/artifacts/runs/<runId>/reports/proof.repro.json`
7. `.runtime-cache/artifacts/runs/<runId>/reports/diagnostics.index.json`
8. `.runtime-cache/artifacts/runs/<runId>/reports/log-index.json`

Example shape:

```text
.runtime-cache/artifacts/runs/<runId>/
├── manifest.json
└── reports/
    ├── proof.coverage.json
    ├── proof.gaps.json
    ├── proof.repro.json
    ├── proof.stability.json
    ├── summary.json
    ├── diagnostics.index.json
    └── log-index.json
```

The stable public contract is:

- `manifest.json` is the anchor file
- `manifest.proof` points to the four `proof.*.json` artifacts
- `manifest.reports` mirrors those proof paths and the index files for quick lookup

Optional reports such as accessibility, performance, visual, load, AI review,
or security outputs may appear when the selected profile enables them, but they
are not guaranteed by the minimum active mainline contract.

If an internal automation surface executes `run`, it should execute `run` against that canonical chain rather than a helper path.

That means an internal automation surface executes `run` against that canonical chain instead of bypassing it with a helper-only route.

Treat `.runtime-cache/automation/` as helper-path outputs, not the canonical public mainline evidence surface.
