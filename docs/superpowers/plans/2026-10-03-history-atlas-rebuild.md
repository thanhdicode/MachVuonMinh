# History Atlas implementation plan

**Goal:** Implement the supplied museum panorama specification only between the plough and machine chapters.
**Architecture:** Keep the existing DOM/SVG atlas and its shared world-scroll mapping. Reuse transparent reconstructions, separate paper/thread/archive/collage/micro/marker/annotation layers, and the existing click loupe. Add two-channel Web Audio in an isolated hook.
**Stack:** React, TypeScript, GSAP ScrollTrigger, CSS container queries, native dialog and Web Audio. No new dependencies.
**Spec:** User attachment `07a711b3-3eb1-4eea-a917-7f955f4e7649/Văn bản đã dán.txt` (2026-10-03).

## Constraints and checks

- Preserve exact approved copy, facts and source drawer; do not edit later scenes.
- One 680vw world, 72vw era rhythm, 90vw overlapping compositions; thread below imagery.
- At 900–1439px show one stationary curator caption; below 900px use the vertical strip. Reduced motion stays vertical.
- Test resizing across 900px, rapid forward/back era changes, source-dialog focus, loupe off-by-default/Escape/mobile dialog, silent initial audio and interrupted crossfades.
- Capture all eight eras at 1920×1080, 1440×900, 1366×768 and 1024×768, plus 390×844 mobile. Build and run existing runnable checks.

## Tasks

- [x] Record approved direction; retain baseline and reproduce lens/exit geometry failures before their fixes.
- [x] Rebuild `HistoryBridge.tsx` and `history.css`; update exact data copy and `historyStep`/900px resize mapping. Add seven original SVG bridge tools without replacing good images.
- [x] Add `historyAudio.ts`, `useHistoryAudio.ts`, original synthesized loops and `public/audio/LICENSES.md`; integrate gesture sound control.
- [x] Run browser interaction, layout and real audio checks; inspect captures and correct collisions. Report: `.studio/qa/history-atlas/REVIEW.md`.
- [x] Run `node --test tests/*.test.mjs` and `npm run build`; save confirmed project observations.

Implementation is already authorized by the user; continue in this session without an additional plan approval gate.
