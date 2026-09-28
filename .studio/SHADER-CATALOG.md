# Shader catalog

This is a selection guide. No custom shaders are implemented yet. Use `.agents/skills/webgpu-threejs-tsl/` for WebGPU/TSL, `.agents/skills/threejs-node-tsl/` for Three.js nodes and `.studio/frontendmaxxing/shaders.skill.md` for visual references. Keep a WebGL fallback where required by the target browser set.

| Shader | Narrative use | Limit |
| --- | --- | --- |
| Ink bleed | Unlock intro and reveal sources/menu | Two uses maximum. |
| Ordered dither | Machine material becomes digital signal | Transition only. |
| Core deform | Show pressure between LLSX and QHSX | State driven; preserve legibility. |
| Signal pulse | Trace movement along the red thread | Keep the thread visible in still frames. |
| Subtle bloom/noise | Final color grade where needed | One composer; avoid heavy DOF and chromatic aberration. |

For each implementation, add the actual file path, supported renderer, fallback, measured cost and scene to this table.
