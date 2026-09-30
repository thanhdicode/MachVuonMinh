# Asset registry

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
