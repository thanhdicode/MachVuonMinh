# Scene 02: From machine to system

**Goal:** Replace the rejected gear exhibit with the supplied five-beat causal story, after History Atlas and before Automation.
**Architecture:** A raw Three.js mechanical scene borrows the existing renderer. One GSAP timeline controls the DOM/SVG narrative and shared progress. Mobile and reduced motion use four static illustrated states.
**Spec:** User attachment `0d18ac5e-5600-4361-a8bd-42f28b144282/Văn bản đã dán.txt`.

## Constraints

One WebGL context; no new dependencies; desktop DPR ≤1.5, mobile ≤1. No pedestal, decorative gear collection, cards, historical production numbers or robots before exit. Existing fonts only. Desktop pin 300vh, scrub .9, anticipatePin 1. Main thesis after .82. Preserve every other chapter.

## Review focus

Scroll reversal and pause must stop mechanical rotation; resize must preserve chapter progress. Menu navigation must land in the rebuilt chapter. Mobile/reduced motion must remain unpinned and expose all meaning in DOM. Atlas and automation must preserve the same thread through entry/exit. Caption dock must avoid workers and machines at all five specified sizes.

## Implementation

- [x] Write failing runnable checks for scroll mapping, reveal thresholds and mechanical settling.
- [x] Implement `machineState.ts`, `MachineChapter.tsx`, `machine.css`: five desktop beats, four static states, original SVG worker roles, flow/coordination/diagram.
- [x] Implement raw `machineMechanism.ts`, mount through a renderer adapter in `WorldCanvas.tsx`; remove old Machine/Gear and pedestal.
- [x] Update `WorldTimeline.ts` and `Experience.tsx` for insertion, navigation, resize, caption suppression and shared context.
- [x] Extend the user-activated history audio hook with mechanical ambience, velocity rhythm and two quiet engagements.
- [x] Build, run all existing tests; capture 1920×1080, 1440×900, 1366×768, 1024×768, 390×844 plus reduced motion, entry/exit, pause, reverse and resize. Inspect screenshots, fix failures, save QA evidence.
