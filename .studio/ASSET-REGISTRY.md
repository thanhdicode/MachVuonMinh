# Asset registry

The 3D geometry, surface data and sound are authored procedurally. Geographic sources and the original generated illustration are recorded below.

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

All mechanical geometry, materials, shader details and sound in the experience are authored procedurally. Fonts are installed Fontsource packages (SIL Open Font License). No external HDRI or model is used.

Material refinement: two original deterministic 256×256 data textures in `src/experience/surfaceDetail.ts` provide machined grain and cast grain. These are linear roughness/bump data, with mipmaps; no third-party image assets or additional usage rights are required. Terrain pigments and band geometry are also generated locally.

| Cooperative drone vignette | Original image generated for this project with the built-in image_gen tool, 2026-09-28; no external reference image | Generated illustration; no third-party stock image or photograph used | Labeled as illustration in the scene and source drawer | 06 / HTX services | public/images/cooperative-drone.webp | Transparent 1200×800 WebP, 318,458 bytes; source PNG retained under .codex/generated_images |

This vignette depicts a possible cooperation between farmers and drone services, not the appearance or personnel of HTX Thâm Triều. The source article supports the fact, not the generated image. See IMAGE-PROMPT.md for the creative brief and source/output paths.
