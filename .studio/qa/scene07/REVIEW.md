# Scene 07 — Three Lives / One System

Verified 2026-10-04 against the current local build. Scene 07 replaces the seven-token policy chamber with three fictional people and one shared Value Flow sculpture. Worker handle, glass key and splitter change work cadence, data access and value routing; theory labels appear after each human story. The finale keeps all three people visible.

## Result

| Check | Evidence | Result |
|---|---|---|
| Unit/regression tests | `unit-tests.log`; `npm test` | 162/162 pass |
| TypeScript and production build | `build.log`; `npm run build` | Pass |
| Five-size visual matrix | `frames.json`; 41 PNG captures | No browser errors or horizontal overflow |
| Drag/tap/keyboard, reverse, pause, resize, reduced motion, entry/exit | `interactions.json` | 23/23 pass |
| Delayed Tone load, pending activation, pause, actual hidden tab, resume and exit | `audio-races.json` | 9/9 pass; nonzero output when audible, zero when gated |
| Production lazy chunk, WebGL loss, missing portraits | `production.json` | 10/10 pass; only three deliberately simulated image404 errors |
| Cú Mạch guide | `../owl-guide/responsive/scene07-new-{desktop,mobile}/result.json` | All11 steps pass at1440×900 and390×844; no guide issues/errors |
| Reviewer follow-up | Audio gating, FlowInputs rollback, explicit pin cleanup | No remaining finding |

## Visual and render budget

| Viewport | Captures | Highest triangles / draw calls | Layout |
|---|---:|---:|---|
| 1920×1080 | 9 | 61,968 /32 | Pinned |
| 1440×900 | 9 | 61,968 /32 | Pinned |
| 1366×768 | 9 | 61,968 /32 | Pinned |
| 1024×768 | 9 | 61,968 /32 | Pinned |
| 390×844 | 5 | WebGL frame loop stopped in Scene07 | Unpinned vertical acts |

Desktop captures cover progress0.06,0.16,0.31,0.42,0.57,0.69,0.82,0.90,0.97. One canvas is retained across normal desktop/mobile navigation. Triangle and draw-call counters include the existing host frame plus the raw Scene07 pass; they remain below180,000 /120. DPR is capped at1.5 desktop and1 mobile in WorldCanvas.

Representative views: `1440-900-97.png` (three-person finale), `1024-768-57.png` (ownership reveal), `390-844-act1.png` (vertical worker story), `context-loss.png` and `missing-portraits.png` (failure modes). Face and copy zones were visually inspected. Mobile story order is person → consequence/input → question → explanation/label.

`paused-a.png` and `paused-b.png`, taken1.2 seconds apart, have identical SHA256 `60E080A132507B361A126B9022E7BCADEB0DCF3700A461C378B3B3DDE3EE32F7`; the paused frame does not advance. Pin cleanup was exercised by desktop→mobile→desktop and reduced-motion changes. Guide keep-or-restore preserves all three Scene07 inputs. Runtime and canonical guide JSON data match.

## Assets and architecture

Three native1024×1536 transparent PNG portraits, exact prompts, and hashes are retained in `.studio/scene07/`. Runtime683×1024 alpha WebP files total445,140 bytes. They are explicitly identified as generated illustrations. Rights/provenance are recorded in `ASSET_LICENSES.md` and `.studio/ASSET-REGISTRY.md`; reference image pixels are not redistributed.

Scene07Renderer borrows the existing Three renderer. Original CatmullRom tubes, key/handle/splitter geometry and procedural Tone synthesis add no acquired model, HDRI or sound sample. Desktop uses one master timeline with420vh pin in a520vh interval. Audio initializes only after an explicit gesture, validates the running context, and gates mute/pause/hidden/exit. WebGL loss retains an SVG flow and visible physical controls; missing portraits retain readable content and functioning controls.

## Reproduce

With the dev server on127.0.0.1:5180:

```powershell
npm test
npm run build
node scripts/browser-scene07-qa.mjs
node scripts/browser-scene07-interactions.mjs
node scripts/browser-scene07-audio-races.mjs
$env:QA_URL = 'http://127.0.0.1:5180/'
node scripts/owl-guide-qa/matrix-walk.mjs --module policy --width 1440 --height 900 --tag scene07-new-desktop
node scripts/owl-guide-qa/matrix-walk.mjs --module policy --width 390 --height 844 --touch --tag scene07-new-mobile
```

For the production smoke/failure checks, run `npm run preview -- --host 127.0.0.1 --port 5181`, then `node scripts/browser-scene07-production.mjs`. The failure portion deliberately intercepts the three portrait requests with404 responses.

## Limits

Browser automation uses Chromium with SwiftShader. Real-device FPS, memory pressure and speaker timbre are not measured; real audio output and context state are checked via the engine meter. The build retains a warning for chunks above500kB, including the existing WorldCanvas bundle. No deployment is part of this verification.
