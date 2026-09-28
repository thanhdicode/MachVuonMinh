# MOTION & EFFECT MAP

Every effect needs a narrative job.

| Scene | Effect | Purpose |
|---|---|---|
| Hero | draggable red thread | agency + central metaphor |
| Hero→01 | ink-bleed mask | print becomes living world |
| 01 | layered parallax terrain | tactile historical depth |
| 01→02 | shape morph | transformation, not page change |
| 02 | camera-through-gear | industrial scale |
| 02→03 | ordered dither | material → electronic |
| 03 | kinematic robot | automation as system |
| 03→04 | signal particles | machine → data |
| 04 | particles on spline | digital productive flow |
| 04→05 | particle collapse | abstraction → testable core |
| 05 | core/cage deformation | contradiction |
| 05 | cage reassembly | new fit |
| 06 | SVG path draw | grounded Vietnam evidence |
| 07 | drag/snap lever tokens | active application |
| 08 | loop morph | synthesis |

## Red thread
Use TubeGeometry / mesh line / custom tube.
Curve: CatmullRom.
Pointer endpoint damped with maath.
Persist through all scenes.

Modes:
soil → belt → signal → data → labPulse → map → finalLoop

## Camera
One persistent camera.
worldProgress 0–1 maps to a CatmullRom camera curve.
Use separate lookAt anchors or a target curve.

## Scroll
Lenis → GSAP ticker → ScrollTrigger.
Store high-frequency scroll/camera values in refs, not React state.

## Text
Do not animate every character.
Allowed:
- hero mask reveal
- one line-reveal per scene
- brief contradiction glitch <300ms

## Ink bleed
Use twice max:
intro unlock
menu/source reveal

## Dither
Use for material→digital transition only.
No global dither.

## Postprocessing
High tier:
subtle bloom
optional N8AO
noise 0.015–0.025
almost no vignette

Never:
global chromatic aberration
heavy DOF while reading
huge bloom

## Sound
small interaction punctuation:
thread tension
metal click
gear thump
data sweep
contradiction resonance
mechanical unlock
final resolved tone

No autoplay music.

## Library discipline
React Bits / Motion Primitives:
use max 2–3 adapted utilities.
Do not import aurora/beams/spotlights because they are trendy.
