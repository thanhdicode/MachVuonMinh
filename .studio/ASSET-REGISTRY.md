# Asset registry

## Human × Machine finale — 2026-10-08

`public/images/finale/human-hand.webp` and `robot-hand.webp` are two separate original assets generated with the built-in image_gen tool, transparent_background=true. Raw alpha PNGs are retained locally in `.studio/hand-finale/generated/`; prompts, source paths, hashes, dimensions, alpha validation and measured fingertip anchors are recorded in that directory's parent `provenance.json` and `asset-manifest.json`. Runtime WebP total265,928 bytes,1680px wide, alpha preserved. Encoding only resizes and compresses, without inventing/removing anatomy or painting backgrounds. Generated output is used under the applicable generation-service terms; no claim of CC0, public domain or exclusive copyright.

[TJ-Paul wedding-invitation-parallax](https://github.com/TJ-Paul/wedding-invitation-parallax), inspected commita138edd96d63bca62a1a6a75c905f6eee2afad0e, is a concept reference for opposing hand entry, relative poses and text reveal. No LICENSE file found at that commit; no source script, wedding photos, cutout layer, flowers or other reference pixels are shipped. Original React/GSAP implementation preserves the existing Lenis system. The reference's virtualScroll, permanent body lock and autoplay are not imported. A separate cut overlay is unnecessary for this fingertip-only contact because neither hand crosses the other. The supplied Adam/cursor images are mood references only, not runtime assets.

Six SVG red signal paths, eight deterministic particles, contact pulse and layout are authored locally. No new WebGL context, stock icon, external sound or added library.

## Scene 07 — One workshop, 2026-10-05

The machining enclosure, red conveyor, optical AI inspection gantry, operator console and allocation markers are original procedural Three.js geometry authored in `src/experience/valueFlowGeometry.ts`. The 05/10/2026 visual revision removes the toy figure and adds chamfered enamel panels, lathed components, a visible machining cavity and shared instanced fittings. The live-process refinement adds an amber faulty flange, inspection beam, signal tower, mechanical ownership markers and three branching red routes to allocation trays. Pinterest's machinery pin and Microflown's quality-control illustration informed composition only; their images and geometry are not copied or incorporated. Reference links are in `SCENE-DIRECTIONS.md`. No third-party mesh, texture, portrait or stock image is used by the replacement scene. The studio reflection is generated from Three.js RoomEnvironment; no external HDRI is acquired. Existing opt-in synthesized audio is retained. ILO's HITI report and the official text of Resolution 57 are content references linked in the UI; no source photographs are reproduced. The previous generated portraits remain archived project assets with their original provenance.

## Scene 02 — V5 contemporary production, 2026-10-06

Original imagegen master retained at `.studio/scene02/master.png`; exact prompt, tool provenance and usage terms: `.studio/scene02/provenance.json`. Four illustrative views show contemporary manufacturing, logistics, data infrastructure and a technician. They are generated illustrations with authored camera motion, not documentary footage of named Vietnamese companies. No external reference pixels, corporate footage, logos or stock media were copied. Generated output is used under the applicable generation-service terms; no claim of CC0, public domain or exclusive copyright.

`public/media/scene02/frames/000.webp` through `139.webp`: 140 camera frames at 1280×720, 8.81 MB total. Four 1280×720 posters plus four muted six-second H.264 camera loops are used by the unpinned mobile layout. Native master is a 2×2 contact sheet; encoding includes cropping and upscaling. Hashes and per-frame bytes: `.studio/scene02/media-manifest.json`. Reproduction: `scripts/encode-scene02-media.mjs <master path>`. Desktop decodes at most twelve bitmaps, with two operations in flight even across leave/reentry; all bitmaps close on leave. No additional WebGL context, texture, model or external audio. Opt-in original Tone synthesis replaces the old line-shaft sounds.

The V5 archival seam reuses the Atlas's existing `h-data` final-era assets. The first modern machine view is opened by a horizontal mask; the red rail continues as a live signal. Ivory and red registration frames encode a qualitative 0–9% visual lag, not measured national lag. All factual claims are independently attributed in `src/data/scene02Evidence.ts` and the existing source drawer. Primary evidence is distinct from generated visual media.

References consulted for motion architecture, no code or assets copied: [ReactBits Scroll Mask](https://pro.reactbits.dev/docs/components/scroll-mask), [Codrops unified GSAP/Three/Lenis/audio architecture](https://tympanus.net/codrops/2026/07/15/the-architecture-behind-trionn-coordinating-gsap-three-js-lenis-and-web-audio/), [21st scroll video hero](https://21st.dev/community/components/explore/nt-scroll-video-hero-prompt), [Aceternity parallax](https://ui.aceternity.com/components/hero-parallax), official GSAP matchMedia/ScrollTrigger docs. No premium component source copied.

## Archived Scene 02 — The Line-Shaft Hall, 2026-10-03

Removed from the experience and public output on 2026-10-06. Historical generation provenance below is retained for audit only. Hall/worker/frame images, the Atlas flywheel transition anchor, mechanical source/renderers, motion and old sound layers have been removed from V5.

Supersedes the earlier SVG-worker infographic. `public/images/machine-hall/hall.webp` (1672×941) and `workers.webp` (1774×887, alpha) are original generated museum-reconstruction artwork made with the built-in image_gen tool. They are illustrations, not archival photographs or documentary evidence. No reference image pixels were copied. Generated originals remain under the chat's `.codex/generated_images` directory; original prompts and source paths are saved in `.studio/line-shaft/prompts.json` and `assets.json`. Project-bound WebP files preserve composition/alpha; the preparation script only encodes the originals. Generated output is used in this project under the applicable generation-service terms; no claim of CC0, public domain, or exclusive copyright is made.

Foreground flywheel, countershaft, overhead shaft, pulleys, real leather ribbon belts and small attached exit motor housings are original raw Three.js geometry in `lineShaftMechanism.ts`. Worker cutouts use unequal UV regions from the original transparent atlas. Room tone reuses original `history-05-analog-hum.wav`; quiet mechanical layers are synthesized in the existing opt-in AudioContext. No new model or third-party audio download.

Four `frame-{power,shaft,machines,system}.webp` files are direct captures of this original raw WebGL scene at progress .20/.40/.73/.92, without DOM captions or navigation. They provide the mobile/reduced-motion cinematic story without simplified vector mechanics. Their artwork rights/provenance are the same original generation and local geometry described above.

Historical physical logic checked against the Science Museum Group's [belt-driven drilling / slotting machine](https://collection.sciencemuseumgroup.org.uk/objects/co46466) and [Whitworth planing machine](https://collection.sciencemuseumgroup.org.uk/objects/co9369523/whitworth-planing-machine). These records support overhead shafting and belt-driven machine tools; the artwork is a generalized period reconstruction, not a reproduction of either collection object.

The supplied Pinterest references were accessed for compositional study: [assembly process](https://cl.pinterest.com/pin/416653403045895666/), [technical cutaway](https://www.pinterest.com/pin/415175659396773072/), and [vintage machinery](https://in.pinterest.com/pin/vintage-machinery-poster-in-yellow-and-grey--521150988135598624/). Factory Technical Drawing and Industrial Museum board returned HTTP403. No Pinterest assets were downloaded or reused, and no usage license was inferred from their availability.

## History Atlas additions — 2026-10-03

Seven original SVG bridge sketches in `HistoryBridge.tsx` connect wheel/rail, workshop, motor/electricity, transformer, container/logistics, rural grid and fiber/chip. Drawn locally; no external image pixels, stock vectors or additional rights dependencies. The four supplied references guided composition only and are not shipped.

Eight original ambience loops were deterministically synthesized by `scripts/prepare-history-audio.mjs`; no samples or third-party recordings were acquired. Shipping files and provenance are listed in `public/audio/LICENSES.md`, with metadata in `src/data/historyAudio.ts`. They are PCM16 mono 16kHz, 12 seconds each, normalized near -28 dBFS RMS with peaks at or below -6 dBFS. Project-use provenance is original synthesis, not a claim of CC0 or public-domain status. Existing generated reconstructions and sourced geographic assets retain the records below.

## Scene 02 / From machine to system — 2026-10-03

The flywheel, bearings, transmission belt, machine-tool ram and conveyor are original raw Three.js geometry in `src/experience/machineMechanism.ts`. Worker silhouettes, task links, timing clock and system diagram are original SVG in `MachineChapter.tsx`. Materials reuse the project's original cast/brushed data textures. No model, stock photo or reference pixels were downloaded.

Entry reuses the approved generated atlas `e-reconstruction-archive.webp` and `h-data-1440.webp`, whose original prompts and provenance are recorded in the History Bridge section below. Room ambience reuses original `/audio/history-05-analog-hum.wav`; velocity rhythm and engagement accents are synthesized in the existing user-activated AudioContext. No new external assets or licenses.

Composition principles studied: [PX PUSH](https://tympanus.net/codrops/2026/08/07/the-department-is-open-building-the-px-push-website/), [Cerebrium](https://tympanus.net/codrops/2026/07/23/building-cerebrium-making-serverless-infrastructure-tangible/), [MERSI](https://tympanus.net/codrops/2026/07/27/between-print-and-digital-the-making-of-mersis-website/), [The Spark](https://tympanus.net/codrops/2026/01/09/the-spark-engineering-an-immersive-story-first-web-experience/), and [Ten Years Away](https://tympanus.net/codrops/2026/07/08/ten-years-away-designing-an-interactive-comic-for-studio375s-tenth-anniversary/). Used for governing mechanism, physical causality, print restraint and beat continuity; no reference code/assets copied.

## History Bridge — 2026-10-02

Eight main editorial reconstructions and eight monochrome archive strips were generated with built-in imagegen for this project. They illustrate productive life rather than impersonating documentary photographs. No political portraits, logos or reference-image pixels were reused. The supplied architecture collage is a composition reference only; its redistribution rights were not established and it is not shipped.

Original outputs and complete prompts: `.studio/history/originals/`, `.studio/history/prompts.json`, with the tool-returned provenance paths in `generated-assets.json`. Shipping assets: `public/images/history/`, responsive transparent 768/1440px WebP, lazy 2048px zoom copies and 1600px archive strips. The tool returned 1536×1024 main originals; 2048px zoom files are upscaled, not new native detail. All ordinary shipping images are under 450KB; larger zoom copies are requested only after the user enables the lens and hovers, or opens the image dialog.

2026-10-03 polish: the user's additional history/church collage references were studied for composition and caption spacing only. Their redistribution rights were not established; no reference pixels or new external assets were shipped. Existing generated images are unchanged.

The faint geographic backdrop reuses this project's existing sourced Natural Earth vector and existing Hoàng Sa/Trường Sa locator data. No generated geography or third-party historical photographs were imported. Historical citation records live in `src/data/historySources.ts` and appear only in the source drawer.

## 2026-10-02 — final practice mini game

### Fixed-screen sprite revision

49 PNG assets replace the earlier procedural runner characters, obstacles and bosses. Download source: https://github.com/series-ai/jam-ready-assets at commit `782e3a09566b4bb3d98fe2ed07f5a8545e6fcfd4`. Only the three Kenney packs listed below are used; the repository's other packs/licenses are not imported. Original pack CC0 notices ship with the files. GitHub LFS PNG downloads are verified against each pointer's SHA-256. Assets total 116,920 bytes; no runtime requests to GitHub. Fonts and the existing one-WebGL-context limit remain unchanged.

| Pack | Creator license evidence | Use | Local license |
| --- | --- | --- | --- |
| Platformer Characters 1 | https://kenney.nl/assets/platformer-characters — CC0; original License.txt verified | Two human characters, six poses each | public/minigame/sprites/LICENSE-characters.txt |
| Robot Pack | https://kenney.nl/assets/robot-pack — CC0; original License.txt verified | Green/blue/red runners, four color boss variants, drive/jump/hurt poses | public/minigame/sprites/LICENSE-robots.txt |
| New Platformer Pack | https://kenney.nl/assets/new-platformer-pack — CC0; original License.txt verified | Living block boss, flying enemies, saws, spikes, crates, terrain, clouds and forest/hill backgrounds | public/minigame/sprites/LICENSE-platformer.txt |

Full upstream paths and pinned revision: `public/minigame/sprites/SOURCE.json`. Sprite index: `src/minigame/assets/sprites.json`. Original license notices are retained; rendering scales, mirrors and composites sprites with the authored red thread and chapter palette. These are illustrative game characters, not representations of specific individuals or equipment.

The first integration used procedural Canvas 2D characters. The sprite revision above supersedes those drawings. UI uses the project's installed Be Vietnam Pro and IBM Plex Mono Fontsource packages (SIL Open Font License), bundled locally. The 60 questions adapt the supplied MLN111 course material; the five chapters illustrate changes in productive forces, not five modes of production. Runtime assets are fully contained in this repository.

The experience combines original procedural geometry with the licensed character, car and terrain assets recorded below.

| Source | Intended use | Rights check |
| --- | --- | --- |
| [Poly Haven](https://polyhaven.com/) | HDRI, PBR, props | Record asset URL and its license page. |
| [ambientCG](https://ambientcg.com/) | PBR materials | Record asset URL and its license page. |
| [ThreeJS Assets](https://threejsassets.com/) | Web-ready GLB | Check the individual asset's terms. |
| [Quaternius](https://quaternius.com/) / [Kenney](https://kenney.nl/assets) | Stylized props | Check the selected pack's terms. |
| [Sketchfab](https://sketchfab.com/) | Distinctive hero objects | Check the individual model's license and attribution. |

| Asset | Source URL | License evidence | Attribution | Scene | Local path | Optimization |
| --- | --- | --- | --- | --- | --- | --- |
| Vietnam coastline and neighbouring land, Natural Earth 1:10m | https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_admin_0_countries.geojson | https://www.naturalearthdata.com/about/terms-of-use/ — public domain, verified 2026-09-28 | Natural Earth | 06 | src/data/vietnam-map.json | Extracted VNM/LAO/KHM/CHN/THA, simplified to 0.012 degrees, SVG projection |
| Hoàng Sa / Trường Sa geographic labels | https://danang.gov.vn/vi/web/dng/w/ubnd-huyen-hoang-sa-i ; https://svhttdl.khanhhoa.gov.vn/vi/di-tichdi-san-cap-quoc-gia/bia-chu-quyen-quan-dao-truong-sa-tai-dao-song-tu-tay-va-dao-nam-yet | Geographic facts redrawn as original vector symbols; no site imagery copied | Đà Nẵng; Sở VHTTDL Khánh Hòa | 06 | src/experience/VietnamEvidence.tsx | Group locator symbols, not invented island silhouettes or maritime boundaries |

Offshore detail: 7 Hoàng Sa points and 12 Trường Sa points are derived from Natural Earth's island polygons; Trường Sa is selected from its dedicated archipelago feature rather than a rectangular region that would accidentally include Philippine coastal islands. Symbols have a minimum visible size and do not depict maritime boundaries.

Original mechanical geometry, shader details and sound remain procedural. Imported models and terrain maps are listed in the 2026-09-30 refinement below. Fonts are installed Fontsource packages (SIL Open Font License).

Material refinement: two original deterministic 256×256 data textures in `src/experience/surfaceDetail.ts` provide machined grain and cast grain. These are linear roughness/bump data, with mipmaps; no third-party image assets or additional usage rights are required. Terrain pigments and band geometry are also generated locally.

| Cooperative drone vignette | Original image generated for this project with the built-in image_gen tool, 2026-09-28; no external reference image | Generated illustration; no third-party stock image or photograph used | Labeled as illustration in the scene and source drawer | 06 / HTX services | public/images/cooperative-drone.webp | Transparent 1200×800 WebP, 318,458 bytes; source PNG retained under .codex/generated_images |

This vignette depicts a possible cooperation between farmers and drone services, not the appearance or personnel of HTX Thâm Triều. The source article supports the fact, not the generated image. See IMAGE-PROMPT.md for the creative brief and source/output paths.

| Agricultural quadrotor, rice plants, operator and field | Original procedural geometry, 2026-09-30; functional reference https://ag.dji.com/t25/specs | No downloaded model, product texture or photograph incorporated | Source drawer distinguishes schematic model from equipment at HTX Thâm Triều | 06 / agriculture | src/experience/AgriculturalDrone.tsx; DroneField.tsx; droneGeometry.ts | Shared geometry/materials, instanced rice/spray, one existing WebGL context |

The cooperative-drone.webp illustration is superseded in the live agriculture case; retained as an earlier project asset only.


## 2026-09-30 — verified model and terrain refinement

| Asset | Source / rights evidence | Use and modification | Local file |
| --- | --- | --- | --- |
| Farmer, Quaternius Ultimate Modular Characters | https://quaternius.com/packs/ultimatemodularcharacters.html — CC0; distributed in https://github.com/AleDev11/FindTheNeedle-Coop-Mod/tree/main/mods/multiplayer/models with CREDITS.txt | Skeletal idle/walk; smoothed normals, altered hat, clothing colors, hand pose and equipment. Scenes 04 and 06. | public/models/farmer.glb, 518,880 bytes |
| Ferrari 458, vicent091036 | https://sketchfab.com/models/57bf6cc56931426e87494f554df1dab6 ; official distribution credit https://threejs.org/examples/webgl_materials_car.html ; license audit https://github.com/mrdoob/three.js/issues/23089 — CC BY 4.0 | Original model page returned 403; author and CC BY 4.0 verified through official three.js distribution/example and license audit. Recolored materials and scaled for a generic production illustration. Explicitly not a VinFast model or reconstruction. | public/models/production-car.glb, 1,681,572 bytes |
| Brown Mud 02, Poly Haven | https://polyhaven.com/a/brown_mud_02 ; https://polyhaven.com/license — CC0 | 1K color/normal/roughness, repeated on original irregular terrain. | public/textures/mud-*.jpg |
| Draco decoder, Google | https://github.com/google/draco — Apache-2.0; full license bundled | Decode the compressed car locally, avoiding runtime CDN dependency. | public/draco/ |

Public attribution and modification notices: public/ASSET-CREDITS.md, linked from both menu and source drawer. The earlier generated drone illustration is no longer rendered in the agriculture case. Rejected ToyCar and uncompressed experiments are local scratch files in ignored .studio/assets; they are not used or published. One Canvas remains; original instanced rice and mist share geometry.

## History mural replacement — 2026-10-03

Supersedes the History Atlas's repeated geographic/archive backdrop treatment. Four original matched sepia illustrations were generated with built-in imagegen, then tone-matched and composited offline with 341px / 20% feathered overlaps. Complete prompts, native dimensions and provenance: `.studio/history/mural/prompts.json`; retained originals: `.studio/history/mural/originals/segment-01.png` through `segment-04.png`. These are editorial reconstructions generated for this project, not documentary photographs or licensed external media. The user's four museum/infographic references were composition references only; no pixels are shipped and their redistribution rights were not assumed.

Shipping outputs: `public/history/atlas-panorama-8192.avif` (8192×1024, 689KiB), `atlas-panorama-4096.webp` (4096×512, 457KiB), `atlas-panorama-mobile-1024x8192.webp` (1024×8192, 1150KiB), and `atlas-machine-anchor.webp` (1024×1024, 217KiB). Originals are 2172×724; export resolution includes Lanczos upscaling. Reproduction script: `scripts/prepare-atlas-panorama.mjs`, preferring the saved originals. The browser renders one panorama image. Existing transparent era images and the existing machine-hall image retain their previous provenance. The old per-era archive files are no longer used by the Atlas; later scenes' references remain intact.

Audio revision supersedes previous −28dBFS balancing: quieter filtered noise, stronger original pentatonic/tonal/rhythmic layers, approximately −23dBFS RMS and peak ≤−5dBFS. A 300ms two-note cue uses the same persistent WebAudio context and output bus. Crossfades are 900–1300ms. Browser destination metering passed; the user confirmed clear sound, changed era backgrounds and correct mute/resume. Rights remain original project synthesis, with no external samples (`public/audio/LICENSES.md`). Acceptance evidence: `.studio/qa/history-mural/REVIEW.md`.

## Cú Mạch guide assets — 2026-10-03

| Asset | Provenance / use evidence | Local files | Status |
|---|---|---|---|
| Glasses-wearing Cú Mạch, seven poses | Original illustrations created with built-in imagegen for this project, using only this project's original concept01 and neutral owl as references. No Pinterest/user-reference/stock pixels, external character or logo used. These are generated illustrations, not photographs or documentary records. Exact prompts and native output paths retained. | `.studio/guide-assets/originals/{neutral,point-left,point-right,inspect,practice,confirm,bye}.png`; `.studio/guide-assets/prompts.json` | In use: displayed by `src/onboarding/OwlMascot.tsx` (poses lazy-loaded from `public/guide/`) and `GuideDock.tsx` |
| Runtime poses and dock | Lossy WebP encoding at quality82/alpha100; contain resize only, no crop/recolor or invented transparency. PNG alpha preserved. File/source SHA256 and dimensions in manifest. | `public/guide/owl-*.webp`, `public/guide/owl-assets.json`; script `scripts/prepare-owl-guide-assets.mjs` | 7 poses at256×256 + dock80×80; 149,732 bytes total (146.2KiB). Welcome neutral+dock:23,754 bytes (23.2KiB). Other poses lazy; static images only (whole-image crossfade/translate/nod, never CSS-flipped) |
| Driver.js 1.8.0 | npm `driver.js@1.8.0` (exact pin), MIT licence, © Kamran Ahmed, repository `nilbuild/driver.js`. Used as the spotlight/popover engine; in the main app it is bundled into a lazy chunk, and inside the game iframe `dist/driver.js.iife.js` + `dist/driver.css` are served from the copy below. No CDN. | `node_modules/driver.js` (npm) → `public/vendor/driver/1.8.0/{driver.js.iife.js,driver.css,license,manifest.json}` generated by `scripts/copy-driver-assets.mjs` on predev/prebuild/pretest (gitignored) | Verified 1.8.0 / MIT at install and on every copy; MIT notice shipped with the distribution |

The illustrations are static poses, not a layered animation rig. The plan uses whole-image crossfade/translate/nod only. Both pointing directions are supplied rather than CSS-mirroring the character. Concept and source PNGs are retained unchanged. Gallery at `.studio/guide-assets/review.html` supports40/64/96px review on light/dark backgrounds and previews all70 plain-language guide steps. Human clarity/mobile/full Driver behavior remain implementation QA gates, not claims proven by this asset gallery. Public notice is in `public/ASSET-CREDITS.md`.

## Game panorama refinement — 2026-10-04

Five original Canvas 2D panoramas (rice terraces/village, brick mill, automation plant, connected city, renewable energy) are drawn locally by `src/minigame/assets/game-background.js`. No downloaded image, model or third-party art is incorporated. Paper, oxide and slate palettes, two parallax layers and a red horizon thread follow `.studio/ART-DIRECTION.md`; direction selection is recorded in `SCENE-DIRECTIONS.md`.

The renderer caches three bounded offscreen layers, rebuilds on a stage/size change, and fixes the parallax offsets in reduced motion. Existing foreground sprites retain their original credits. Implementation research: [MDN Canvas optimization](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas), used for offscreen caching and an opaque main canvas; no documentation imagery is shipped.

## Pixel runner replacement — 2026-10-04

Supersedes the flat procedural game panoramas above. User selected a side-view pixel runner. Three visual directions and library research (official Chromium Dino, Phaser and Kontra sources) are recorded in `docs/superpowers/plans/2026-10-04-pixel-runner-redesign.md`; those engines' code/art/audio are not copied into this implementation. Existing question data, campaign physics, hearts, boss rules and guide bridge remain in place.

| Asset | Author / verified rights | Runtime use / retained evidence |
|---|---|---|
| Pixel Adventure 1: Virtual Guy, saw, spikes, crate and Rock Head | [Pixel Frog official author page](https://pixelfrog-assets.itch.io/pixel-adventure-1), CC0 1.0, verified 2026-10-04 | Actual 32px Run sheet has12 frames; Idle11, Hit7, Jump/Fall1; 38px Saw8; 42px Rock Head/ Blink1/4. Cropped at runtime with nearest-neighbor rendering; red scarf and stage attachments added in code. `public/minigame/runner/manifest.json` records file/archive hashes; `licenses/pixel-frog.txt` records rights. |
| Pixel Platformer, Farm Expansion, Industrial Expansion | [Kenney base](https://kenney.nl/assets/pixel-platformer), [farm](https://kenney.nl/assets/pixel-platformer-farm-expansion), [industrial](https://kenney.nl/assets/pixel-platformer-industrial-expansion); author CC0, verified in pages and each original License.txt | Original18px tilemaps supply scrolling ground, crops, pipes, machinery and flying hazard poses. Original licence files are shipped in `public/minigame/runner/licenses/`. |
| Impact Sounds and Interface Sounds | [Kenney Impact](https://kenney.nl/assets/impact-sounds), [Interface](https://kenney.nl/assets/interface-sounds); author CC0, original licences retained | 10 short local OGG effects, 89,757 bytes, selected paths/hashes in `audio/manifest.json`. Original quiet five-stage synthesized score and safe synthesized effect fallback are project code. Audio requires a gesture; mute/pause/hidden/close silence it. |
| Five landscape plates: rice, mill, automation, digital, future | Original built-in imagegen generation for this project; no external reference pixels | Native1672×940 PNG retained under `.studio/game-runner/originals/`; complete prompts/provenance in `prompts.json`. Runtime1280×720 WebP uses nearest-neighbor resizing, quality91. All18 runtime image files total1,516,570 bytes, recorded by manifest. These are generated game scenery, not documentary imagery. |

Runtime uses Canvas2D, no additional WebGL context or CDN. A single panorama per view prevents duplicated suns and mirrored landmarks; bounded slow camera travel, independently looping near sprites/road, animated machinery/steam/turbine, state-specific character frames and pixel particles supply motion. Three fixed-size layer caches stay at or below1536px wide. Decorative motion is disabled under reduced motion; paused/quiz/guide-held pixels freeze. Asset failures retain visible local runner/hazard/boss fallbacks. Full downloaded packs are scratch files in ignored `.studio/game-runner/resources/`; selected runtime files, licence evidence and generated originals are retained.

### Runner scenery atlas — 2026-10-04

Original built-in imagegen atlas, fifteen scenery cutouts matched to the five existing project panoramas. No third-party art or tutorial pixels were copied; tutorial links in the scenery implementation plan are technique references. Used as project-generated illustration, not licensed under CC0 or presented as documentary material. Native transparent PNG1374×1145 retained at `game-runner/originals/scenery-atlas.png`; prompt and alpha-cleanup edit retained in `game-runner/scenery-prompts.json`. Native SHA256 `a5b2ea1e1c0b35220389b440ddc5af8b95efe6954ca43e4e8c00d9e59dc9a2af`.

Runtime: `public/minigame/runner/images/scenery-atlas.webp`,768×640, nearest-neighbour downsample and lossless WebP,633,528 bytes, verified alpha crop bounds and hashes in the runner manifest. It replaces coarse decorative crop/fence/industrial tiles and the independent gear/turbine overlays; Kenney terrain remains. Scenery has its own slower parallax, rooted foliage canopy motion, cascade glints, attached pump/vent steam, utility lights and solar highlights. Total selected runtime image bytes are2,150,098. Three bounded caches, no extra WebGL context/dependency. Pause and reduced motion freeze decorative movement.

### Scene 07 — generated composite portraits, 2026-10-04

Three original built-in image_gen portraits, fictional Vietnamese worker, workshop owner and AI engineer; no acquired portrait pixels, logos or documentary claim. Native alpha PNG1024x1536 retained in .studio/scene07/originals; exact prompts/source paths in prompts.json. Runtime683x1024 alpha WebP files total445140 bytes. No CC0 claim for generated content. Hashes/native dimensions are in .studio/scene07/assets.json; generation and export use the existing bundled sharp runtime. Value Flow and physical controls are original code-authored geometry, Tone.js audio is original synthesis. No third-party model, texture, HDRI or sample was acquired for this scene; complete rights/provenance in ASSET_LICENSES.md. User's three references remain research-only.

### Studio environment baked for load performance — 2026-10-05

`public/textures/studio-cubeuv.hdr`: original project lighting, generated from the existing three Lightformers (no external HDRI/image). Original settings: intensity4 at `[0,5,-5]`, scale`[12,6,1]`; intensity2 at `[-5,1,3]`, rotationY`π/2`, scale`[8,3,1]`; intensity1.5 at `[5,-2,2]`, rotationY`-π/2`, scale`[10,2,1]`. Captured with the existing renderer at resolution128 and convolved using Three0.186.1 PMREM. RGBA half-float384×512 capture retained locally in ignored QA files; `scripts/encode-studio-environment.mjs` encodes the capture as Radiance RGBE RLE. Runtime66,253 bytes, maximum RGBE component error relative to that pixel's brightest component0.679%. Original procedural asset; no third-party pixels, licence or attribution requirement. Loaded directly with CubeUVReflectionMapping, bypassing runtime cubemap capture/PMREM filtering. The workshop shares this lighting texture; one WebGL context remains.

### Scene 02 — Sổ tay Việt Nam, 2026-10-06

Adapted from MengTo/sketchbook commit c1e477814c4c9e204452ebf9b298aa13629cbfc2 and the ThreeUI canonical Sketchbook document. Repository: https://github.com/MengTo/sketchbook. Original paper, botanical decorations and authored motion retained. The inspected repository has no LICENSE file; README describes it as open source, but no specific redistribution licence has been verified. Attribution is retained; do not label these assets MIT or CC0.

Nine Vietnamese open-book illustrations generated using built-in imagegen with the source book as composition reference. These are conceptual illustrations, not documentary photographs. Exact prompts/native provenance: .studio/sketchbook-reference/generated-assets.json. Alpha WebP runtime files total 2,675,414 bytes; dimensions and SHA256 in asset-manifest.json. Original PNGs retained locally. Source motion engine SHA256 remains 7805284fe73263ca7ba472b82af862e34ada5b082037f3c81388884dffd9d8d3. Host layout/content/navigation adapters are separate from that engine.

Vietnamese Instrument Serif and Newsreader fonts obtained from Google Fonts; SIL Open Font License 1.1 notices retained beside runtime font files. Verified against official google/fonts ofl/instrumentserif/OFL.txt and ofl/newsreader/OFL.txt. No new WebGL context. Previous V5 media archived locally, no longer in public render path.
