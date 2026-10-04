# Scene 07 — Three Lives / One System

**Goal:** Replace the seven-token policy chamber with three human stories feeding one living Value Flow.

**Architecture:** Raw Three.js scene borrows the existing renderer through a small host adapter, as the machine hall does. A single GSAP timeline pins the desktop exhibit for 420vh; mobile/reduced motion present three unpinned acts. A separate local state carries physical handle, glass-key and splitter input into the shared sculpture. World navigation subtracts this replacement interval so earlier chapters retain their timing.

**Tech:** Three.js, GSAP/ScrollTrigger, existing Lenis/maath, Tone.js. Keep the existing WebGL backend; WebXR/TSL are not required by the attached scene specification.

**Spec:** User's two attached Scene 07 briefs, 2026-10-04; scope stops at Scene 07 and its handoffs. Generated portraits are fictional composites, not evidence photos.

## Constraints and review focus

- One WebGL context; DPR <=1.5 desktop /1 mobile; target <180k visible triangles, <120 draw calls.
- Human consequences precede the QHSX labels; finale retains all three people.
- One physical gesture per story, keyboard/tap fallback; no quiz, cards, score or correct answer.
- Reverse scroll, direct navigation, resized pins and reduced motion must preserve understandable reading order.
- Audio requires an explicit gesture, verified running context and immediate cue. Hidden, paused, muted and inactive states silence it.
- Asset failure must retain readable story and physical controls. Face regions and copy use separate layout zones.
- Existing owl guide policy steps must describe the new objects, with no stale seven-token practice waits.

## Tasks

- [x] State/navigation: earned reveal boundaries and journey roundtrips tested; scene07State.ts and WorldTimeline integrated.
- [x] Assets: three transparent portraits generated and inspected; originals/prompts retained, <=1024px WebP exports and provenance recorded.
- [x] Exhibit: branched CatmullRom sculpture, red lacquer/ivory energy/frosted node/brass details, task cadence/data access/value routing; existing renderer reused.
- [x] Story: master timeline, earned reveals, captured drag/tap/keyboard controls, unpinned mobile/reduced-motion acts and three-person finale.
- [x] Audio: root verified output, delayed activation, mute/pause/hidden/exit; scheduling and stale-cue races fixed.
- [x] Guide: original step IDs retained; copy/targets/practice and input rollback updated; desktop/mobile 11-step walks pass.
- [x] QA: build and 162 tests pass; 41 fresh screenshots at all five sizes, 23 interaction checks and 9 audio race checks pass. Measured budgets and device-only limitations recorded in `.studio/qa/scene07/REVIEW.md`.

## Visual directions

1. Photographic triptych surrounding a flowing shared sculpture.
2. One continuous factory panorama with three close-up stations.
3. Dark theatrical portrait collage with separate floating data objects.

Choose 1: people remain legible in the finale, the red thread connects all three consequences, and the ivory/red museum object fits ART-DIRECTION. 2 dilutes the individual stories; 3 risks decorative people and disconnected objects. No reference image pixels are redistributed.
