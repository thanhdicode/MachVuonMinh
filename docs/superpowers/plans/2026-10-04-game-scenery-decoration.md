# Game scenery decoration implementation plan

> For agentic workers: execute these thin slices sequentially and verify each deliverable.

**Goal:** Restore richer background decoration without the pasted-on farm tiles rejected by the user.

**Architecture:** Retain the native Canvas2D runner and its three bounded caches. One original transparent atlas supplies three material-rich prop clusters for each of the five panoramas. Crop metadata travels through the existing local asset manifest. Decorations occupy a separate layer behind the gameplay lane and scroll more slowly than the road; sparse environmental motion shares the campaign clock.

**Constraints:** Branch `codex/game-runner-redesign`; no main promotion without user approval. No question, physics, collision, scoring, audio or onboarding changes. No dependencies or WebGL contexts. Existing DPR caps and pause/hidden/reduced-motion rules remain. Keep generated native art, prompts, runtime provenance and usage rights.

**Direction:** Compared coarse tile-pack props, decoration baked into the existing panorama, and a palette-matched transparent scenery atlas. Choose the atlas: distinct depth and movement while keeping the current panorama landmarks and red route readable. Use understated irrigation/harvest props, brick/iron mill machinery, steel infrastructure, city planters/utilities and renewable gardens/panels. Irregular spacing, correct contact shadows, small scale and restrained contrast keep these separate from hazards.

**Research:** [SLYNYRD's original parallax tutorial](https://www.slynyrd.com/blog/2019/11/12/pixelblog-23-parallax-scrolling) informs depth, balanced repetitions and crisp pixel movement; [Godot's parallax guide](https://docs.godotengine.org/en/4.5/tutorials/2d/2d_parallax.html) informs relative layer speeds; [MDN Canvas optimisation](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas) informs cached drawing, integer positions and bounded per-frame work. These are technique references, not imported engine code or licensed artwork. Kenney's [CC0 farm pack](https://kenney.nl/assets/pixel-platformer-farm-expansion) is valid but its coarse 18px prop style clashes with these panoramas.

## Task 1 — art and asset contract

- [x] Generate and inspect one 3-column × 5-row transparent scenery atlas using all five original panoramas as style references.
- [x] Copy native art into `.studio/game-runner/originals/`; store prompt and source hash. Encode a local lossless runtime asset and record all 15 verified alpha crop bounds in `public/minigame/runner/manifest.json`.
- [x] Pass scenery metadata through `src/minigame/gameDocument.ts`; record rights in `.studio/ASSET-REGISTRY.md` and public credits.

## Task 2 — composition and motion

- [x] Add renderer tests first: every stage uses its own atlas crops, scenery stays above the lane, no hazard sheets/coarse fallback props, loading the atlas rebuilds the cache, reduced motion and large world offsets remain bounded.
- [x] Replace coarse background props in `src/minigame/assets/game-background.js` with irregularly spaced cropped clusters, integer placement and matching ground contact. Remove independent toy gear/turbine overlays; attach environmental accents to the relevant scenery.
- [x] Keep exactly three bounded render caches and unchanged gameplay state; animate only a small fixed number of ambient accents, frozen in reduced motion/pause.

## Task 3 — acceptance

- [x] Run targeted renderer/asset tests, then production build. All155 project tests passed.
- [x] Capture the real desktop/mobile game and all five stages; inspect scale, transparency, contact, readability and pause. Correct visible art problems before claiming success. Final QA prioritised desktop only after the user's laptop-only steering; every chapter passed animation/reduced-motion pixel checks.
- [x] Save verified results and commit locally; main remains unchanged.

**Review focus:** transparent atlas gutters/row correctness; missing or late assets; road/hazard readability; repeat seam and large world values; pause/reduced-motion stability. Physical-device FPS and human art approval require separate evidence.
