# Nguồn mô hình và vật liệu / 3D asset credits

## Nhân vật

Farmer — Quaternius, Ultimate Modular Men / Ultimate Modular Characters.
License: CC0 1.0 (public domain dedication).
Original pack and license: https://quaternius.com/packs/ultimatemodularcharacters.html
Distribution: https://github.com/AleDev11/FindTheNeedle-Coop-Mod/blob/main/mods/multiplayer/models/farmer.glb
Distribution credits: https://github.com/AleDev11/FindTheNeedle-Coop-Mod/blob/main/mods/multiplayer/models/CREDITS.txt
Changes: smoothed normals, recolored clothing, reshaped farmer hat, retargeted hand pose, added controller/sprayer, reused Walk and Idle_Neutral clips.

## Xe minh họa

Ferrari 458 — vicent091036.
License: Creative Commons Attribution 4.0 International (CC BY 4.0).
License text: https://creativecommons.org/licenses/by/4.0/
Original model: https://sketchfab.com/models/57bf6cc56931426e87494f554df1dab6
Distribution: https://github.com/mrdoob/three.js/blob/dev/examples/models/gltf/ferrari.glb
Author credit: https://threejs.org/examples/webgl_materials_car.html
Distribution license audit: https://github.com/mrdoob/three.js/issues/23089
Changes: recolored body, glass, tires and interior; changed lighting, scale and placement in a generic manufacturing illustration.
This model is not a VinFast vehicle and does not reconstruct the cited VinFast production line. No endorsement is implied.

## Vật liệu ruộng

Brown Mud 02 — Poly Haven.
Asset: https://polyhaven.com/a/brown_mud_02
License: CC0, https://polyhaven.com/license
1K diffuse, OpenGL normal and roughness textures; repeated and tinted on original terrain geometry.

## Bộ giải mã

Draco decoder — Google / Draco Authors, Apache License 2.0.
Source: https://github.com/google/draco
License: /draco/LICENSE
Bundled decoder files distributed with three.js.

Drone, rice geometry, machines, red thread and other procedural objects are original project geometry. The drone illustrates an agricultural quadrotor; it is not an identified machine used by HTX Thâm Triều. Geographic and editorial sources are listed in the website's source drawer.

## Âm thanh History Atlas

Tám ambience được tổng hợp nguyên bản tại chỗ, không dùng sample hoặc bản thu bên ngoài. Nguồn tạo và quyền sử dụng trong dự án: [History Atlas audio](/audio/LICENSES.md). Đây là âm thanh minh họa, không phải bản thu tư liệu lịch sử.

## Nền panorama History Atlas

Panorama và chi tiết bánh đà được tạo riêng cho dự án bằng imagegen, từ bốn minh họa ghép mềm thành một ảnh nền liên tục. Đây là hình tái dựng minh họa, không phải ảnh tư liệu lịch sử. Không dùng pixel từ các ảnh bảo tàng/infographic tham khảo. Bản desktop: `/history/atlas-panorama-8192.avif` và `/history/atlas-panorama-4096.webp`; bản dọc: `/history/atlas-panorama-mobile-1024x8192.webp`; chi tiết chuyển cảnh: `/history/atlas-machine-anchor.webp`. Các cutout lịch sử và ảnh xưởng máy giữ nguồn tạo đã ghi trong dự án. Âm nền là tổng hợp nguyên bản; không có sample, lời hát hoặc bản nhạc bên ngoài.

## Sprite mini game Hành trình sản xuất

Kenney: **Platformer Characters 1**, **Robot Pack**, **New Platformer Pack**, CC0 (Creative Commons Zero).

- Creator: https://kenney.nl/assets/platformer-characters ; https://kenney.nl/assets/robot-pack ; https://kenney.nl/assets/new-platformer-pack
- GitHub distribution: https://github.com/series-ai/jam-ready-assets, revision `782e3a09566b4bb3d98fe2ed07f5a8545e6fcfd4`.
- 49 PNG sprites are packaged locally in `/minigame/sprites/`, with the three original `LICENSE-*.txt` notices and upstream paths in `/minigame/sprites/SOURCE.json`.
- This earlier sprite set is retained as a legacy asset; the active pixel runner uses the assets below.

### Pixel runner — 2026-10-04

- [Pixel Frog — Pixel Adventure 1](https://pixelfrog-assets.itch.io/pixel-adventure-1), CC0 1.0: Virtual Guy animated sprite sheets, saw, spikes, crate, Rock Head. Runtime crops supplied frames and adds an original red scarf/attachments.
- [Kenney — Pixel Platformer](https://kenney.nl/assets/pixel-platformer), [Farm Expansion](https://kenney.nl/assets/pixel-platformer-farm-expansion), [Industrial Expansion](https://kenney.nl/assets/pixel-platformer-industrial-expansion), CC0: terrain, crops, machinery and hazard sprites.
- [Kenney — Impact Sounds](https://kenney.nl/assets/impact-sounds), [Interface Sounds](https://kenney.nl/assets/interface-sounds), CC0: ten effects. Original quiet music and fallback tones are synthesized locally.
- Five landscapes are original imagegen game illustrations created for this project, with retained prompts and source PNGs. These are generated scenery, not documentary images.
- Fifteen matching background decoration cutouts are also original imagegen illustrations, with native transparent atlas and prompts retained. The locally served scenery atlas supplies irrigation/harvest, mill/steel infrastructure, city planters/utilities and renewable garden details.
- Assets are served locally from `/minigame/runner/`; original Kenney licences, Pixel Frog rights evidence, source archive hashes and selected file hashes are bundled in `licenses/`, `manifest.json`, and `audio/manifest.json`.

## Cú Mạch — bộ ảnh cho hướng dẫn

Bảy tư thế Cú Mạch đeo kính và khăn đỏ được tạo riêng cho dự án bằng công cụ imagegen ngày03/10/2026, từ concept và ảnh cú gốc do dự án tạo. Không dùng pixel từ Pinterest, ảnh bảo tàng tham khảo hoặc stock bên ngoài. Đây là minh họa tạo bằng AI, không phải ảnh tư liệu hay nhân vật của bên thứ ba.

Các ảnh nền trong được mã hóa WebP, giữ bản PNG gốc và prompt trong hồ sơ dự án. Bộ ảnh gồm chào/nghỉ, chỉ trái, chỉ phải, xem kỹ, mời thử, xác nhận, tạm biệt và bản nhỏ cho nút gọi hướng dẫn. Danh sách file và checksum: [Cú Mạch assets](/guide/owl-assets.json). Bộ ảnh được dùng trong hướng dẫn Cú Mạch của website (ảnh tĩnh; chuyển động chỉ là crossfade/nhích/gật cả ảnh).

### Driver.js

Hướng dẫn dùng [Driver.js](https://driverjs.com) 1.8.0 (© Kamran Ahmed, giấy phép MIT, `nilbuild/driver.js`) làm bộ spotlight/popover. Bản phân phối kèm thông báo MIT được sao chép nguyên văn vào `/vendor/driver/1.8.0/license` khi build; không tải từ CDN.

## Scene 07 — Ba đời sống / Một hệ thống

Ba chân dung là nhân vật tổng hợp, được tạo bằng image_gen cho dự án; không phải ảnh tư liệu hoặc người thật được định danh. Value Flow và các vật thể tương tác là hình học gốc của dự án; âm thanh được tổng hợp bằng Tone.js, không dùng bản ghi hoặc nhạc có sẵn. Bản gốc, prompt và mã kiểm tra lưu trong .studio/scene07; hồ sơ sử dụng tại ASSET_LICENSES.md. Ảnh tham khảo do người dùng cung cấp không được đưa vào tài sản xuất bản.
