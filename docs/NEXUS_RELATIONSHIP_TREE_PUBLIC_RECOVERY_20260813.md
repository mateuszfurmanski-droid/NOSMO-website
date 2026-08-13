# NEXUS Relationship Tree Public Recovery — 2026-08-13

## Scope

This recovery branch is intentionally narrow. It does not merge, deploy, edit the graph runtime bundle, alter Person Card visual design, or modify Halifax / DoorFlow / Android / BIM code.

## Current branch

- Repository: `mateuszfurmanski-droid/NOSMO-website`
- Branch: `agent/relationship-tree-public-recovery-20260813`
- Base inspected: `main` at `bba11991467fdc4c77fe67303e0eb7df6a4945dc`

## Problem being addressed

The public Relationship Tree route had multiple overlapping recovery attempts after mobile regressions:

- previous unified recovery script caused a root render regression on Android Chrome,
- `main` now disables that unified recovery script,
- top rail exists, but Project duplication had been hidden through a broad persistent DOM observer,
- the previous good Timeline Classic / Tape switch from commit `a5491b2a9d30fb6b4aaa1c08404137271d18201c` was no longer present on `main`.

## Code changed

Changed file:

- `apps/nexus-graph-preview/relationship-tree/nexus-relationship-tree-shell-controller.js`

Changes:

1. Restores TIME panel Classic / Tape switch.
2. Tape view uses recorder / tape-player style controls.
3. Keeps Classic view as the existing full timeline controls.
4. Replaces the always-on duplicate Project deduper `MutationObserver` with:
   - static CSS for the known top-menu duplicate Project Worlds section,
   - timed one-shot checks for the bottom duplicate Project / Projects dock tile.
5. Keeps the mobile viewport recovery guard from current `main`.
6. Keeps e-SAFE / Riverside world switching route-based.

## Explicitly not changed

- No graph bundle edits.
- No root Halifax app edits.
- No `controller.html` entrypoint.
- No redirect from `/relationship-tree/`.
- No Person Card visual changes.
- No Android APK / PR #41 / PR #85 changes.
- No Cloud / Drive routing changes.
- No DoorFlow lifecycle change.

## Halifax note

Halifax remains a valid future Project World for a DoorFlow demonstration, but it must be set up as its own properly separated demo world and Drive pack. It must not replace e-SAFE or Riverside and must not be mixed into either project world.

Suggested Halifax track:

- Project World: `halifax-doorflow-demo`
- Purpose: DoorFlow / fire-door register demonstration
- Required Drive pack: source plans, door schedule, evidence/photos, register export, run notes, audit/provenance
- Rule: files go to the Halifax project world only, never e-SAFE or Riverside

## Manual checklist after preview/deploy

- e-SAFE route renders graph, not Halifax root app.
- Riverside route renders graph, not Halifax root app.
- Top rail is exactly MENU / PROJECT / TIME / FILES / TOOLS.
- MENU no longer shows Project Worlds.
- Bottom dock no longer shows duplicate Project / Projects tile.
- PROJECT top tile switches e-SAFE / Riverside.
- TIME opens Classic / Tape.
- Classic keeps full timeline controls.
- Tape looks like a recorder / tape-player panel.
- ESC closes open shell panels.
- No white bottom strip on Android Chrome / Samsung.
