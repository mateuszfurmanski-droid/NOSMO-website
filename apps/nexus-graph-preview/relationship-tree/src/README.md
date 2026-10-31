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

## Restored media-player TimeSpace — 2026-10-31

The primary TimeSpace surface now reuses the original `nx-pti` console, transport bank, right-hand knob position, LED/status strip and event card. Its stylesheet is recovered from commit `4fde8bd`; the year/place catalog remains an auxiliary view opened from the console. There is no VOL, fake recording or fake screen-recording control.

The slider indexes individual chronological files (all 106 source files, including every member of multi-file records). Previous/Next select one file, and Play advances file by file. The right-hand FILE icon toggles a preview above the console; when preview is on, navigation replaces the displayed file. When off, navigation changes selection without opening a preview. Google public-document preview runs in a constrained iframe inside the Nexus frame, with a source preview option. Local file bytes are never sent to Google; supported local images/video/PDF open inside the same frame. Drive preview is used only when an actual validated Drive file ID is supplied; Zenodo IDs are not Drive IDs.

The existing 106 entries have source publication dates but unknown original import timestamps, so their clocks display `--:--`. New device additions are stored atomically in world-scoped IndexedDB with metadata, Blob, immutable actual `addedAt`, addition order, kind, filename-derived topic/location hints and a separately preserved modification time. Same-timestamp batches retain addition order. Local files update map/catalog/player after commit, survive reload and support soft removal/restoration. This is device persistence, not a repaired server upload backend or cross-account sync.

Native Catania Add/picker/menu/drop paths use the same local ingestion service; existing server FileLoader source remains available elsewhere. Filename hints are labelled, and ambiguous locations stay unassigned. Document nodes are laid out top-to-bottom using the exact same sequence as the player; default links still lead only to the project. Groups preserve explicit membership and positions, while ungrouped documents return to chronological order after a blank-space drop.

Validation: `NODE_PATH=../skanska-current/node_modules node --test tests/*.test.cjs` passes 65 tests, including actual React playback/preview toggles, all file steps and boundary behavior, IndexedDB bytes and atomic failures, map hydration, automatic input ingestion, chronological positions and same-timestamp order. Added dependency for storage tests: `fake-indexeddb@6.2.7`.

Live playback verification (2026-10-31): restored console, individual Previous/Next with preview on/off, device PDF ingestion, automatic107th-position selection, actual UTC clock, reload/reopen, and recoverable removal/restore all passed. Fixed Google viewer embedding to the required literal `embedded=true`; `embedded=1` returns SAMEORIGIN and fails. Source PDFs are fetched without credentials and wrapped in a temporary typed Blob because Zenodo serves attachment/octet-stream with SAMEORIGIN. Requests are aborted and Blob URLs revoked on switching/closing. Short screens allow internal scrolling. Google and remote source rendering receive a separate final browser check.

## Compact TimeSpace and observed migrations — 2026-10-31

The same media player now minimizes to its date/time, Previous/Play/Next and chronological slider; expanding restores all controls without unmounting the open preview. Layout is saved per project. Transport still advances individual files; the slider additionally includes retained actual connection changes, effective deactivation and reactivation, with a LIVE return. The graph projects source availability from publication dates, new files from their actual addedAt, and observed group membership from the first recorded baseline. It never invents earlier Nexus import hours or connection changes. The historical 106-file manifest was connected in commit f69b72b on 2026-08-08T20:38:05Z; that is repository provenance, not individual upload timestamps.

Every Catania graph has one fixed visible Archive tile. Deadlines are entered in the browser's explicitly labelled local timezone and stored in UTC. One nearest deadline timer, plus focus/visibility/storage refresh, updates availability. Reversible metadata rules never delete bytes. Atomic v2 lifecycle storage retains actual scheduling/cancellation/reactivation events, so restoring a file does not erase its earlier archive interval. Archive views can retain the selected TimeSpace snapshot; snapshot editing is disabled, and LIVE returns to current connections. Group membership survives expiry and reactivation unchanged.

World-coordinate motion shows migrating tiles and draws/erases changing links. Incoming actual tiles appear at the end of their ghost's arrival; inverse-camera Archive anchoring and selection changes retain ongoing batches. The selected route is highlighted. Camera focus eases; direct gestures and reduced-motion preferences suppress travel animations. Legacy timestamps, server/account synchronization and physical Android frame latency remain unverified/unavailable as previously documented.

Validation: 112 tests pass, including actual React compact/preview state, deadline expiry and restoration, lifecycle/connection replay, initial TimeSpace event timing, fixed Archive, preserved group storage, historical snapshot selection, motion cancellation/camera anchoring, failed storage, source preview and existing Riverside behavior. Build passes node syntax and git whitespace checks. Source-of-truth scheduling/history remains device-local; closed/background tabs catch up on reopening rather than running a server scheduler.

Live verification: compact83px retains slider/date/time/Previous/Play/Next, preview and state survive reopening, source availability follows replay, Live restores106files, oneArchive receives expiredfile andReactivate returnsit. Actualarrivalanimation760ms with3routes wasobserved inbrowserDOM/CSS. Browsernative datetime-local requiredonInputandreadingvisiblecontrolvalue atsave; regressionadded. Final113tests pass; futuredeadlinebrowserrecheck followsr2deployment.

Final live deadline check passed: native date saved, automatic Archive after5seconds, oneArchive+fileabsent afterreload, Reactivate returnedfile. Actualdragcreatedtwo-fileNode andUndo restoredliveworkspace; bothchangesrecorded. Connectioncheckpointsnowfocuschangedfiles/groupsratherthanarbitrarylatestfile. Finalvalidation116tests.


## Continued chronological playback — 2026-10-31

Play/Pause now follows the complete chronological slider: individual files, effective deactivation, reactivation and recorded connection changes. It continues through changes after the last file, pauses at the final checkpoint and restarts from the first checkpoint when Play is pressed again there. Previous/Next remain single-file navigation and pause playback. LIVE switches back to replay when Play starts. Compact layout and the open file preview remain mounted while non-file events play, so archive and relationship animations receive their actual recorded times.

Validation: three added React integration checks cover compact playback through expiry and connections, preview identity, pause/resume, archive/recovery after the last file, end/restart behavior and LIVE timer replacement. This does not create missing historical imports or server-side scheduling.


## One navigation row — 2026-10-31

The four supplied prompt screenshots are compared in `docs/NEXUS_SCREENSHOT_PROMPTS_2026-10-31.md`. `navigation-dock.js` now owns the native `cU` dock; the existing build helper regenerates both marked graph and navigation blocks. Old top menu/time-chip and addon tile injection are skipped on this shell. The original panels, connector status and access visibility decisions are retained. Profile controls move into System; Files expands upwards with Project files and Cloud sources alongside it. Main navigation has no Docs or separate Cloud tile, and TimeSpace replaces the old TIME/calendar entry. Horizontal scrolling and labelled scroll buttons expose overflow and retain the position per world.

Ask Nexus uses the brain-and-N mark and searches actual current-project source/device metadata, with results revealing the existing graph or Archive entry. It does not invoke the old canned Halifax chat response or claim to be a connected generative AI service. Opening a shell panel temporarily hides the mounted TimeSpace rather than discarding its state.

Validation: 124 tests pass, including five added navigation regressions. Desktop and 390px/850px browser checks cover Files-to-Cloud, System, actual Catania search/reveal, scroll access to offscreen tiles and compact TimeSpace file navigation. Original upload times for legacy sources, physical Android hardware and shared/server persistence retain the previously documented limits.

## Responsive external file folders — 2026-10-31

The modern shell flags `data-nexus-file-layout="topics"`. Automatic category/batch folders are derived from active files and exclude explicit manual group memberships. `nxViewportGraphLayout` reserves the core circle and selects external grid rows/columns for the current safe area; `nxFitViewportGraph` fits every visible tile including the single Archive without a minimum zoom. `nxConstrainViewportCamera` keeps manual navigation inside those bounds. Expanded folders, imports, lifecycle changes and ResizeObserver updates trigger fitting, with header/TimeSpace/nav space reserved. Archive identity remains constant but its position is now responsive, superseding the earlier inverse-camera fixed anchor.

Files offers per-project category/batch import choice and a directory picker. IndexedDB stores batch identity, label, relative path and folder choice atomically with the original metadata/Blob. Legacy flat shells remain compatible. A repeating LIVE clock update does not reopen the selected file's folder over a user-opened category. Layout reflow places tiles directly into their nonoverlapping slots; lifecycle migration ghosts and animated connection routes remain enabled.

Validation: 151 tests, including 27 new geometry/folder/import/live regressions; desktop, portrait390×820 and landscape850×390 browser checks. Source/device metadata limitations and external connector status are unchanged.

## Explorer directory browser — 2026-10-31

`file-explorer.js` supersedes automatic map-folder expansion on the modern shell. The graph keeps one virtual Files hub, one Archive and the existing core circle (11defaulttiles), with at most the explicitly focused file exposed individually. Core trade tiles open the matching virtual directory; manual groups remain editable. `NexusProjectFiles` routes modern calls to Explorer and retains `NexusProjectFileDetails` for legacy catalogs and selected-file lifetime actions.

Pure helpers derive trade/topic/import paths without modifying IDs, source records, addedAt, Blobs or history. Trade metadata takes precedence over labelled filename/title suggestions; multiple hints use Multidiscipline and unclear files use Unassigned. Per-world local overrides are reversible and fail without altering the prior assignment. Explorer provides breadcrumbs, history/Up, status, search, sorting, 25-row pages, inline preview, and directory/batch import. Its source Archive and device-file views share the existing lifecycle and ingestion services. Historical snapshots disable correction and lifetime editing.

Validation: 162tests pass, including eleven Explorer/map regressions; ES-module syntax and reproducible-build checks. Browser checks: 390px/850px layouts, retained11tilemap, MEP→Research→file navigation, embedded preview and mobile width measurement. The original filenames/titles do not contain enough trade information to confidently assign every source, so Unassigned remains visible. No PDF-content classifier, remote file move or shared-account organization backend is claimed.
