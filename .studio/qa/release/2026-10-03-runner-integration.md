# Runner integration verification — 2026-10-03

Integrated origin/main `31e8023629f337704f561b0416c57b2be6276ebf`
with the continuous history mural and line-shaft hall from `0fb6bba`.
Remote branch discovery found only `main`.

- Clean `npm ci`, `npm run build`, and all 10 Node test files passed.
- Runner tests cover 126 obstacle/speed/viewport combinations; the bank has 77 questions, including 17 imported from the source document.
- Browser smoke at 1440×900: scene 08 → game → run → collision question → correct answer → continue → pause.
- Close button, iframe Escape/postMessage, and parent dialog Escape all returned focus to CHƠI MINIGAME and retained scrollY 22347 with no open dialog or body lock.
- History navigation returned to `history-active`; its source drawer displayed TƯ LIỆU / H01 and the correct pre-1858 source.
- Mechanization navigation returned to `scene-2 machine-active`, with a single main canvas.
- Browser console reported no errors during the integration smoke.
- Read-only integration review approved Experience, WorldCanvas suspension, and WorldTimeline mapping.
- Whitespace check passed excluding three unchanged upstream Kenney license files, which retain their original whitespace.

Production deployment is verified separately after pushing the merge commit.
