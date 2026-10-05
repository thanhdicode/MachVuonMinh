# Scene 07 workshop — verification 2026-10-05

This records the initial workshop's functional checks. The user rejected its visual quality; subsequent visual and plain-language revisions are recorded in `../scene07-visual-rebuild/REVIEW.md`. Functional checks do not establish visual acceptance.

Scope: one workshop connecting the Vietnamese examples in scene 06 with ownership, organization/management, and distribution; scene 07 guide only. Laptop first.

- 176/176 automated tests pass; production build passes after the final CSS adjustment. Existing large-chunk warning remains.
- 1366×768: all five beats, choices, keyboard, guide targets and practice flow inspected. Cancelling practice restores the previous organization choice.
- 1440×900: the workshop, choices, feedback and source fit. Wheel input advances organization → ownership and returns to organization. Conclusion continues to scene 08.
- 390×844 static smoke: choice updates feedback; no horizontal overflow. Returning to desktop retains the choice.
- Reduced motion at 1440×900: static story appears and retains the choice; no horizontal overflow. Temporary media and viewport overrides cleared after verification.
- One canvas. Observed render calls: organization 53, ownership 55, distribution 59. Repeated geometry instanced; no hardware FPS claim.
- Legacy full-screen fallback tubes and the implementation-mode caption are hidden only in scene 07, which supplies its own workshop diagram.
- Reviewer found no major issue. Its findings about draw calls, the stale short guide label, and level-based completion wording were corrected.

Research boundaries: NQ57 is policy direction; ILO HITI is a case report, not proof that AI always preserves employment; Mayer/Fiorella public abstract informed layout, not a measured learning outcome. The textbook PDF was located but could not be verified in full, so no page or verbatim quotation is claimed. Learner comprehension and physical laptop FPS have not been measured.

Evidence: `1366-*.png`, `1440-organization.jpg`, `1440-final.jpg`, `390-static.jpg`, `1440-reduced.jpg`, `tests.log`, `build.log`. The `.png` extension of the older captures follows the earlier screenshot tool; the final screenshots use JPEG. Local preview server had stopped during an interrupted session and was restarted; a fresh tab confirmed one canvas and the workshop rendering.
