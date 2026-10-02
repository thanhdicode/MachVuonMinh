# Fixed-screen mini game review — 2026-10-02

## Delivered

Scene 08 includes a red CHƠI MINIGAME action. Obstacle collisions freeze the running scene and show a question with four answers in a popup inside the arena. The arena expands to the available content area during the popup, keeping the HUD and controls visible without scrolling. Answer feedback stays open until TIẾP TỤC CHẠY; obstacles clear on resume with one second of immunity. Boss questions retain their desktop side rail/mobile lower rail and animated battle scene. 49 real PNG sprites from three verified Kenney CC0 packs replace the earlier primitive character/boss/obstacle drawings. Animated walk/jump/duck/hurt poses, tiled terrain, parallax layers and red energy trails retain the presentation's palette. The exhibition keeps its existing WebGL canvas and stops rendering/scrolling while the game is open. Toolbar/Escape restore the final scene and launch-button focus.

## Verification

- `npm run build`: TypeScript and production bundling passed. The existing large WorldCanvas chunk still triggers Vite's size advisory.
- All four existing model, surface, drone and character checks passed.
- `node tests/minigame.test.mjs`: all 126 pattern/speed/virtual-width/size-extreme cases have a collision-free input sequence using the actual collision functions.
- `node .studio/qa/minigame/browser-check.mjs`: production browser checks passed; details in `report.json`.
- Confirmed 60 questions, 12 per chapter, initial three hearts, frozen canvas and distance throughout a collision popup and answer feedback. Movement/pause keys cannot resume the question. TIẾP TỤC CHẠY resumes distance, and manual pause still freezes ordinary gameplay.
- Reached the first boss through ordinary gameplay. Boss animation continued during questions, three correct answers defeated it, and stage 02 remained locked until victory confirmation.
- Escape inside the iframe and the toolbar close action restored the original final scene/scroll and keyboard focus. Repeated opens succeeded.
- Layout checks covered every question, all four answers, full feedback and continue button in collision/boss modes at 1440×900, 1280×720, 390×844, 375×667, 320×568, 844×390 and 640×360. Ready-screen components also fit. Iframe document height equals viewport height and scrollY remains zero. All reported content-clipping checks pass.
- Injected test-only state access into the iframe srcDoc to cover all five bosses: incorrect answers trigger counterattack and lose one heart; three correct answers remove all boss HP; victory gates advancement; hearts persist on advancement; stage five finishes the campaign. Production has no debug exports. See `campaign-report.json` and `layout-report.json`.
- No horizontal overflow; mobile Canvas 2D DPR capped at 1. No uncaught JavaScript exceptions or Google Fonts requests. All sprites load from local URLs and LFS downloads are SHA-256 verified.

## Visual review

The final call to action is legible beneath the thesis and clear of the ring. The return control remains visible while playing. The arena fills its region without letterboxing or stretched characters. Forest layers are composited once to avoid dark overlap seams. Collision questions use a centered paper-colored popup over the frozen scene with a two-column answer grid. All four answers, explanation and continue action fit together. Boss questions remain in their fixed rail. Long chapter names truncate in the compact mobile HUD. Smaller screens use compact type and hide duplicate instructions; question and answer text is retained in full.

Speed: 320 + 10 per elapsed running second + 40 per completed chapter, capped at 760. Chapter distances: 180, 230, 280, 330, 380; cumulative gates: 180, 410, 690, 1020, 1400. Physics adapts horizontal travel to arena aspect ratio to retain reaction time and full-screen rendering. Patterns include high/wide hurdles, pairs, jump/duck sequences, oscillating flyers, warned spikes and saws; group spacing allows recovery. Low jumps and fast descent provide finer control.

Screenshots are local, ignored QA artifacts. Ordinary gameplay reached the first boss; the later campaign transitions were tested through controlled state setup, rather than replaying every running segment.
