# Model refinement verification — 2026-09-30

- Replaced primitive people with cloned, independently animated Quaternius characters. Fixed an initially invisible character caused by stale skeleton world matrices during normalization. Regression check validates scale, wrist lookup, and 60 frames each of idle/walk for both appearances.
- Retained the original drone and added readable manual / drone / cooperative states. Handheld equipment follows the wrist; manual spray starts at the wand. Rice uses instanced geometry and subtle shader wind, stopping with pause/reduced motion. Wet mud maps replaced the overly pale flat surface.
- Replaced the generic car block with a licensed detailed model and made the factory assembly the dominant visual. Arms reach toward the car. The adjacent label and attribution distinguish the sample vehicle from VinFast evidence.
- Desktop 1440×900 and mobile 390×844: all farm stages captured, one Canvas, no old raster illustration, all measured text/control rectangles inside the viewport and mutually clear. Screenshot review found no cropped drone at the sampled flight positions. A 1280×720 audit caught overlapping stage/evidence text; a height breakpoint fixed it and the check passed.
- Scene 04: new posed operator, coherent bench, all four captions clear of copy on mobile. Screenshots saved for both desktop and mobile. Factory screenshots and the GDP case checked separately.
- Mobile atlas dialog shows Hoàng Sa and Trường Sa. Closing restores focus to its trigger. Wheel input moved scrollY from 6544 to 7784 and reached scene 07.
- Paused screenshots byte-identical. Reduced-motion screenshots byte-identical after the final texture update; temporary emulation cleared. Clean reload/navigation logged zero browser errors.
- node --test tests/*.test.mjs: 4 files passed. npm run build: passed. git diff --check: passed. Existing large Three.js bundle warning remains (~304 kB gzip for WorldCanvas); no FPS or real-device battery benchmark claimed.
- Attribution: public/ASSET-CREDITS.md (CC0 character/terrain; CC BY 4.0 car); Draco Apache-2.0 license bundled. No additional runtime dependency.
