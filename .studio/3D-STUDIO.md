# 3D studio pipeline

1. Define the scene's conceptual job from `03_SCENE_BY_SCENE_V2.md` and compare art directions in `ART-DIRECTION.md`.
2. Pick or author a hero object. Prefer procedural geometry when no excellent asset fits (`07_MASTER_PROMPT_V2.md`).
3. For authored assets: Blender or Spline → glTF/GLB → optimize geometry/textures with glTF Transform and Meshopt/Draco where justified → convert to R3F components only if reuse benefits from it. Check orientation, scale and material response in the actual scene.
4. Light with a suitable HDRI or authored setup, then tune materials and camera. Add TSL/GLSL and post effects only when the narrative needs them.
5. Connect one persistent camera and thread to the world timeline. Use Lenis → GSAP ticker → ScrollTrigger. Keep frame values in refs, not React state.
6. QA at 1440×900, 1920×1080 and 390×844. Respect the single WebGL context, DPR cap and mobile particle budget in `06_TECH_ARCHITECTURE_V2.md`.

Runtime packages are installed; they are not all imported by the starter page. Physics, particles, spring motion and postprocessing enter a scene when needed. `leva` and `r3f-perf` are development tools only. The `r3f-perf` package pins an older Drei internally, so `package.json` overrides it to the project's Drei 10; verify the profiler in a browser before relying on it.
