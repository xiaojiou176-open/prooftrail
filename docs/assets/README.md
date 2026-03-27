# Storefront Assets

This directory documents the reviewable source assets for ProofTrail's public
storefront.

## Current asset set

- `../../assets/storefront/prooftrail-social-preview.svg`
  - Purpose: GitHub social preview source asset
  - Message: one public command, one evidence trail, one recovery story
- `../../assets/storefront/prooftrail-social-preview.png`
  - Purpose: GitHub-upload-ready social preview asset derived from a real product view
  - Message: the operator UI, evidence-first workflow, and parameter rail are visible in one frame
- `../../assets/storefront/prooftrail-hero.png`
  - Purpose: README hero asset based on the real product UI
  - Message: start from the canonical run path, keep the parameter rail visible, and move into evidence review without leaving the product shell
- `../../assets/storefront/prooftrail-hero.svg`
  - Purpose: legacy concept-art hero retained as a reviewable storefront draft
  - Message: original synthetic storefront concept before the real UI screenshot replaced it in README

## Source of truth

The current storefront asset set is intentionally split:

- real product screenshots are the public-facing truth for README / GitHub preview
- SVG concept art stays as an auditable draft reference, not as the primary hero

The copy is grounded in:

- `README.md` for the public name and value promise
- `apps/web/src/views/QuickLaunchView.tsx` for the quick-start command deck
- `apps/web/src/views/FlowWorkshopView.tsx` for evidence review and resumable
  recovery

## Replacement slots

- Upload `../../assets/storefront/prooftrail-social-preview.png` in GitHub
  Settings while keeping the SVG as the reviewable source of truth.
- Keep filenames stable unless the README and Settings references change.
