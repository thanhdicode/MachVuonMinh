# Scene 04 visual verification

- Chosen composition: one production bench; shared infrastructure, connected data/AI modules, human-operated console. The red signal terminates at hardware instead of floating behind separate icons.
- 1440×900, 1280×720, 390×844: four labels inside the viewport, no label/copy overlap, one WebGL canvas. Screenshots and measured rectangles saved here by scripts/browser-data-scene-qa.mjs.
- Iteration 1: excessive bevel radius hid signal traces; reduced surface bevel to .04, below half its thickness.
- Iteration 2: outgoing camera movement enlarged the bench into the footer; assembly now contracts during exit and labels fade before the transition.
- Native wheel reaches scene 05. Returning through the menu restores the full scene. Paused screenshots were byte-identical across two captures. Clean reload and scene navigation produced no console errors.
- node tests/model.test.mjs and node tests/surface.test.mjs passed. npm run build passed. Existing large Three.js chunk warning remains (278.17 kB gzip); no new dependency.
- Visual judgement: one dominant assembly, a readable left text column, visible physical connections, restrained brass details, and no oversized decorative data wave. Mobile keeps the complete assembly below the copy.
