# History mural acceptance — 2026-10-03

This replaces the earlier History Atlas review. The replacement brief is implemented through the direct transition into Scene 02. Concurrent machine-chapter work in the shared checkout is preserved.

One responsive `<picture>` renders the complete panorama. Four original imagegen segments were tone-matched and feathered with 20% overlap into one 8192×1024 AVIF, a 4096×512 WebP and a separate 1024×8192 vertical background. Native originals are 2172×724; the final panorama is upscaled, not new native 8K detail. Prompts and generation/composite provenance are in [prompts.json](../../history/mural/prompts.json). The supplied reference photographs are not shipped.

The foreground retains the existing transparent cutouts, with 12–20vw frame overlap, varied horizontal offsets, a shared base and cropped tool/infrastructure fragments. Repeated country maps, per-era archive backdrops, circle doodles, the curved red spline and the rewind interstitial are removed. Active copy uses the prescribed Vietnamese summaries. Source names and links remain in the source drawer.

## Visual and interaction verification

All eight eras were captured at each required viewport: **40 captures**. Individual PNGs and JSON geometry records live beside this report.

| Viewport | Contact sheet | Result |
| --- | --- | --- |
| 1920×1080 | [Eight eras](contact-1920.png) | Passed |
| 1440×900 | [Eight eras](contact-1440.png) | Passed |
| 1366×768 | [Eight eras](contact-1366.png) | Passed |
| 1024×768 | [Eight eras](contact-1024.png) | Passed |
| 390×844 | [Eight eras](contact-390.png) | Passed |

Desktop assertions cover one panorama image, one readable body, ≤2 title lines, no caption/fitted-art collision, viewport bounds, no horizontal overflow, a 2px bottom rail and one orthogonal elbow. Leaders use normalized feature coordinates on the actual fitted images. Visual inspection corrected the electricity anchor to the transformer; all eight anchors terminate on opaque foreground pixels (`anchor-pixels.json`). Contact sheets show no repeated maps, visible background tiles or hard panorama seams. Foreground/base imagery fills the mural; open annotation space has a reading purpose.

The master tween is linear (`ease:none`), pinned with scrub .85; era activation uses its `containerAnimation`. Titles reveal by 10px, the leader draws over .4s and metrics appear last. Below 900px and for reduced motion, the mural is vertical and unpinned. The 899→900px resize check passed. A final stale mobile-resize selector was corrected to the current annotation element, preserving the intended −140px reading offset. Its build/tests passed; the additional era-06 desktop→mobile→desktop browser check could not be completed after the browser runtime refreshed and rejected navigation from its generated connection-error page. It is not counted as a passed browser check.

The [direct handoff](1440-900-handoff.png) fades the final digital composition through a zooming flywheel detail into the existing machine hall, with the single requested bridge sentence. Native scrolling activates chapter 02 without a blank page (`handoff.json`). An invisible transition button was made non-interactive until the handoff is ready; opacity now runs at one level.

[Loupe](loupe-1366.png) checks passed: default off, click activation, 190px diameter, pointer tracking, loaded zoom image, hidden over text, Escape to exit. [Mobile inspection](390-844-zoom.png) opens a 390×844 dialog with a loaded 2048px image and restores trigger focus. A real pointer click opens the source drawer and closing restores source focus (`tools.json`). No runtime exceptions were emitted during the final interaction checks (`runtime.json`).

The [annotated review](annotated.png) uses the image-annotations skill with a native-size coordinate grid, crop verification and orange callouts. These labels are review evidence only.

## Audio verification

All eight WAV URLs return HTTP 200. Original deterministic synthesis uses no third-party samples, lyrics, anthems or existing songs. The cleaner revision reduces hiss, strengthens tonal/rhythmic layers and normalizes loops around −23dBFS RMS with peak ≤−5dBFS. A 300ms triangle cue plays two notes immediately after a real click resumes and validates the AudioContext.

`audio-browser.json` records silence before a gesture, a running context, a cue oscillator and nonzero output measured through the shared destination analyser, changed buffers/output at eras 02 and 06, zero RMS/peak after mute, and re-enable on the same persistent context. Unit checks cover failed resume, stale loads, queued transitions and 900–1300ms gain crossfades. The UI stays off when context activation fails.

**Physical listening passed:** the user first reported unclear rustling. After the cleaner revision, the user confirmed: “Nghe rõ, đổi nền và tắt/bật đúng” — clear sound, era changes, mute and resume. This confirmation completes the required eight-step playback sequence together with the browser's initial-silence check.

## Final checks

`node --test tests/*.test.mjs`: 8 test files passed. The audio tests passed again after tightening crossfades to 900–1300ms. `npm run build`: TypeScript and production build passed. `git diff --check`: passed. Preview: `http://127.0.0.1:5175/`. No dependencies or WebGL context were added. Vite's large-chunk advisory remains; device frame rate was not measured.
