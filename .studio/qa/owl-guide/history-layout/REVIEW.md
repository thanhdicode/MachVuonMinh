# History laptop layout hotfix — 2026-10-04

The user's production screenshot exposed the history masthead overlapping the active date. Reproduced at1366×660 on production before changing code. Previous mural QA checked curator/art bounds but omitted masthead/date collisions.

Root cause: independent absolute positions (`112px` masthead versus `23vh` compact curator, with additional wide/short overrides) collided on short browser windows. `HistoryBridge.tsx` now places the masthead and curator in a common normal-flow stack; a24px gap stays intact when dates, titles or fonts change. The stack and controls start below the global navigation. Content, timeline, game and audio are unchanged.

Further checks found body/art overlap on wide screens and facts near the footer on short screens. Reserved the caption zone above wide foreground artwork and a consistent lower rail/facts band above the global footer; moved the magnifier to stay above the rail.

Regression script: `scripts/owl-guide-qa/history-layout.mjs` uses the actual menu and era controls, waits for fonts/images/pinning, checks masthead/date/title/body/control/nav/footer separation, caption/art collisions, image loading and horizontal overflow. Keyboard menu selection avoids clicking its moving entrance animation in the harness.

Verified48 combinations: all8 eras at1280×600,1366×660,1366×768,1440×720,1440×900 and1920×1080. No overlap, overflow or browser errors. Reform-era screenshots inspected at short laptop and wide sizes. All155 project tests and production build passed. A final1366×660 capture also verifies the magnifier adjustment. Existing Vite large-chunk advisory is unrelated to this CSS fix. Mobile polish was not expanded, per user preference.

Deploy verification is saved separately under ignored `.studio/game-runner/resources/history-layout-live/`; the committed reports describe the local production build.
