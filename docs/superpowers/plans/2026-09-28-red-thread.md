# Red Thread rebuild implementation plan

**Goal:** Execute 07_MASTER_PROMPT_V2.md as a continuous, interactive exhibition.
**Architecture:** One persistent R3F canvas and camera, a spatial path controlled by Lenis and ScrollTrigger, semantic DOM overlays. Native ranges and pointer events own accessible interactions; procedural geometry owns the imagery.
**Stack:** Existing React 19, TypeScript, R3F 9, Three, GSAP, Lenis, maath. No new runtime dependencies.
**Spec:** 00_NORTH_STAR.md through 07_MASTER_PROMPT_V2.md, read in order.

## Constraints and review focus
- DPR <=1.5 desktop / 1 mobile; no dynamic shadows; animate current/adjacent scenes only.
- Two fonts; paper/ink/red; no narrative cards; maximum 40 words per main narrative beat.
- Test both signs of the LLSX/QHSX gap, three unique policy sockets, cancelled drags, keyboard entry, resize and reduced motion.
- One source at a time; source drawer traps focus and restores it. Distinguish institutions from QHSX.
- Desktop screenshots 1440x900 after each scene, then 1920x1080 and 390x844. Inspect all; build last.

## Execution ledger
- [x] Foundation: `src/experience/model.ts`, model tests, timeline, world canvas and intro gesture. Verify drag + Enter + scroll lock; capture intro.
- [x] Historical world: add terrain, plough, gear and robotic arm in `src/experience/WorldCanvas.tsx`; capture and inspect each before advancing.
- [x] Digital world: thread-aligned particle field with spatial labels; capture and inspect.
- [x] Lab: eight edge controls, absolute mismatch, deforming core/cage, reassembly presets; test and capture fit/strain/contradiction.
- [x] Vietnam: drawn path and single evidence node, exact source drawer; verify links; capture.
- [x] Policy + synthesis: seven tokens, three unique sockets, explanatory tradeoffs, adaptive loop; test drag, keyboard, reset; capture each.
- [x] Mobile, reduced motion, context loss, console and production verification. Save QA report and screenshots in `.studio/qa/`.

Ruling: implement inline without approval pauses; user explicitly requires execution and iteration. Existing source is only a two-file scaffold. No Git repository exists, so no worktree or commits. Requested image skills inform asset selection and QA; the specified imagery is procedural, not bitmap illustrations. WebXR is outside the V2 experience and will not add an unrelated VR entry.
