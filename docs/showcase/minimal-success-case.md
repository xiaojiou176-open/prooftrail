# Minimal Success Case

## What is the smallest real thing this repository can do end-to-end?

Run one canonical browser automation flow, emit one manifest-first evidence
bundle, and leave behind enough structured proof for a human to inspect what
happened, even when a PR gate fails.

This is not a decorative example.

The canonical public mainline can:

1. install the repo with `just setup`
2. execute the main run with `just run`
3. resolve to `pnpm uiq run --profile pr --target web.local`
4. produce a run bundle rooted at `.runtime-cache/artifacts/runs/<runId>/`

After a healthy run, inspect:

- `.runtime-cache/artifacts/runs/<runId>/manifest.json`
- `.runtime-cache/artifacts/runs/<runId>/reports/summary.json`
- `.runtime-cache/artifacts/runs/<runId>/reports/diagnostics.index.json`
- `.runtime-cache/artifacts/runs/<runId>/reports/log-index.json`

`just run-legacy` still exists for lower-level workshop troubleshooting, but it
is not the canonical public mainline. Treat `.runtime-cache/automation/` as a
helper-path output area, not as the canonical public evidence surface.

Internal automation surfaces should resolve `run` to this same command.
