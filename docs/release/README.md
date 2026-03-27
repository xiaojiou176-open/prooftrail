# Release Guide

ProofTrail does not treat the GitHub Releases tab as decorative metadata.

Use releases to answer one public question clearly: what changed, what broke,
what should an evaluator subscribe to, and what proof can they inspect.

## Generate release notes

Use:

```bash
./scripts/release/generate-release-notes.sh
```

The default output lands under `.runtime-cache/artifacts/release/`, but
`RELEASE_NOTES_OUTPUT` can redirect the file during CI or review.

## Generate supply-chain summary artifacts

Use:

```bash
node scripts/release/generate-supply-chain-artifacts.mjs .runtime-cache/artifacts/release/supply-chain
```

These repository-side artifacts are inspection aids. They are not signed
release-grade proof by themselves.

## Create the GitHub release safely

Use:

```bash
./scripts/release/create-github-release.sh v0.1.0
```

This helper refuses to create a release when:

- the worktree is dirty
- local `HEAD` does not match the remote default branch
- release notes have not been generated yet

That guard exists to avoid publishing a release that points at the wrong code
state.

## Release checklist

Every public release should include:

1. user-facing highlights
2. breaking changes or an explicit `None`
3. migration notes when behavior changed
4. links back to the canonical docs surfaces:
   - `docs/showcase/minimal-success-case.md`
   - `docs/reference/run-evidence-example.md`
   - `docs/reference/release-supply-chain-policy.md`
