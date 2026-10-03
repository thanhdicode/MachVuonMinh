# The Line-Shaft Hall — verification, 2026-10-03

Rebuild follows the user's replacement directive, attachment `536ce6a1-18e0-4a13-b4bc-ff072fe4969e`. Only Scene 02 and its handoffs changed. The rejected SVG-worker / arrow-system composition is replaced by a dense period machine hall: one engine flywheel, one overhead shaft, six pulleys, three leather-belt drives, lathe / drill / planer, three operators and a maintenance worker. The physical hall stays visible through the philosophical reveal. Caption zones sit top-left / bottom-right; typography is at most 28px. No pedestal, worker pictograms, branches, icon nodes or system brackets remain.

## Architecture and assets

One existing WebGL canvas / renderer hosts an original raw Three.js scene. The hall and people are depth-separated texture planes; the foreground mechanism is geometry. No second context or render loop was created. Normal rendering uses one pass; the exit briefly composites the fading hall over the existing Automation world on that same renderer, restoring autoClear afterward. The last visible belt narrows into a signal route while lighting cools: third belt on desktop, second in compact mode. Small motor housings grow from each visible drive coupling during the electrical handoff; reversing or resizing restores the appropriate leather belts and hides the motors before the exit.

Desktop pin: **280vh**, scrub .9, anticipatePin 1. The camera pulls back through distribution and reaches the whole-hall composition before .78. Station drives engage at .28 / .38 / .47. Under 1100px, only two major machines / operators remain, as specified. Below 768px or with reduced motion, four stacked cinematic renders replace the pinned sequence; the hidden WebGL render loop stays stopped. Existing DPR caps remain 1.5 desktop / 1 mobile.

Original artwork made with built-in **image_gen**: [hall.webp](../../../public/images/machine-hall/hall.webp), [workers.webp](../../../public/images/machine-hall/workers.webp). Generated-output provenance and primary museum references are in [ASSET-REGISTRY.md](../../ASSET-REGISTRY.md); exact final prompts are in [prompts.json](../../line-shaft/prompts.json). Four `frame-*.webp` assets are direct raw-canvas renders of the same hall at .20 / .40 / .73 / .92. They preserve real worker proportions and the mechanism without vector fallback overlays. The images are reconstructions, not historical photographs.

## Browser evidence

| Viewport | Captures | Result |
| --- | --- | --- |
| 1920×1080 | `1920-1080-{2,20,35,61,73,82,92,98}.jpg` + JSON | Eight positions pass |
| 1440×900 | `1440-900-{2,20,35,61,73,82,92,98}.jpg` + JSON | Eight positions pass |
| 1366×768 | `1366-768-{2,20,35,61,73,82,92,98}.jpg` + JSON | Eight positions; 340px caption zone |
| 1024×768 | `1024-768-{2,20,35,61,73,82,92,98}.jpg` + JSON | Eight positions; two-machine crop |
| 390×844 | `390-844-{0,1,2,3}.jpg` + JSON | Four cinematic states, no pin |
| Reduced motion, 1440×900 | `reduced-{0,1,2,3}.jpg` + JSON | Four cinematic states, no pin |

Checks assert one canvas, no horizontal overflow, 280vh pin, no old SVG people, font size ≤28px, and **at most 20 visible words** before the final beat (limit 25). The fallback plate cannot cover the live mechanism. Screenshots were visually inspected for hall density, real clothing / proportions, distinct machinery, captions and the shared power route. The hall fills the viewport; no large unused black zone remains. These are visual composition checks, not pixel-segmentation measurements.

- Native reverse .73 → .40 restores distribution copy and hides worker layers. Pause / resume retain progress and copy; paused demand rendering follows scrub updates while inertia is disabled. Paused reverse .40 → .20 changes the rendered camera to the flywheel macro (`paused-macro.jpg`).
- At rest, two screenshots 1.6 seconds apart are byte-identical. Mechanical unit tests also check settled shaft rotation and pulley separation.
- Resize 1440×900 → 1366×768 preserves .61 as .6099, without overflow. Mobile 390×844 → 430×844 keeps frame 2 at top 125.03125px, without overflow.
- `atlas-handoff.jpg`: warm paper / collage, aligned technical circle and shared thread crossfade into cast iron and workshop atmosphere.
- `automation-handoff.jpg`: one belt cools / narrows, the hall dims and the existing arm emerges during unpin. `automation-arrival.jpg` confirms existing Scene 03 “Từ thao tác / sang tri thức.” copy and the automation slider on arrival, with one canvas. Final motor / signal captures at .98 cover all four desktop sizes; `exit-updates.json` records the wide and compact checks. Motor housings stay beside their actual drive pulleys without obscuring the tool artwork.
- Menu sound opt-in / off and station traversal produce **zero application console errors**. Existing room tone plus low shaft / leather / tool layers gain detail with station activation. Late opt-in skips historical threshold clicks. Visibility, pause and disable explicitly silence mechanical gains independently of the animation ticker.

Reusable browser checks: `scripts/browser-line-shaft-qa.mjs`. Measurements: viewport JSON files and `interactions.json`. The focused read-only review has no remaining findings of severity minor or higher.

## Validation and limits

`npm run build` succeeds: TypeScript + Vite, 622 modules. All eight test scripts pass: character, drone, history audio, history, line-shaft mechanism, machine progress/navigation, model and surface. `git diff --check` passes. Tests were changed first for the new reveal sequence, physical belts, nonintersecting pulleys and compact signal / motor evolution, and demonstrated failures before fixes. Exit tests cover reverse / resize resets, pulley attachment, motor visibility and geometry reveal without relying on material opacity.

Existing Vite large-chunk and Three.js Clock deprecation warnings remain. Physical-device FPS and real-speaker perceptual audio were not measured; the ~60fps desktop / >30fps mobile targets remain hardware acceptance checks. The named WebXR skill was consulted for renderer lifecycle compatibility; this directive is a desktop/mobile scroll experience and does not introduce XR sessions.
