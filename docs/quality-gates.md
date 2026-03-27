# Quality Gates

ProofTrail keeps storefront truth and engineering truth separate on purpose.

## Storefront-facing gates

- `bash scripts/docs-gate.sh`
- `pnpm -s docs:entrypoints:check`
- `pnpm -s docs:surface:check`
- `pnpm -s docs:value-narrative:check`
- `pnpm -s mainline:alignment:check`
- `pnpm -s identity:drift:check`

These answer questions like:

- does the README still explain the right public road?
- do the supporting docs pages actually exist?
- did a legacy name or helper path leak back into the public surface?

## Security and collaboration gates

- `./scripts/security-scan.sh`
- `pnpm -s public:collaboration:check`
- `pnpm -s docs:links:check`
- `bash scripts/github/check-storefront-settings.sh`

These answer questions like:

- are the public collaboration files present and readable?
- are the docs links still valid?
- did secrets or unsafe dependencies leak into the tracked tree?
- are the GitHub storefront settings still aligned with the current public story?
