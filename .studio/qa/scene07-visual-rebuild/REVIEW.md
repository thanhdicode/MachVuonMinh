# Scene 07 — visual correction, 2026-10-05

The user rejected the first workshop render. Functional completion was reported before its visual quality matched the brief.

## First impression of the rejected build

The page communicates a working teaching interface, but the tiny box machine and mannequin make the centerpiece feel like a rough prototype. My eye goes to the heading, then the simplified figure, then the long conveyor. The figure's generic rounded body and unbroken rectangular floor dominate over meaningful industrial details. One-word impression: toy.

Evidence: `before.jpg` (the actual prior laptop render).

## Findings and selected fixes

1. High: the mannequin is a generic placeholder. Replace it with a detailed operator console; the adjacent content still identifies the human's role.
2. High: the machine, camera arch and base have crude box silhouettes. Rebuild them as a coherent CNC exhibit with chamfered panels, visible spindle/vice, rails, optics and repeated machined fittings.
3. High: similarly muted green/gray materials and ungrounded lighting flatten the model. Use warm paper, enamel red, dark ink, steel and brass; one shadow light plus studio environment reflections.
4. Medium: light type on the dark field feels muddy and the headline is weak. Restore paper/ink contrast, stronger headline weight and red choice emphasis.

Quick wins are removal of the placeholder figure, a clear industrial silhouette, a distinct material palette and a coherent paper/ink composition. The original five-beat learning flow and guide targets remain the scope boundary. Browser interaction uses the supported CUA API instead of the skill's shell browser helper.

## Verification

The integrated replacement is implemented. `after-1366.jpg` and `after-1440.jpg` are actual production-preview captures at 1366×768 and 1440×900. The CNC cavity exposes the spindle and fixture, the inspection gantry has a lens assembly, the console replaces the mannequin, and the moving blanks are machined metal flanges. Paper/ink typography, red enamel and steel reflections distinguish the scene's elements. The caption clears the machine and the model clears the feedback in both laptop views.

`npm test`: 176/176 pass. `npm run build`: passes; the existing large-chunk warning remains. The observed stage counter reports 58 calls and 35,546 triangles in the organization view, with one canvas. This does not establish FPS on physical laptops. One 1024px directional shadow is cached until viewport, beat or input changes; shared-renderer shadow and clearing settings are restored after the scene pass. Independent code review found no lifecycle blocker.

Ownership and distribution choices remain actionable. The owl practice step reaches the organization controls; pausing after a trial restores the prior choice and distribution view. Scene 08 opens successfully, and returning to 07 retains the choices. No horizontal overflow was observed at either laptop width. The temporary viewport override was reset after verification.

Screenshots and logs are local ignored QA artifacts; this Markdown review is tracked separately. The revised scene is available on the local preview. A code build or an internal design judgement does not establish the user's aesthetic acceptance.

## Second refinement: understandable choices and a live fault

The user then asked for more visible creativity, Pinterest inspiration and language that reads clearly. The selected direction retains the same workshop and five beats. It replaces abstract headings with “AI báo lỗi. Ai được dừng máy?”, “Chiếc máy này thuộc về ai?” and “Máy làm nhanh hơn. Ai được hưởng?”. Each choice starts with a concrete actor and consequence; the academic terms are explained after the example. The arrival and conclusion explicitly connect machines, AI and worker skills to productive forces, and ownership, work organization and distribution to production relations.

Original live geometry now supplies a distinct gold faulty part, an optical inspection signal, a stationary belt when the trained operator receives authority, readable ownership markers and three red branches to coexisting destinations. The machine → inspection → person sequence and stronger oblique composition were informed by a Pinterest machinery pin and Microflown's quality-control illustration. No image or geometry from those references is incorporated. Owl copy P01–P11 uses the same concrete language and controls. A duplicate practice completion sentence found in the actual owl cue was removed from P01.

The final integrated build passes, and all 176 tests pass. A targeted runtime transition check confirms that work0/work1 move the belt, work2 holds belt and spindle exactly, pausing holds animation, and resuming preserves phase. Actual stage counters: organization 65 calls / 36,454 triangles, distribution 77 calls / 40,858 triangles, one canvas. The cached contact-shadow floor follows the revised fixed oblique pose. No physical laptop FPS measurement is claimed.

Final captures: `live-1440-arrival.jpg`, `live-1440-distribution.jpg`, `live-1366-distribution.jpg`, `live-1366-stopped.jpg`. Both laptop sizes show uncropped copy, visible branches and space between the machine and feedback. Ownership selections change the actor and explanation; the conclusion opens scene 08. P01 reaches the new controls; changing a choice then pausing restores all three prior choices and the prior distribution beat. The plain-language review identified undefined theory vocabulary; arrival now describes the concrete elements first, then names the theory, and the ownership takeaway explains machines/tools/raw materials. User aesthetic acceptance and learner comprehension have not been measured.
