# NEXUS Master Control Index — 2026-08-13

This index records the active NOSMO Nexus tracks after multiple parallel dialogs, hotfixes, rollbacks and cache-busts.

## Master rule

Relationship Tree / Project Graph remains the persistent Nexus workspace. Person Card, File Loader, Dashboard, Timeline, People, Docs and Tools should open as overlays or panels above the graph, not as separate full applications with unrelated shells.

No automatic merge. No automatic deployment. Verify current GitHub state before working on any track.

## Active tracks

| Track | Repo | Current known anchor | Status | Next action | Protected boundaries |
|---|---|---|---|---|---|
| Master Control | Cross-repo | This index | Active | Keep every track reporting repo / PR / branch / blocker / next step | Do not rely on chat history alone |
| Relationship Tree public recovery | `mateuszfurmanski-droid/NOSMO-website` | `agent/relationship-tree-public-recovery-20260813` | Recovery branch created | Validate branch, then decide whether to open/keep draft PR or apply a minimal public preview change | Do not edit graph bundle, do not redirect to Halifax root app |
| Overlay Host | `mateuszfurmanski-droid/NOSMO-website` | PR #33 `agent/nexus-overlay-host-v2` | Open draft; branch diverged from main | Reconcile after public tree render is stable | Do not merge PR #33 blindly; do not change Person Card visual UI |
| Person Card Kamil | `mateuszfurmanski-droid/NOSMO-website` | `person-card-kamil-v47.html` | Stable UI approved | Only crop / zoom the photo when this track is selected | Do not change layout, colors, menus, icons, logo or yellow-metal variant |
| Android Work Mode | `mateuszfurmanski-droid/nosmo-nexus-mvp` | PR #85 / PR #86 / older PR #41 to verify | Blocked / split state | Verify which Android track is current, then find APK/log path | No HOME intent in #85 without decision; no AI key in APK; no private DB scraping |
| Nexus Cloud / Drive | `mateuszfurmanski-droid/nosmo-nexus-mvp` + Drive | issue #48 / related issues to verify | Architecture active | Keep INBOX/PENDING when classification is uncertain | Do not mix e-SAFE and Riverside files |
| Work Wallet / Safety Connector | `mateuszfurmanski-droid/nosmo-nexus-mvp` + possibly `NOSMO-website` preview | to verify | Missing explicit track; strategic connector | Find existing Work Wallet preview / PRs / issues and attach to this index | Do not claim API/live integration without evidence; Nexus connects, does not replace Work Wallet |
| BIM / FabStation | `mateuszfurmanski-droid/nosmo-nexus` + `nosmo-nexus-mvp` | architecture PR #17, product PR stack #25-#87 | Active but not real-IFC validated | Continue only after current tree recovery or as separate execution track | Do not claim FabStation API/SDK/sync without evidence |
| DoorFlow / Fire Door | separate module + website preview | to verify | Protected workflow module | Keep as overlay/contract into graph; Halifax can be demo world | Do not disturb DoorFlow lifecycle while recovering tree shell |
| Electrical Commissioning | separate module + website preview | to verify | Protected workflow module | Keep as overlay/contract into graph | Do not mix with BIM/FabStation except through contracts |
| Halifax DoorFlow Demo | future Project World + Drive pack | new track | Candidate demo world | Create proper Drive pack and project routing later | Do not mix with e-SAFE or Riverside; do not make it root fallback |

## Immediate recovery order

1. Stabilize public Relationship Tree route.
2. Restore TIME Classic / Tape without blocking graph render.
3. Reconcile overlay host PR #33 only after graph render is stable.
4. Apply Person Card photo crop as a tiny isolated change.
5. Then return to Android APK/log, Cloud/Drive, Work Wallet, BIM/FabStation, DoorFlow/Electrical.

## Current Relationship Tree finding

`main` was verified at `bba11991467fdc4c77fe67303e0eb7df6a4945dc`, after the unified recovery script had been disabled due to a live root regression. A separate recovery branch was created from that exact main head instead of patching live main directly.
