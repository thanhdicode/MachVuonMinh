# Pixel runner upgrade — research and implementation plan

> **For agentic workers:** Execute the scoped tasks below; keep product changes on `codex/game-runner-redesign`. Main promotion requires the user's later approval.

**Goal:** Replace the rejected flat 2.5D presentation with a polished side-view pixel runner, responsive UI, animated character/scenery and audio while retaining the complete quiz campaign.

**Architecture:** Keep the existing Canvas2D campaign and iframe guide protocol. A presentation layer loads licensed sprite sheets, advances cosmetic animations from game time, renders scrolling scenery/terrain, and handles audio through a separately disposable controller. DOM remains responsible for readable Vietnamese quiz text and accessible controls.

**Tech stack:** Existing TypeScript/React shell and Canvas2D iframe; original imagegen distant panoramas; CC0 pixel sprite sheets/tiles and audio from verified authors; shared motion tokens with transform/opacity DOM effects. No second WebGL context.

**Spec / approved user direction:** 2026-10-04 user selected “Pixel-art nhìn ngang (đề xuất)”; requested research, free online resources, moving/animated effects and sound, unchanged question logic, review on another branch before main.

## Research decisions

| Candidate / resource | Verified evidence | Decision |
| --- | --- | --- |
| [Chromium Dino source](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/components/neterror/resources/dino_game/) | Canvas renderer, state-specific sprite frames, elapsed-time animation, independent horizon and obstacles; [BSD source license](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/LICENSE) | Reference the animation/input architecture; do not copy Dino art or campaign logic. |
| [Phaser](https://github.com/phaserjs/phaser) / [Canvas renderer](https://docs.phaser.io/api-documentation/class/renderer-canvas-canvasrenderer) | MIT, own Game/render/input/lifecycle framework; package now 4.2.1, v3/v4 behavior must not be assumed interchangeable | Research completed; a migration would disturb the campaign/guide contract. Keep the working engine. |
| [Kontra.js](https://straker.github.io/kontra/) / [repo](https://github.com/straker/kontra) | Modular, small Canvas game library with sprite sheets, animation and pools; MIT | Useful reference for the presentation layer. No dependency needed for the existing loop and tested collisions. |
| [Kenney Pixel Platformer](https://kenney.nl/assets/pixel-platformer) | Author CC0,18px terrain,24px character sheet; included License.txt repeats personal/educational/commercial reuse | Downloaded base tiles for terrain/obstacles. |
| [Farm Expansion](https://kenney.nl/assets/pixel-platformer-farm-expansion) / [Industrial Expansion](https://kenney.nl/assets/pixel-platformer-industrial-expansion) | Author CC0,18px tiles | Downloaded; provide scene-specific props for agriculture and factory phases. |
| [Kenney Impact Sounds](https://kenney.nl/assets/impact-sounds), [Interface Sounds](https://kenney.nl/assets/interface-sounds), [UI Audio](https://kenney.nl/assets/ui-audio), [Music Jingles](https://kenney.nl/assets/music-jingles) | Author CC0 on each pack page | Impact/Interface selected: ten short local effects. Other packs researched, not incorporated. Original licences/hashes retained. |
| [Pixel Frog Pixel Adventure 1](https://pixelfrog-assets.itch.io/pixel-adventure-1) | Author CC0 1.0; actual animation sheets verified, intended20FPS | Selected12-frame runner, idle, jump/fall/hit, eight-frame saw and blinking guardian. |

## Art directions

1. Minimal monochrome Dino: strong readability, insufficient character for this presentation.
2. Side-view pixel adventure: genuine sprite-frame animation, layered original panoramas, red path across five stages, crisp terrain and warm paper UI. **Selected by user.**
3. Voxel/isometric Minecraft-like: would require new camera, art pipeline and gameplay perspective; unsuitable for preserving current campaign.

The lane stays clear. One memorable landscape per stage replaces uniform repeated houses. A single framed panorama uses slow bounded camera travel, avoiding mirrored landmarks/doubled suns; independently scrolling near props/road, steam/motes, rotating machinery/turbine and sprite animation supply motion. Run animation samples integrated visual travel so cadence follows the road without changing physics.

## Global constraints

- Keep all 77 questions, answers, explanations, shuffle/correct-index mapping, boss HP/turns, hearts, scoring, collision quiz and stage advancement unchanged.
- Question files baseline SHA256: `questions.js` C8479FFF749FF533334B26C126B23A48237DC38768B212F9A4B19D44ED99F735; `document-questions.js` 8D629B15D070D7D3579EB520681FBFF973EC412E1AD223F69C45E612A0D65F98.
- Retain every game guide target/bridge method and safe isolated guide practice.
- One existing WebGL context; game uses Canvas2D. DPR max1.5 desktop/1 mobile; no canvas repaint while hidden/paused/quiz or guide-held without practice. Ready previews animate using a separate decorative clock, leaving campaign state untouched.
- Audio starts only after user gesture, has explicit mute, stops/suspends when paused/hidden/iframe closed, cannot alter campaign state.
- Reduced motion keeps essential runner/obstacle readability and disables decorative shake, parallax, flashes and UI movement.
- Download source/rights/SHA256 and original imagegen prompts recorded. Runtime assets local; no hotlink/CDN.
- No merge/push to main. Commit reviewable work only on this branch.

## Implementation tasks

- [x] **Assets and presentation:** acquire the author-licensed animation sheet, inspect actual frames, generate five original pixel panoramas with imagegen, export runtime-sized WebP/PNG assets and a manifest. Create `runner-presentation.js` for state-specific frame selection; replace `game-background.js` with a rich layered renderer and scrolling terrain, keeping the factory API. Test animation time/pause/reduced behavior and bounded caches.
- [x] **Audio:** create `game-audio.js`, local CC0 effects and licence/manifest. Interface `create({baseUrl}) → unlock(), setEnabled(bool), setMode(mode,stage), play(kind), update(dt), dispose()`. Test gesture gate, mute/pause/hidden/dispose and failed decode paths. Root owns hook integration in game.js.
- [x] **UI and motion:** redesign game.html/game.css and the React toolbar styling around a wide playfield, compact stage map, clear stats, input help, start/pause/results and readable quiz/boss panels. Preserve IDs/data-guide/button actions. Shared tokens; transform/opacity feedback and accessibility/reduced motion. Mobile avoids the old vertically stretched world and reserves large touch controls.
- [x] **Integration:** render imported runner/obstacles/boss frames, layer stage details and pixel effects; use visual time only, preserve physics/quiz code. Connect audio at existing event boundaries. Keep natural/game-tour replay and practice safe.
- [x] **Verification/review:** baseline hashes and quiz/physics tests, renderer/audio regression tests, full npm test/build, desktop/mobile/landscape/reduced motion/browser screenshots, real keyboard/touch jumping/ducking, collision quiz, boss correct/incorrect/next-stage, pause/mute/visibility/close/replay. Inspect motion through multiple frames, not a still image. Record before/after and leave preview open for human review.

## Review focus

- Audio is silent before gesture and after mute/hidden/close; no accumulated contexts on replay.
- Held controls release after focus loss/guide interruption; pausing preserves the exact campaign.
- Sprite art aligns with existing hitboxes; no new invisible hazards or obscured lane.
- Mobile quiz text/answers/continue and guide Skip remain reachable; browser font/viewport changes do not clip them.
- Animated sheets use verified frame dimensions; no sheet strips/asset seams, blurred pixels, layout reflows per frame or cross-stage image pop-in.
