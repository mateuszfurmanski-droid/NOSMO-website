# Tile grouping in the existing relationship map

`relationship-map.js` replaces the existing `AU` component in the legacy bundle; `tile-groups.js` contains the pure membership model. It reuses the original objects, icons, graph layout, shell, dock and workflow component. No new application or backend is introduced.

Build: `python scripts/build-tile-groups.py` (idempotent, replaces only the marked component block).

Interaction:
- Initially, every object connects only to the project.
- Drag a tile onto another tile. The destination grows and receives a turquoise ring. Release creates a node with a miniature preview and count. No text or form required.
- Tap a node to expand/collapse its members; drop another tile onto a node to add it. Dropping two nodes together merges their members without nesting.
- Undo reverses the last move/group/reset. Ungroup separates an expanded node; the tiles stay in the project.
- Drop on blank space to reposition. The project cannot be grouped. Pointer cancellation restores the previous state, and pinch zoom cancels a pending tile move.

Persistence: `nosmo-tile-groups:v2:<world>` in localStorage, independently for each Project World. Previous `nosmo-persistent-workspace` keys and manual edges remain untouched for recovery, but the old default mesh and old manual lines are no longer drawn. This is device-local demo storage, not account or server synchronization. Storage errors cancel the change and display a message. Reset is undoable until a subsequent change or reload.

Validation: install `npm install --no-save --package-lock=false --ignore-scripts jsdom@30.1.3 react@19.2.6 react-dom@19.2.6`, then `node --test tests/relationship-tree-repair.test.cjs tests/tile-groups.test.cjs`. Includes actual React component events for touch-style drag/drop, expansion, add, undo, remount, cancel, storage failure and reset, plus model validation and phase navigation regression tests. Real phone touch latency requires device testing; jsdom does not measure frames or hardware responsiveness.

Live browser verification (2026-10-30): Riverside initially rendered 15 edges, all from `proj`. Dragging Fire Door Certificates onto Fire Door Adjustments created a two-item node; opening it exposed both members. Adding Alex Carter increased the count to three; reloading retained all three members. Ungroup restored the individual tiles. e-SAFE independently started with no groups; dragging its BIM document onto BIM / Digital created a separate node, and selecting Design + BIM highlighted that collapsed node. These checks used a desktop browser, not physical Android hardware.

## Catania catalog recovery — 2026-10-30

The e-SAFE index redirects to this map. Its previous standalone catalog never mounted, and the graph runtime loaded `data.js` without `files.js`; the map therefore exposed five core placeholders while all 106 actual filenames were inaccessible.

The existing manifests are now loaded together. The in-map project button, project card and DOCS dock open one catalog: 95 source records, 106 named remote files (104 PDF, 2 videos). Categories, publication dates, sizes, source links and direct source file links come from those manifests. Show in tree reveals any chosen file as a draggable tile, with a reloadable `file=` link. Five existing core IDs remain stable to preserve saved groups. Other source records remain in the catalog until selected, keeping the graph readable.

The deployed NOSMO registry endpoint `/api/projects/NEXUS_DEMO_PROJECT_001_eSAFE_CATANIA/files` returned HTTP 404 and the custom site error page on 2026-10-30. No PDF/video binaries are stored in this repository. Accordingly the UI describes this as a source catalog hosted on Zenodo, not a confirmed upload into NOSMO storage. This repair does not recover or invent a missing upload backend.

Touch corrections: drop detection follows the dragged tile centre regardless of where it was grabbed. Dragging a member out of a node detaches it and dissolves a singleton group, preserving visible positions and Undo.

Validation: `node --test tests/relationship-tree-repair.test.cjs tests/tile-groups.test.cjs tests/tile-detach.test.cjs tests/catania-library.test.cjs` covers catalog counts, manifest hydration, links, filters, actual map/DOCS/catalog/reveal flows, grouped and ungrouped deep links, saved memberships, drag offsets, detach, cancellation and storage errors.

## TimeSpace — 2026-10-31

Catania's existing TIME entry, clock chip, menu Timeline and new TimeSpace button open the same view within the existing map. The 95 source records / 106 files are grouped chronologically across six publication years (18, 33, 11, 17, 9, 18 files). Year, topic and place filters combine, and Show in tree returns to the same persistent graph. Riverside retains its phase navigator.

`data.js` now preserves `dateRaw` and `datePrecision`: 93 day-level records, one year-only record and one month-only record. Normalized January/first-of-month dates remain available for old consumers but are not shown as exact source facts. The view uses publication chronology, not a reconstructed works schedule. For example, Zenodo publishes D5.3 on 2026-03-20 while separately reporting an issued date in 2024; neither is an installation completion date.

Only four records receive source-backed building scope: D5.1 survey (6260847), D2.2 real-pilot models (6497142), D5.4 production/delivery for the real pilot (19126519), and D5.3 real-pilot design (19126674). Evidence: their existing filenames and source descriptions at `https://zenodo.org/records/<record-id>`. D5.3 explicitly names Via Acquicella Porto 27/H. Remaining 102 files start with location unassigned; this includes research, communication and virtual-pilot material. Configured levels 0–4 come from the existing project structure, and no document is automatically assigned to a floor/room/model GUID.

Location selections are explicit local annotations, stored independently at `nosmo.timespace:v1:esafe-demo`, with Undo and source-default restoration. They do not create or modify manual tile groups. Filters persist after reload. Storage failure rolls back the proposed change. There is no account/server synchronization or confirmed IFC/FabStation connection in this view.

Validation adds `tests/timespace-model.test.cjs`, `tests/timespace-time-entry.test.cjs`, `tests/timespace-view.test.cjs` to the existing checks: 31 tests pass, including actual React view/map integration, YEAR × PLACE intersections, partial precision, pending early TIME clicks, modal exclusivity, location assignment/save/reload/undo, storage failure, existing graph memberships and legacy Riverside phases.
