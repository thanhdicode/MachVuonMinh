# Production synchronized startup implementation plan

**Goal:** Keep the existing design while bringing text and 3D onto the screen together, reducing unnecessary startup work and preventing late empty hero frames.
**Architecture:** Separate React runtime from deferred Tone audio in the production chunk graph. Preload the existing world module and studio environment. Prepare chapter0 first, reveal after its first actual render, then warm other chapter groups one at a time with main-thread yields. Keep one canvas and existing geometry/material/camera/motion settings.
**Spec:** User 2026-10-06 production screenshot and request for smoother synchronized loading, without further UI redesign. Existing authorization includes push to main and Vercel release.

Evidence: production assets allHTTP200; fresh production unlocked hero renders correctly after readiness. Initial scripts statically import React from Scene07AudioSynth, causing Tone initialization before Scene07. Main navigationDOMContentLoaded2184ms, world fetch starts2810ms in inspected run. This is one observation, not a controlled performance comparison.

- [x] Add failing behavioral tests: sequential background shader jobs yield/cancel; initial preparation completion does not wait for later scenes.
- [x] Isolate React runtime chunk; ensure entry graph excludes Tone/Scene07AudioSynth; preload existing world module and HDR.
- [x] Prepare intro with existing scene lights/environment, render first frame, synchronize overlay readiness; warm later groups after paint with cancellation.
- [x] Verify local production build startup, no early audio request, one canvas, visible hero, unchanged composition and chapter navigation. Run full tests/build.
- [ ] Push main and confirm Vercel and live assets.

Read official Vite/Rolldown codeSplitting docs, installed Three compileAsync source. Use inline execution; no subagent needed. Do not change authored UI, motion, DPR, geometry or evidence content.

Results/limits: .studio/qa/production-startup/REPORT.md. Release verification continues after push.
