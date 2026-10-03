# Pixel runner review — 2026-10-04

Branch: `codex/game-runner-redesign`, based on main `3eaa579`. Main is unchanged; human approval is required before promotion.

The rejected flat geometric scenery is replaced by five original imagegen landscapes, actual Pixel Frog frame animations and Kenney terrain/props/effects. The red scarf and traversable red road tie the game to the exhibition. One framed panorama avoids repeated suns and sky seams; independent road/near scenery, steam, gears, turbine and pixel particles provide depth. Decorative props sit above and behind the lane and never reuse a live hazard. Run cadence follows integrated visual travel. No new engine dependency or WebGL context.

All77 question records and both canonical question file SHA256 values remain unchanged. Existing spawn/collision, jump/duck physics, scoring, hearts, three-HP bosses, answer shuffling and progression are preserved. Guide practice stays isolated. UI adds five-stage progress, clear mute/pause buttons, readable scrolling question panels and48px mobile controls.

Verified:

- `npm test`:153 passed; includes126 collision-free obstacle/speed/viewport input combinations, question checks, guide isolation, frame cropping, bounded render caches and audio lifecycle. Spike/crate/guardian transparent gutters are cropped at render time so visible art fills the existing collision dimensions; the runner's feet use the source animation's ground anchor.
- `npm run build`: succeeded,669 modules. Existing main-app bundle-size advisory remains; no new dependency was added.
- `scripts/owl-guide-qa/runner-redesign.mjs`: Chromium desktop1440×900, mobile390×844 at DPR2, landscape844×390 and reduced motion. All four passed: keyboard/touch, animated frames/road, pause pixels/score/audio, mute via keyboard, guide hold + hidden recovery, correct/wrong collision answers, all five bosses and stage transitions, restart, hidden/explicit resume, visible missing-saw/boss fallbacks, DPR cap and audio disposal. Travel alone is accelerated in a test-only iframe; production exposes no test controls. Reports: `.studio/qa/owl-guide/runner-redesign/`.
- Natural uninstrumented game visual QA: desktop/mobile HUD clear, opaque canvas, contained layout, stable pause pixels, no runtime errors. Screenshots/gallery: `.studio/qa/owl-guide/walk/release-game-visual/`.
- Real mobile Driver walkthrough: all10 game steps, genuine jump/duck practice, completed state, zero leftover layers/runtime errors, parent focus restored. `.studio/qa/owl-guide/walk/runner-game-tour-mobile/result.json`.
- Audio output analyser: all10 local OGG effects decoded and audible; measured effect peaks about−28.3 to−21.0dBFS, mute peak0, no clipping or errors. `.studio/qa/owl-guide/runner-redesign/audio-levels.json`. Music is original quiet synthesis; manual listening preference remains for review.
- Scoped adversarial review: invisible fallback hazards and audio lifecycle findings fixed; no remaining finding of minor severity or higher.

Asset provenance/rights: `.studio/ASSET-REGISTRY.md`, public `ASSET-CREDITS.md`, `public/minigame/runner/{manifest.json,licenses/,audio/manifest.json}`. Selected images total1,516,570 bytes; ten audio clips89,757 bytes. Generated native source PNGs and prompts are retained. Full free packs are ignored scratch downloads.

Preview: `http://127.0.0.1:5180/?preview=pixel-runner-20261004`; unlock the exhibition, open Cú Mạch → Minigame, then skip the tour or practise through it. This serves the current branch's production build locally. Physical-device FPS, Safari/iOS playback and human art approval are not claimed by the Chromium checks.
