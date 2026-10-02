# Selected directions, before implementation

## 2026-10-02 — fixed-screen runner revision

Compare a floating quiz over the arena, a fixed arena with an adjacent question rail, and a compact vertical arena/question split. Choose the adjacent rail on desktop and vertical split on phones: every game control, question and answer remains in the viewport with no document or panel scrolling. Paper/ink/red frames licensed Kenney sprites, layered scenery and a red energy trail. Remove separate defense/attack turns: a correct boss answer strikes, an incorrect answer triggers counterattack. Challenge comes from readable jump/duck combinations, moving drones, warned spikes and variable-width hurdles; spacing must remain physically solvable at the speed cap.

## 2026-10-02 — ôn tập sau cảnh kết luận

Compare (1) a tenth scroll scene with the game inside the existing camera timeline, (2) a full-screen practice space launched from scene 08, and (3) a separate external game page. Choose 2: the final red action continues the presentation into an audience activity, retains the exhibition at its exact scroll position and offers a clear return. Direction 1 would stretch the cinematic timeline around a long quiz; direction 3 would disconnect the audience from the exhibition.

Reuse the authored 2D runner, five bosses and 60 questions. Adapt its frame to paper, ink and the red thread, using only Be Vietnam Pro and IBM Plex Mono. Keep the game isolated in a lazy-loaded iframe; its Canvas 2D adds no WebGL context. Suspend the exhibition renderer and Lenis while practice is open. In the game, scenery continues while answering, bosses gate progression, and three hearts apply throughout. Verify finale launch, return/focus, repeated mounting, gameplay and 390×844 layout; run existing tests and production build.

The shared idea is an engineering specimen becoming a living social system. Compare every scene against ART-DIRECTION.md: the thread must explain the object, with physical depth and no narrative panels.

| Scene | Alternatives considered | Chosen direction and meaningful motion |
|---|---|---|
| 00 | Flat print eyelet / monumental machined eyelet / fabric loom | Machined eyelet on paper: a tangible drag through a gate teaches the relationship. Red cord bends into the aperture. |
| 01 | Aerial furrows / floating geological specimen / literal farm | Geological specimen: layered cut earth and a forged blade; red furrow becomes a circular belt at exit. |
| 02 | Factory panorama / isolated flywheel / exploded engine | Monumental flywheel: camera enters the hub, the red belt carries torque. Teeth echo the plough blade. |
| 03 | Conveyor corridor / robotic specimen / dense factory | Robotic specimen: clean segmented arm and red signal circuitry; one control changes action and human-role nodes. |
| 04 | Starfield / fiber braid / node city | Fiber braid: cream packets follow red curves through spatial labels and condense into a central core. |
| 05 | Dashboard / floating rings / cutaway pressure vessel | Cutaway pressure vessel: ivory organic core inside articulated red plates. Plates strain, separate and reseat; edge controls keep the object dominant. |
| 06 | Literal map cards / embossed evidence atlas / statistics board | Evidence atlas: red mainland path with fine graticule, brass active locator, one source at a time. Schematic geography explicitly labeled. |
| 07 | Checkbox list / three-port machine / lever wall | Three-port machine: draggable metal tokens attach around the central system. Installed policies light different parts of the system. |
| 08 | Text ending / endless knot / adaptive open ring | Open ring with a looping cord: the structure breathes as the thread continues. Editorial left thesis, right object. |

Research principles: Podium's continuous timing; MERSI's print hierarchy; ZERO's agency at entry; Cerebrium's tangible abstraction; Shader.se's shared scene lifecycle; camera-path and SVG-mask references' controlled transitions. The Spark URL did not load in the research tool. No reference assets or code are copied.

## Rejected-pass correction, 2026-09-28

00 alternatives: plain torus / pressed grommet / stepped machined collar. Choose the collar: wide brushed face, recessed inner sleeve, fastening detail, thinner textile cord and precise engraved annotations. The prior torus looked like plastic and failed the material criterion.

01 alternatives: stacked slabs / rough terrain cutaway / farm diorama. Choose a rough cutaway with actual curved plough beam and mouldboard. Avoid the plywood-strip appearance.

05/07 alternatives: square cage blocks / articulated curved pressure bands / decorative orbital rings. Choose curved pressure bands; their separating seams communicate structural adaptation.

06 alternatives: hand-drawn silhouette / licensed coastline atlas / image-generated map. Choose a geographically sourced vector atlas, with Hoàng Sa and Trường Sa locators, island labels, graticule and source key. Generative imagery is unsuitable for precise geography. Do not present group locator symbols as island boundaries.

Motion audit: wheel must change the camera immediately; native touch must reach the document. Use Lenis's documented stylesheet and GSAP ticker integration, refresh scroll measurements after unlocking, and reload changed timeline modules in development to prevent stale singleton closures. Final scene must stay visible at document end.

## Follow-up interaction and material pass

03: compare an ambient signal loop, a cable following the articulated arm, and a full factory line. Choose the articulated cable plus a few moving workpieces: the red thread becomes an actual control path, and the automation control changes the visible production rhythm. Avoid adding another environment or renderer.

07: compare hidden drop targets, a highlighted receiving socket, and an instruction overlay. Choose socket feedback: the destination previews attachment before release. On mobile, compare tiny three-column results, a modal, and three compact full-width rows. Choose the rows to keep the tradeoffs visible next to the system without another modal.

## Material and geometry refinement

Compare mirror chrome, rough cast metal, and satin machined steel. Choose satin steel for the collar/gears; oxblood enamel and restrained brass fasteners for the adaptive bands. Keep dark surfaces warm charcoal and light surfaces ivory, with the red thread providing continuity. This palette is an editorial decision, not a claim that philosophy prescribes specific colors.

Replace the layered rectangular soil slabs with a continuous furrowed cutaway. Use generated vertex pigments and fine surface grain. Replace the low-resolution core with a smooth sphere and analytical deformation normals; the silhouette still records mismatch. Limit reassembly to the object stage so control labels remain readable. Repeated engraving, stones and band details share or instance their geometry.

## Scene 04 — connected production bench

Compare (1) an orbital constellation, (2) an exploded vertical stack, and (3) one connected production bench. Choose the bench: infrastructure physically supports data, computation and a human-operated console. The first option repeats the disconnected icons; the second obscures the links on phones. Satin metal, oxblood enamel, brass fasteners and one continuous red signal fit ART-DIRECTION.md.

Implementation: replace DataField's decorative wave with a single chassis and physically terminated paths; keep existing shared materials and one Canvas. Move scene copy into a compact left column; center the assembly beneath it on mobile. Keep the human operator visually present and describe AI as a tool. Animate a small instanced signal set, freeze on pause/reduced motion. Check 1440x900 and 390x844 screenshots, scrolling into/out of the scene, console errors, existing tests and production build. No new dependencies or external assets.

## Scene 06 agriculture — from backpack to flight plan

Directions: (1) side-by-side manual/drone dioramas, (2) a full-screen rotating drone showroom, (3) one field with three controllable moments. Choose 3: the same field and worker connect BEFORE (backpack sprayer), AFTER (aerial spray + remote supervision), and COORDINATION (HTX links farmers and a service operator). Direction 1 halves the model size; direction 2 explains hardware but not the changed work. Default to AFTER for a dominant, legible drone silhouette. A detailed original agricultural quadrotor uses ivory tank, graphite arms, enamel red shell, visible pump/nozzle/plumbing and curved propeller blades.

Scope: author AgriculturalDrone.tsx and DroneField.tsx, small procedural geometry helpers with geometry/flight tests; connect farmStage state to VietnamEvidence and EvidenceObjects. Remove the flat illustration from this case. Keep the atlas in an accessible dialog, including Hoàng Sa and Trường Sa. Give the controls one explanatory sentence per stage. Preserve the other evidence cases. Use existing Three AnimationMixer for rotors, frame-rate-independent interpolation for staging, instancing for crops and spray; one Canvas and existing DPR caps. Verify stages, map, other cases, pause/reduced motion, wheel transitions, 1440x900 and 390x844, then production build.

Research: https://khuyennongvn.gov.vn/chuong-trinh-nganh-nong-nghiep/tai-co-cau-nganh-nong-nghiep/nong-dan-trieu-co-huong-ung-ap-dung-thiet-bi-bay-khong-nguoi-lai-phun-thuoc-tru-sau-31942.html (20 March 2026) supports 28.4 ha and HTX contracting drone services. No model is identified; no measured before/after baseline for this HTX is supplied. Therefore BEFORE is a general illustration of manual work, not a documented reconstruction, and no speed/yield multiplier is invented. https://ag.dji.com/t25/specs supplies reference proportions and four propellers/tank/two nozzles; https://ag.dji.com/t25 describes planning and remote operation. The original 3D model illustrates the mechanism, not this branded model or the HTX's particular equipment.


## Model refinement — people, paddy and factory

Compare: (1) more detail on primitive figures, (2) photo cutouts, (3) lightweight rigged models with authored materials and poses. Choose 3: natural body proportions, recognizable clothing, hands and skeletal movement, with a shared restrained palette. Retain the approved original drone. Use PBR mud, shallow water and varied rice plants for the field. For the factory compare a map-dominant split, a small inset car, and a large production assembly with the atlas available on demand. Choose the assembly: the user must recognize the vehicle and operator before opening geographic context.

The imported car is an illustrative Ferrari model, not a VinFast vehicle; state this beside it and in the source drawer. Keep attribution and licenses in public/ASSET-CREDITS.md. Do not imply the licensed asset is an actual model used in the cited evidence.

## Mini game — collision popup revision

The latest user instruction replaces continuous running during obstacle questions with a frozen scene and a popup inside the arena. Use a centered paper card, oxblood accents and a dimmed backdrop; expand the arena into the available content area while the popup is open so the question, four answers, full explanation and continue action fit without scrolling. Keep the HUD and return control visible. Freeze physics, world animation, distance and speed until explicit continuation. Preserve the simplified animated boss battles and the existing sprites.
