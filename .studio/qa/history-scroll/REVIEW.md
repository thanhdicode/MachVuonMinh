# History horizontal scroll — 2026-10-04

The user reported a sharp vertical crop while panning the historical mural at laptop width. Reproduced with native wheel input at1330×933: the figure moved240px left, while the visible edge stayed at452.19px. `HistoryBridge` increased a left inset by the same distance as the horizontal translation, keeping that crop stationary. This occurred below1440px.

Removed the per-scroll `--art-clip` update and its figure clip-path rule. Existing GSAP horizontal translation, scrub, era changes, natural alpha edges, caption backdrop and Machine handoff are retained. Scene07 journey mapping was independently reviewed and does not change Atlas progress.

## Verification

- `scripts/browser-history-scroll-regression.mjs --before` reproduced the failure; `before.json` and `before-forward.png` retain the evidence.
- `scripts/browser-history-scroll-regression.mjs` passes10 checks: native wheel movement, visible edge movement, exact reverse restoration, no artificial crop/overflow at1024,1366,1440px and no browser errors. `after.json` and matching screenshots are retained.
- After the fix, visible edge moves from451.18px to211.19px for240px scroll and returns to451.18px on reverse.
- History geometry and history audio tests pass2/2. `npm run build` passes; existing bundle-size warning remains.
- Reloaded the user's in-app tab on127.0.0.1:5180, navigated to01.H, and scrolled the mural. `iab-after.png` shows the complete natural artwork edge in that tab.
