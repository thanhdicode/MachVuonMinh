# Human × Machine hand-touch finale

User execution spec, 2026-10-08: append after existing storytelling. Create separate transparent human-left and robot-right images first. Native inline implementation; no further design approval required by the user. Retain all current chapters, fonts and Lenis. No new animation/3D library or global input/scroll lock.

## Direction
1. Level opposing photographic hands, one exact fingertip contact and a restrained red signal. Selected: matches the user's asset and sequence specification; red thread carries meaning.
2. Diagonal Renaissance crossing: rejected because it complicates mobile contact and changes the requested left/right entry.
3. Poster collage with fragmented machine parts: rejected because it distracts from the two fingertips.

Charcoal/oxide chamber, ivory typography, titanium and warm skin. Hands dominate the first beat, then retain contact while the exact two-sentence message rises into the lower frame. Existing synthesis remains before this appendix. No invented facts or theory labels added.

## Implementation
- [x] Generate and inspect two alpha assets with built-in imagegen. Copy masters to .studio/hand-finale/generated and encode runtime alpha WebP into public/images/finale. Record prompts, dimensions, alpha checks, hashes and exact normalized fingertip anchors.
- [x] Add tests for anchor alignment at laptop/mobile sizes and appended extent isolation; test failure before implementation.
- [x] Add handFinaleGeometry.ts: place each image with its fingertip at the shared contact point, from natural pixel coordinates; calculate the original story extent without appended finale height.
- [x] Add HandFinale.tsx and handFinale.css. Root runway with pin:view/pinSpacing:false, scrub timeline; entries -> contact -> crimson pulse -> SVG red paths/particles -> statement -> end hold. No autoplay loops. Explicit image dimensions, near-viewport decode, clean matchMedia reversion and asset error fallback. Reduced motion has a static contact/message, no pin.
- [x] Mount after journey-flow-after. WorldTimeline subtracts root height when deriving existing journey; resize retains finale-local scroll. Finale flag masks existing fixed overlays only during this appendix; header/menu and game remain available. Existing guide targets stay intact before the appendix.
- [x] Build/full tests. Inspect laptop/tablet/mobile screenshots; use actual wheel in both directions, reach unpinned ending, toggle reduced-motion/resize and verify one canvas, unchanged preceding chapters, no overflow or asset errors. Root diff review completed; independent reviewer could not finish because its usage quota expired.

## Review focus
Earlier chapter positions must remain identical when adding finale height. Contact is measured from generated pixels, not guessed CSS offsets. Resize/reduced-motion cannot jump back to Scene08 or leave a pin spacer. Initial page must not fetch hand assets. Broken images must still reveal the message. Native scroll may pass the pin normally; no imported reference lock/autoplay code.

Reference: https://github.com/TJ-Paul/wedding-invitation-parallax and live demo. Consulted image layers and relative pose concept only; no reference pixels or script copied. Current source license must be recorded from the actual checkout. Official GSAP ScrollTrigger and matchMedia docs consulted.
