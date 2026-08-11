# Single canonical tree + Timeline overlay

This Project World variant intentionally uses the embedded Relationship Tree as the only graph canvas.

Rules:
- opening TIME must not resize, shift or rescale the Relationship Tree iframe;
- the Timeline Zone overlays the graph and sends `NEXUS_PROJECT_TIME_CHANGE` to the embedded tree;
- the legacy/demo-specific `.project-world-layer` is hidden to avoid two graph systems competing for the same viewport;
- the outer e-SAFE rail remains the Project World controller;
- embedded Relationship Tree chrome remains cropped as before.

Manual smoke test:
1. Open `/apps/nexus-esafe-demo/` on Android.
2. Note a few node positions.
3. Open TIME, scrub between phases, switch REAL/REPLAY/SIMULATION.
4. Confirm node viewport does not jump/reflow when TIME opens/closes.
5. Confirm pinch/drag still behave normally inside the tree.
6. Confirm timeline updates continue to reach the tree.
