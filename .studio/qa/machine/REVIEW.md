# Scene 02 verification — 2026-10-03

Rebuilt only Scene 02 and its History Atlas / Automation handoffs. A flywheel, shaft and red transmission belt drive distinct machine-tool and output stations. Workers, maintenance, task links and cadence explain coordination before the physical assembly becomes the system diagram. The final thesis begins at progress .82; the bracket follows at .84.

The mechanism is original raw Three.js geometry. A small adapter borrows the existing R3F canvas renderer; Scene 02 has no declarative R3F assembly and creates no additional WebGL context. The desktop pin lasts 300vh, with scrub .9 and anticipatePin 1. Mobile below 768px and reduced motion use four unpinned SVG/DOM states. Their hidden 3D render loop is stopped. DPR is capped at 1.5 desktop / 1 mobile.

## Captures

| Viewport | Evidence | Result |
| --- | --- | --- |
| 1920×1080 | `1920-1080-{6,22,54,77,94,99}.jpg`, `1920-1080.json` | Six narrative / exit positions pass |
| 1440×900 | `1440-900-{6,22,54,77,94,99}.jpg`, `1440-900.json` | Six positions pass |
| 1366×768 | `1366-768-{6,22,54,77,94,99}.jpg`, `1366-768.json` | Caption dock; six positions pass |
| 1024×768 | `1024-768-{6,22,54,77,94,99}.jpg`, `1024-768.json` | Two physical stations plus diagrammatic output; six positions pass |
| 390×844 | `390-844-beat-{0,1,2,3}.jpg`, `390-844.json` | Four visible, unpinned states pass |
| Reduced motion, 1440×900 | `reduced-beat-{0,1,2,3}.jpg`, `reduced.json` | Four visible, unpinned states pass |

Desktop checks assert settled scroll position, a single canvas, no horizontal overflow, no caption collision with the machine/worker zone, a two-line first headline, workers visible during coordination, and no system bracket before the earned reveal. Static checks assert visible DOM story, no pin and no overflow. Screenshots were visually inspected for material, distinct processes, worker roles and text placement. The reusable capture script is `scripts/browser-machine-qa.mjs`.

## Interaction and handoff checks

- Reverse .77 → .54 restores the connected-machine copy and hides workers / bracket.
- Pause and resume through the menu keep DOM, SVG and mechanical progress synchronized. After scrolling stops, two screenshots 1.6 seconds apart are byte-identical (`settled.jpg`). No elapsed-time wheel spin remains.
- Menu entry lands inside Scene 02. Resize 1440×900 → 1366×768 preserves .54 as .5399. Mobile 390×844 → 430×844 preserves the coordination state at top 125.156px (target 125px).
- `atlas-handoff.jpg`: ending-era thread and warm paper lead into the engineering drawing / archival trace. Three reduce → no-preference cycles retain ending era 8 and track x = −8367px. GSAP owns the Atlas media lifecycle; upstream pin refresh precedes the machine pin.
- `automation-handoff.jpg`: during unpin, the existing Automation arm appears on the shared dark backdrop. Its existing copy and controls appear on arrival in Scene 03.
- Sound remains opt-in. The menu toggle successfully loads the reused `history-05-analog-hum.wav` (384344 transferred bytes); scrolling through station joins produces no application console errors. Sound was turned off after checking. Unit checks cover quiet velocity rhythm, stale/failed audio loads, cancellation and fade to silence.
- At 720px, canvas buffer / CSS widths are both 705px (DPR 1), the canvas is hidden, and the story is unpinned (`mobile-dpr.json`).

Detailed interaction measurements are in `interactions.json`. Fixes from review include progress synchronization while paused, static-state resize preservation, failed-audio cleanup, texture layering, and live reduced-motion handoff refresh. The focused reviewer reported no remaining findings of severity minor or higher.

## Build and tests

`npm run build` succeeds (TypeScript and Vite, 619 modules). All eight test scripts pass: character, drone, history audio, history, machine mechanism, machine, model and surface. `git diff --check` passes. Existing History Atlas work was retained.

Vite still reports the existing large-chunk warning; the browser has an existing Three.js Clock deprecation warning. Physical-device FPS, touch hardware and audible output on real speakers were not measured. The desktop ~60fps / mobile >30fps targets therefore remain device acceptance checks, not verified performance claims.
