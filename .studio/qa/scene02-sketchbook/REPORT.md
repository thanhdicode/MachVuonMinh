# Scene02 Sketchbook verification — 2026-10-06

Replaced V5 with local authored MengTo/ThreeUI Sketchbook document. Nine generated Vietnamese illustrations; research/content plan in docs/superpowers/plans/2026-10-06-scene02-sketchbook.md. Scope: Scene02 and host boundary/source/guide integration. Existing unrelated dirty files preserved; no commit/push/deployment.

## Confirmed
- Original motion engine byte-for-byte SHA256 7805284fe73263ca7ba472b82af862e34ada5b082037f3c81388884dffd9d8d3. Appended adapters alter text, host layout, scrolling and compact-laptop resting loupe position only.
- Native IAB full paper drag changes page; loupe drag visibly magnifies the illustration; zoom changes to 111/116%; editorial index returns to selected plate without jumping into History; next chapter button reaches 03/08 and automation controls.
- Source drawer opens correct evidence. Parent wheel scroll works. Fixed inactive-boundary wheel trapping, index anchor undershoot, pointer hit areas over source caption, and iframe height/media-query mismatch on short laptops.
- Desktop inspected at 1440x900, 1366x768 and current user IAB. 1366 compact controls bottom ~706px before final loupe parking adjustment. One existing world canvas; no new WebGL context.
- Standalone mobile smoke 390x844: no horizontal overflow, all images decoded, reduced-motion flag true. This is not exhaustive mobile interaction QA.
- Full suite:184 passed,0 failed. Final adapter changes:5 targeted tests passed; final production build passed. Existing >500kB bundle warning remains. No measured FPS guarantee.

## Limits
Partial-drag cancellation and global pause behavior were not separately verified. Original engine is retained; background browser throttling can prolong intro during automated testing. No claim of pixel identity for regenerated artwork. Original source has no verified LICENSE at the inspected commit; attribution retained and uncertainty documented in asset registry.

Screenshot: local-notebook.png. Runtime art:2,675,414bytes across nine alpha WebP files. Exact prompts/hash manifest in .studio/sketchbook-reference. V5 media retained in ignored local archive.
