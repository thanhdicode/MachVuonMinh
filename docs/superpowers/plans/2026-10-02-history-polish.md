# History polish implementation plan

**Goal:** retain the approved collage style while preventing text over artwork, clarifying Vietnamese prose, and requiring explicit activation of the circular lens.

**Architecture:** keep the existing 560vw GSAP collage and scroll mapping. Regular desktop/laptop annotations get a reserved lower band; the user's ultrawide composition keeps side annotations within measured free space. Reuse the existing image lens with an accessible toggle, off by default.

**Tech stack:** React, TypeScript, CSS, existing GSAP/Lenis; no dependencies or new assets.

**Spec:** user's six screenshots and follow-up request; confirmed choice: click to toggle the circular lens.

**Constraints:** preserve all historical metrics/qualifiers, era IDs and later chapters; one existing WebGL context; no automatic hover zoom until activated.

**Review focus:** laptop height and width, ultrawide composition, longest era annotations, lens focus/Escape behavior, resize across mobile/reduced motion.

- [x] Reproduce label/art overlap at 1280×720 and trace independent viewport positioning and contain centering.
- [x] Add browser regression checks for disjoint text/art bands and explicit lens activation; observe failure before implementation.
- [x] Reserve caption space in `history.css`; remove text backgrounds over pictures and place controls above the artwork.
- [x] Polish `history.ts` copy only, preserving exact numerical qualifiers.
- [x] Gate the lens in `HistoryBridge.tsx` behind an accessible button, hide on navigation/scroll, and retain native mobile zoom.
- [x] Verify 3435×1318, 2600×1040, 1920×958, 1440×900, 1280×720, 1024×768, mobile and reduced motion. Save before/after evidence in `.studio/qa/history/`.
- [x] Run existing checks, production build, and record results.

Final verification, 2026-10-03: 48 era/viewport checks include every visible neighboring caption and image, not only the active pair. Labels now move at the same speed as their pictures; background map/archive parallax remains. Narrow layouts reserve 230px for the longest annotation. Clip the insertion wrapper to prevent an oversized GSAP pin spacer from creating horizontal page scroll. See `.studio/qa/history/REVIEW.md` for results and evidence.
