# Laptop load and scroll performance — 2026-10-06

Production preview: `http://127.0.0.1:5190/`, measured in the in-app Chromium browser at1366×768, physical DPR1. One WebGL canvas. Raw CPU profiles, timing logs, original environment capture and screenshot are retained locally in this directory and excluded from Git.

## Confirmed causes and changes

- Initial reload spent634ms in synchronous `getProgramInfoLog`; the first06→07 transition spent3,754ms there. Prepare shaders before visible rendering, including all program variants of shared materials and lazy uniform/attribute reflection. Reflection runs in separate tasks. Development shader diagnostics remain enabled; production uses Three's documented performance setting.
- Scene07 previously rendered the host scene beneath a fully opaque workshop. Skip that pass only when the workshop is ready, opaque and active. Preserve the host for loading, static mode and transparent entry/exit. Tests cover all gates.
- Runtime studio capture and PMREM convolution still caused a726ms startup task during the intermediate implementation. Bake the existing three-light studio into a66,253-byte HDR CubeUV atlas. The final measured initial-load tasks were62,81,170 and140ms; the runtime PMREM filter work is removed. RGBE encoding error is below0.68% of each pixel's brightest channel; no external image asset. The workshop shares the atlas.
- Cache workshop projection/layout until resize; avoid redundant per-frame material and DOM writes. Prepare late GLTFs, textured paddy ground and conditional evidence groups before they become visible.

## Actual measurements and limits

The original steady workshop sample had175 intervals: median16.6ms, P9527.6ms, maximum38.9ms, two intervals over33.4ms. This is a baseline, not a controlled FPS claim across hardware.

The final isolated real scroll from “Ai làm?” to “Máy của ai?” captured465 intervals over three seconds: median5.6ms, P9511.2ms, maximum22.3ms, zero intervals over33.4ms and no long tasks. A separate three-scroll run with accessibility snapshots between actions captured555 intervals, P9511.3ms and one199ms long task. Do not claim that every transition has zero stutters based on the isolated sample. Browser scheduling/cache and inspection overhead affect these measurements.

The final local navigation sample completed in646ms, first contentful paint516ms, with startup work still reaching170ms. Further cold network/hardware profiling may identify additional load costs; this work does not establish a universal60FPS guarantee.

## Verification

`npm run build` passed. `npm test` passed all181 tests, including shader readiness across shared variants, disposed/lost-context handling, first-use reflection, frame ownership during fades and finite HDR atlas decoding. `git diff --check` passed. Original workshop geometry, rights choices, the stop-machine response and the full laptop composition remain present in `workshop-1366.jpg`. Late browser reconnection timed out at handoff; previously captured measurements are preserved. The preview process was restarted and the page and HDR asset both returnedHTTP200.

Official API references: [WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html), [HDRLoader](https://threejs.org/docs/pages/HDRLoader.html), [Texture mappings](https://threejs.org/docs/pages/Texture.html). Runtime behaviour was also checked against the installed Three0.186.1 source, especially compileAsync's last-program-per-material readiness check.
