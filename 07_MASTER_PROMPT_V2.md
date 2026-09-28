# MASTER PROMPT V2 — FULL REBUILD DIRECTIVE

You are the principal creative developer, interaction designer, 3D engineer, art director and QA owner.

Do NOT polish the current layout.

The current implementation is rejected because it visually behaves like an AI-generated slide deck:
- oversized centered text
- huge empty beige regions
- repeated floating rectangular cards
- weak flat illustrations
- repetitive compositions
- UI dashboards instead of an experience
- no dominant persistent 3D idea
- philosophy explained mainly by paragraphs

Read these files in exact order:
1. 00_NORTH_STAR.md
2. 01_RESEARCH_REFERENCES.md
3. 02_DESIGN_SYSTEM_V2.md
4. 03_SCENE_BY_SCENE_V2.md
5. 04_MOTION_AND_EFFECT_MAP.md
6. 05_CONTENT_CORRECTIONS_V2.md
7. 06_TECH_ARCHITECTURE_V2.md

Then inspect the current codebase.

Preserve only:
- validated content/data
- useful lab logic
- useful accessibility/performance utilities

Rebuild the visual composition and interaction system.

## Governing concept
ONE object persists through the entire experience:
THE RED THREAD.

It transforms:
furrow → belt → signal → data stream → lab pulse → Vietnam path → adaptive loop.

It represents productive-force movement.

Structures around it represent production relations.
Fit = flow.
Mismatch = pressure/blocked flow/deformation.
Adaptation = cage reconfiguration.

If an effect does not support this metaphor, remove it.

## Reference quality bar
Study before final composition:
- Podium
- MERSI
- ZERO
- Cerebrium
- The Spark
- Shader.se scroll pipeline
- scroll-driven 3D camera path
- SVG mask transition
URLs are in 01_RESEARCH_REFERENCES.md.

Do not clone screenshots. Extract principles.

## STEP 1 — remove AI-slop patterns
Remove:
- centered current hero layout
- ordinary start button
- four-button permanent top toolbar
- left numbered chapter rail
- chapter cards
- Vietnam card grid
- checkbox policy cards
- large empty beige screens
- flat weak illustration
- generic shadowed panels
- mixed serif/sans body system

## STEP 2 — foundation
Set design tokens.
Use only:
Be Vietnam Pro + IBM Plex Mono.

Create:
WorldCanvas
WorldTimeline
CameraRig
RedThread
MinimalNav
SourceDrawer
SceneCopy

Set:
Lenis → GSAP ticker → ScrollTrigger.

Do not put frame-by-frame scroll values into React state.

## STEP 3 — Red Thread first
Do not build chapters until this object looks premium.

Requirements:
- tactile red cord/energy path
- spline based
- damped pointer response
- persistent across scenes
- mode/material changes
- pulse travels along it
- supports tension state
- visible in screenshot

## STEP 4 — intro gesture
No Start button.

Implement:
paper background
red thread endpoint
one metal eyelet
prompt `KÉO SỢI ĐỎ QUA VÒNG`

User drag succeeds:
1. click sound
2. ink-bleed reveal
3. title reveal
4. camera drift begins
5. scroll unlocks

Fallback:
tap/Enter.

## STEP 5 — one continuous spatial world
One persistent camera.
Use CatmullRom path.
Scroll moves camera through space.
Do not teleport between HTML sections.

## STEP 6 — scene 01
2.5D soil landscape.
Thread = furrow.
Abstract plough blade.
No cartoon.
Transition physically derives into gear.

## STEP 7 — scene 02
Dark industrial space.
Huge 3D drive gear.
Thread = belt.
Camera passes through gear.
Text integrated at frame edge, no box.
Exit via dither.

## STEP 8 — scene 03
Build clean robotic arm from primitives.
One automation control.
Manual → supervise → design/knowledge visual change.
No 3 role cards.

## STEP 9 — scene 04
Particles flow on the thread path.
Spatial nodes: Data / AI / Infrastructure / Skills.
No row of buttons.
Collapse particles to Lab core.

## STEP 10 — Dialectic Lab
Completely rebuild current dashboard.

Center stage:
3D inner LLSX core + outer QHSX cage.

Controls only at edges.

Implement visual states:
FIT
STRAIN
CONTRADICTION
RECONFIGURATION

Mismatch must visibly:
deform cage
block signal
accumulate energy
misalign plates

Adaptation must:
detach plates
rebuild shell
restore flow

Screenshot must look like a premium interactive exhibit before touching any controls.

## STEP 11 — Vietnam
No 4-card grid.

Red thread draws Vietnam path.
One evidence node at a time.
Each node has exact verified source.
Click opens source drawer.

Never equate QHSX and “thể chế”.

## STEP 12 — policy chamber
Replace checkbox grid with 3 sockets + draggable lever tokens.

Exactly 7 tokens from scene spec.
User installs 3.

Results:
strength
trade-off
missing dimension

No numeric winner score.

## STEP 13 — synthesis
Strip everything away.
Thread + one adaptive structure + final thesis.

Large type only in hero and finale.

## Motion rules
Allowed signature effects:
red-thread drag
ink bleed
camera through gear
dither dissolve
signal particles
particle collapse
cage deformation
cage reassembly
map path draw
drag-to-socket token
final loop morph

Forbidden filler:
aurora
random beams
floating blobs
starfield
global blur text
constant RGB shift
random parallax
generic gradient balls

## UI rules
Never:
3 equal feature cards
4 equal evidence cards
giant centered button
beige drop-shadow panel
default shadcn look
SaaS nav
square icon badges everywhere

Use:
lines
nodes
labels
spatial markers
physical tokens
drawers for secondary detail

## Copy rules
Maximum 40 words on main canvas per beat.
No duplicated headline and paragraph.
No invented facts.
Use 05_CONTENT_CORRECTIONS_V2.md.

## Asset rule
If no excellent asset exists, build procedural geometry.
Do not insert unrelated Unsplash.
Do not use generic AI clip-art.
Do not fabricate historical documentary images.

## Performance
One renderer.
One shared timeline.
Adaptive DPR.
Only current scene full-detail.
Mobile gets a dedicated composition.

## Mandatory visual QA loop
After every major scene:
1. run
2. capture 1440x900 screenshot
3. inspect
4. reject and redesign if:
   - more than half screen is useless blank space
   - text/card is visually stronger than scene
   - it resembles a slide
   - more than one large rectangular panel dominates
   - scene lacks depth
   - red thread has no visible role
   - chapter cannot be understood without reading a paragraph
5. iterate without waiting for user feedback.

## Acceptance
- no ordinary hero Start button
- opening gesture works
- red thread persists
- one continuous journey
- no left rail
- no permanent 4-button toolbar
- no chapter-card layouts
- true 3D industrial moment
- automation changes visual world
- digital section is spatial
- Lab centers real 3D core
- cage visibly reacts
- Vietnam is path/evidence field
- policy interaction is drag-to-slot
- exact source drawer exists
- theory is correct
- mobile re-authored
- reduced-motion supported
- build succeeds
- no console errors
- screenshots no longer resemble slides

Do not answer with another plan.
Implement, run, screenshot, critique, iterate, then report.
