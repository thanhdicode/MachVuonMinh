# History Bridge implementation

Goal: insert the user's eight-era editorial atlas between the plough and machine, without redesigning later chapters.

Architecture: retain the existing fixed world and Lenis, subtract the atlas's physical scroll interval from world progress. History uses only DOM, SVG and GSAP. Desktop pins a 560vw collage; mobile and reduced motion use a vertical atlas.

Spec: `history-bridge-brief.txt` in this directory (user-supplied brief).

- [x] Add a failing runnable check for world progress before/during/after the insertion and exact-point magnifier geometry.
- [x] Generate eight isolated main reconstructions and eight monochrome archive strips with built-in imagegen; retain prompts, originals and responsive WebP assets with provenance.
- [x] Verify the supplied historical metrics against primary sources; store source metadata separately from visible annotations.
- [x] Build HistoryBridge, thin continuous connector, local motion, image-only lens and accessible native zoom dialog. Preload only the current/next two eras.
- [x] Integrate world progress and chapter navigation; preserve the plough-to-belt handoff and the existing one-canvas limit.
- [x] Run the runnable checks and production build; browser QA at 1440×900, mobile, reduced motion and resize. Save five desktop frames and the QA report.

Review focus: direct menu skips must map around the insertion; wheel must enter/leave the pin; resize must retain the same atlas era; lens must track the exact image point; native dialogs must restore focus and allow internal touch scrolling.

Results and remaining device checks: `.studio/qa/history/REVIEW.md`. Main images are generated at native 1536px, then resampled to 2048px for lazy zoom; no claim of native 2048px detail.
