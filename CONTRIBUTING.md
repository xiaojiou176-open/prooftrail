# Contributing

Thanks for helping improve ProofTrail.

## Before you open a pull request

1. Sync your branch with `main`.
2. Run the smallest relevant validation for your change.
3. Update documentation when behavior, configuration, or API surface changes.
4. Do not commit `.env` files, secrets, runtime artifacts, caches, or local environment files.

## Local setup

```bash
just setup
just run
```

## Required checks

At minimum, run the checks that match your change:

```bash
bash scripts/docs-gate.sh
./scripts/security-scan.sh
```

If your change touches the public collaboration surface, also run:

```bash
pnpm public:redaction:check
pnpm public:history:check
pnpm public:readiness:deep-check
```

If your change touches container, runtime bootstrap, or environment assembly,
also run:

```bash
./scripts/preflight.sh
```

For storefront changes, make sure the public route still makes sense to a first
time visitor:

- README answers what ProofTrail is, who it is for, and what to try first
- `just run` remains the canonical public mainline
- supporting docs routes in `docs/index.md` still resolve

## Pull request expectations

- Keep changes scoped and explain the user-visible impact.
- Add or update tests for logic changes.
- Keep docs and implementation in sync.
- Include the commands you used for validation.

## Contribution license

By contributing, you confirm that you have the right to submit your work under
this repository's MIT license.
