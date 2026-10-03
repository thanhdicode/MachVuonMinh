# History Atlas editorial polish

User specification: pasted attachment `802970a6-ac4e-46f2-88f1-5164f3fa2014`. Keep all collage assets, era order, red connector and original horizontal track; no later-chapter redesign.

Use each existing era as a named inline-size container with three zones: annotation, collage, facts. Preserve an open paper column for body copy; alternate upper/lower copy and a slightly lower visual every third era. Metrics share a lower rail. Only the active era shows its headline, body and full facts; neighboring years and images maintain continuity.

Use separate GSAP media conditions for wide (1440+), standard (1100–1439), compact (768–1099), mobile (<768), short height (820 or less), and reduced motion. Desktop retains the 560vw track and 56vw era spacing. Mobile/reduced remain vertical.

Reuse the existing 190px lens/quickTo, existing high-resolution WebP assets and native image dialog. Add explicit inspectable/source data, an animated brass dock labeled SOI CHI TIẾT, exact accessible label, default off, return-to-dock on Escape/second click, and a mobile button opening the active image dialog. Do not transcode unchanged assets merely to rename their format.

- [ ] Capture baseline behavior against new body/neighbor visibility and dock requirements.
- [x] Replace A–H bodies and F title with exact requested strings; preserve all other metadata.
- [ ] Refactor existing era DOM/CSS into three responsive container zones and alternating layouts.
- [ ] Split responsive GSAP conditions; hide competing text, preserve continuous connector and chapter handoff.
- [ ] Animate opt-in lens dock and retain mobile/native inspection and focus return.
- [ ] Verify all eight eras at 1920×1080, 1440×900, 1366×768 and 1024×768; capture 390×844, reduced motion and responsive resize.
- [ ] Build, run existing checks, save screenshots/report and project memory.
