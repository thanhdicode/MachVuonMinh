# History Atlas acceptance — 2026-10-03

Implemented the supplied panorama specification between the plough and machine chapter. Existing reconstructions, geographic provenance and source records are retained. This work stops at the Atlas boundary; concurrent machine-chapter work in the shared checkout was preserved.

## Result

One 680vw DOM/SVG world contains eight compositions spaced 72vw apart, with 90vw image frames. Paper/map, archive ground, red thread, collage, bridge sketches, nodes and markers are separate layers. GSAP uses scrub .85 and the prescribed parallax ratios. The red path is 3px and sits behind focal images; nodes remain visible above them. Only the active paragraph is readable.

At 1440px and wider, annotations sit above/below the imagery. At 900–1439px, one unboxed curator column reserves reading space. Below 900px and with reduced motion, the layout becomes an unpinned vertical strip with a 2px thread. The exact Vietnamese copy, metrics and exit paragraph are retained; detailed 1976 enterprise context stays in the source drawer.

## Browser verification

Production preview: `http://127.0.0.1:5175`. Checks use the in-app browser through `scripts/browser-atlas-panorama-qa.mjs` and `scripts/browser-atlas-audio-qa.mjs`.

| Viewport | Evidence | Result |
| --- | --- | --- |
| 1920×1080 | [Eight eras](contact-1920.png), `1920-1080.json` | Passed |
| 1440×900 | [Eight eras](contact-1440.png), `1440-900.json` | Passed |
| 1366×768 | [Eight eras](contact-1366.png), `1366-768.json` | Passed |
| 1024×768 | [Eight eras](contact-1024.png), `1024-768.json` | Passed |
| 390×844 | [Entry](390-844-era-0.png), [final era](390-844-era-7.png), `390-844.json` | All eight eras passed |

The 32 desktop checks cover active era, one visible body, no body/fact collision with the fitted artwork, title ≤2 lines, viewport bounds, loaded imagery, layer order, thread width, curator breakpoint, world width and hidden exit copy during era beats. Mobile checks cover all eight eras, vertical layout, no pinning, one active body, loaded images and no horizontal page overflow. Contact sheets and the individual captures were visually inspected.

Additional checks passed:

- [Loupe](loupe-1366.png): passive hover stays off; click toggles `aria-pressed`; 190px diameter, 2.15× exact-point zoom and pointer lag; text regions hide it; second click and Escape turn it off. Geometry tests cover bottom/left object alignment.
- [Mobile zoom](390-844-zoom.png): 390×844 dialog, loaded 2048px image, Escape closes and returns focus to its trigger.
- Resize 899→900px switches vertical/unpinned to horizontal/pinned. Reduced motion stays vertical/unpinned; test emulation was restored.
- Source dialog retains 1,279 + 634 = 1,913 and 9.5% context; closing returns focus to the source trigger. Timeline contains no source URLs.
- [Exit](1440-900-exit.png): only thread and belt outline remain after imagery/archive/map fade. Native scroll initially exposed a negative exit offset; moving the final annotation into viewport coordinates fixed it. Regression checks now keep heading, paragraph and button in bounds at all four desktop sizes (`exit-checks.json`). [Mobile conclusion](390-844-exit.png) also fits.
- Native scrolling leaves the Atlas and activates chapter 02; recorded positions were Atlas top −1010px, machine top −110px, navigation `02 / 08`.
- No runtime exceptions or browser log entries were emitted during the final production-preview load and Atlas entry (`console-browser.json`).

## Audio verification and provenance

Eight original, deterministic synthesized ambience loops replace any need to acquire third-party recordings. Provenance and project-use rights are recorded in `public/audio/LICENSES.md`; these are not claimed to be CC0/public-domain recordings. No lyrics, speech, anthem, march or third-party samples are present.

Real browser events confirm silence before a gesture, a running AudioContext and AudioBufferSource after clicking the sound control, two Atlas gain channels, a new buffer on era change and working mute (`audio-browser.json`). Engine checks cover stale asynchronous loads, queued rapid changes, 0.16 gain, 0.9–1.35s fades, cancellation and failed transitions without hard cuts.

All files: PCM16 mono, 16kHz, 12 seconds, exact-zero endpoints. RMS is −28.00 dBFS for eras 01–07 and −28.43 for era 08; peak range is −21.53 to −6.00 dBFS, without clipping. Sparse workshop/digital loops were given restrained continuous beds to correct the initially excessive loudness spread. Physical speaker/headphone timbre and perceived balance were not auditioned.

## Final checks

`node --test tests/*.test.mjs`: 8 test files passed. `npm run build`: TypeScript and production build passed. `git diff --check`: passed. Vite's existing large-chunk advisory remains; no new dependencies or WebGL context were added. Device frame rate was not measured.
