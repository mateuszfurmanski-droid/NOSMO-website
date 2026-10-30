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
