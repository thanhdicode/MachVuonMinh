# History Bridge — QA

## Responsive/copy/lens polish — 2026-10-03

The user's ultrawide collage is retained. Regular desktops/laptops now reserve a lower caption band, following the supplied print references. The failure came from image containment and independent viewport placement; different caption/image travel speeds also let a neighboring era's caption drift onto the previous image. Captions now travel with the images, while archive and map layers retain parallax. The insertion wrapper clips the GSAP spacer's horizontal overflow. No reference pixels, new assets or dependencies were added.

Vietnamese bodies use concrete tools, factories, workers, electricity and data, with 33–36 words per era. Dates, metric values and statistical qualifiers are unchanged. The external **KÍNH LÚP** button toggles the existing circular lens; it starts off, passive hover does nothing, and a second click or Escape disables it. Image dialogs remain available.

| Check | Result | Evidence |
| --- | --- | --- |
| All eight eras × six desktop sizes | Pass: every visible caption is disjoint from every visible image, heading/footers stay clear, and the page has no horizontal overflow | [1024×768](polish-1024-768.json), [1280×720](polish-1280-720.json), [1440×900](polish-1440-900.json), [1920×958](polish-1920-958.json), [2600×1040](polish-2600-1040.json), [3435×1318](polish-3435-1318.json) |
| Explicit lens activation | Passive hover off, click on, text excluded, Escape/second click off | [lens-toggle-report.json](lens-toggle-report.json) |
| Desktop navigation and source access | Native wheel, eight eras, Left/Right keys, source drawer and machine handoff pass; console errors: 0 | [desktop-report.json](desktop-report.json) |
| Red connector | Five frames: 3,811–4,454 red pixels spanning all 12 viewport columns | [desktop-report.json](desktop-report.json) |
| Mobile/reduced motion | Vertical 390×844 atlas, bounded tap dialog/focus return, later eras and static 1440×900 reduced mode pass; console errors: 0 | [mobile-report.json](mobile-report.json) |
| Resize/native unpin | Keeps era 1975–1985 through desktop → laptop → mobile → desktop; wheel enters/exits original chapters | [resize-report.json](resize-report.json) |
| Production build and existing checks | TypeScript/Vite pass; 5 test files pass; `git diff --check` passes | `npm run build`; `node --test tests/*.test.mjs` |

Compare [short laptop](polish-1280-720-era-0.png), [longest narrow caption](polish-1024-768-era-4.png), and [ultrawide](polish-3435-1318-era-0.png). The browser regression functions are in `scripts/browser-history-qa.mjs`. The previous asset-resolution, physical touch and performance limits below still apply; Vite retains the existing large-world-bundle warning.

## Original bridge implementation — 2026-10-02

Inserted eight eras between the original plough and machine chapters. Later chapters retain their existing content and indices. Production preview: http://localhost:4173/.

| Check | Result | Evidence |
| --- | --- | --- |
| TypeScript + production build | Pass; existing world bundle remains above Vite's 500KB warning threshold | `npm run build` |
| Runnable geometry/regression checks | 5 files pass, 0 failures | `node --test tests/*.test.mjs` |
| Desktop 1440×900 | 560vw pinned collage; actual vertical wheel, Left/Right keys, eight eras and machine handoff pass | [desktop-report.json](desktop-report.json) |
| Red connector | 3.5px continuous SVG; all five screenshots contain about 3,900–4,200 red pixels across all 12 viewport columns | [desktop-report.json](desktop-report.json) |
| Magnifier and sources | 190px image-only lens; source drawer and Escape work | [lens.png](lens.png) |
| Mobile 390×844 | Vertical atlas; no pin/lens/horizontal overflow; tap opens bounded 2.2× zoom; close restores focus | [mobile-report.json](mobile-report.json) |
| Reduced motion | Static atlas without pin/parallax; return to desktop correctly resynchronizes world state | [reduced-motion.png](reduced-motion.png) |
| Resize and native unpin | Era 1975–1985 retained across 1440×900 → 1280×720 → 390×844 → 1440×900; native wheel enters/leaves bridge | [resize-report.json](resize-report.json) |
| Offscreen motion | Motif paused outside history; entering the atlas starts the visible motif | [animation-report.json](animation-report.json) |
| Browser console | No errors during the checked flows | Reports above |
| Image budget | 32 responsive WebP files; largest ordinary asset 409,298 bytes; high-resolution zoom copies lazy | `public/images/history/` |

Required 1440×900 frames: [start](01-start.png), [colonial rail](02-colonial-rail.png), [1975–1985](03-reconstruction.png), [Đổi Mới](04-doi-moi.png), [digital](05-digital.png). Additional [belt handoff](06-handoff.png), [mobile atlas](mobile-reconstruction.png), [mobile zoom](mobile-zoom.png).

Visual inspection confirms overlapping illustrations dominate the collage, with small museum annotations and secondary source access. Figures are labeled as reconstructions. Prompts, originals and tool provenance are in [the asset record](../../history/README.md). All supplied numerical claims are backed by primary-source metadata in `src/data/historySources.ts`.

Two regressions found and fixed: resize could reset the active-era counter despite preserving the image position; the red path could finish its visible stroke before the current viewport. The connector now measures its length after SVG scaling and reveals ahead of the visible collage. A screenshot pixel check catches missing connector strokes. Native [`non-scaling-stroke`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/vector-effect) keeps its width constant.

Limits: main generated originals are native 1536×1024; 2048px zoom copies are resampled, with no invented detail. Tap zoom was tested through the browser UI; physical-device long press and touch panning remain manual checks because the in-app browser does not support raw touch dispatch. Sustained FPS and physical mobile GPU performance were not measured. The bridge adds no WebGL context and suspends the existing world renderer while active. Micro-animation runs only for onscreen desktop eras, and pauses with the existing motion setting or hidden page.
