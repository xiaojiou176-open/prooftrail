# Storefront Assets

This directory documents the reviewable source assets for ProofTrail's public
storefront.

## Current asset set

- `../../assets/storefront/prooftrail-social-preview.svg`
  - Purpose: GitHub social preview source asset
  - Message: one public command, one evidence trail, one recovery story
- `../../assets/storefront/prooftrail-social-preview.png`
  - Purpose: GitHub-upload-ready social preview derivative
  - Message: same storefront story as the SVG source, but in a format GitHub can upload directly
- `../../assets/storefront/prooftrail-hero.svg`
  - Purpose: README hero asset and storefront source visual
  - Message: start from the canonical mainline, inspect evidence, then recover
    the exact failing step

## Source of truth

These assets are intentionally text-based so reviewers can diff them like code.

The copy is grounded in:

- `README.md` for the public name and value promise
- `apps/web/src/views/QuickLaunchView.tsx` for the quick-start command deck
- `apps/web/src/views/FlowWorkshopView.tsx` for evidence review and resumable
  recovery

## Replacement slots

- Replace the README hero with a real Quick Launch screenshot once the
  storefront visual pass is ready.
- Upload `../../assets/storefront/prooftrail-social-preview.png` in GitHub
  Settings while keeping the SVG as the reviewable source of truth.
- Keep filenames stable unless the README and Settings references change.
