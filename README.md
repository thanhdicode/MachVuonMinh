# Mạch Vươn Mình

Triển lãm tương tác về lực lượng sản xuất mới và yêu cầu thích ứng của quan hệ sản xuất ở Việt Nam. Xây bằng React, TypeScript, Vite và một cảnh Three.js/WebGL.

## Hướng dẫn Cú Mạch (Driver.js 1.8.0)

Cú Mạch dẫn người mới qua toàn bộ triển lãm: 8 phần, **70 bước**, theo thứ tự `I01–I06 → T01 → H01–H08 → T02–T05 → L01–L15 → V01–V11 → P01–P11 → F01–F04 → G01–G10`. Lời dẫn chuẩn nằm ở `docs/superpowers/specs/2026-10-03-owl-guide-copy.json`; bản chạy là `src/onboarding/guideCopy.json` (test so khớp nội dung sau khi chuẩn hóa LF/CRLF, vì `docs/` không được upload lên Vercel). Driver.js được pin đúng `1.8.0`; không dùng wrapper React, CDN hay thư viện animation khác.

### Chạy, gọi và ẩn cú

- `npm ci`, rồi `npm run dev` (hoặc `npm run build`, `npm test`). Các script `predev`, `prebuild`, `pretest` chạy `scripts/copy-driver-assets.mjs`: kiểm bản pin `1.8.0` (MIT) và chép `driver.js.iife.js`, `driver.css`, `license` vào `public/vendor/driver/1.8.0/` kèm `manifest.json` (thư mục sinh ra, đã gitignore). Hướng dẫn trong game chạy Driver riêng trong iframe từ các file này.
- **Lần đầu** (chưa có tiến độ): khi màn kéo sợi đỏ và font sẵn sàng (hạn tổng 5 giây) cú chào một lần với ba lựa chọn **Dẫn tôi khám phá**, **Hướng dẫn nhanh** (chỉ `I01–I06`), **Tự khám phá**, cùng nút chữ **Bỏ qua hướng dẫn**. Tự khám phá và Bỏ qua lưu `dismissed`; reload không chào lại. Không có bước nào tự chạy theo timer.
- **Gọi lại**: nút cú góc dưới phải (tên truy cập **Mở hướng dẫn của Cú Mạch**) hoặc Mục lục ☰ → **Cú Mạch / Hướng dẫn & xem lại**. Menu có: Tiếp tục bước dang dở, Hướng dẫn phần đang xem, Xem lại từ đầu, danh sách 8 phần, **Ẩn cú trong phiên này**. Trong game có nút **Cú Mạch / Cách chơi** ngay trong iframe.
- **Thoát**: **Bỏ qua hướng dẫn** (nút chữ, không xác nhận; lưu `skipped`, có thể tiếp tục), **Tạm dừng hướng dẫn**, ×/Esc (giữ `in-progress` để tiếp tục đúng ID), **Bỏ qua bước này** / **Bỏ qua phần này**. Bỏ qua không bao giờ ghi hoàn thành.
- Lab và Buồng chính sách kết thúc với **Giữ các thiết lập vừa thử** hoặc **Khôi phục thiết lập trước hướng dẫn** (mặc định khôi phục; âm thanh, chuyển động và trạng thái mở khóa không bao giờ bị hoàn tác).
- **Reset tiến độ khi phát triển**: `localStorage.removeItem('mach-vuon-minh:guide:v2')` (và `…:v1` nếu có) rồi tải lại. Trạng thái nằm trong key `mach-vuon-minh:guide:v2` (`schemaVersion: 2`); lưu ID bước, không lưu số thứ tự hay hình học. Storage bị chặn/hỏng vẫn chạy được trong phiên.

### Cấu trúc `src/onboarding/`

| Phần | File |
|---|---|
| Hợp đồng, ID, tiến độ, phiên | `guideTypes.ts`, `guideIds.ts`, `guideProgress.ts` (schema v2 + migration v1), `guideSession.ts` (scroll lease, run token, snapshot demo) |
| Catalog 70 bước | `guideCatalog.ts` + `guideCopy.json`; kiểm đủ 70 ID duy nhất khi khởi tạo |
| Điều phối | `guideController.ts` (máy trạng thái: preparing/presenting/practice/modal/handoff/paused), `guideTargets.ts` (chờ target thật sự hiện, ổn định 2 frame), `guideAdapters.ts` (recipe điều hướng/thực hành từng bước) |
| Giao diện | `GuideProvider.tsx`, `OwlMascot.tsx`, `GuideDock.tsx`, `GuideWelcome.tsx`, `GuideCue.tsx`, `GuidePopover.tsx`, `guide.css`; `guideDriver.ts` + `guideDriver.css` (tải lười cùng Driver) |
| Game trong iframe | `game-guide.js`, `gameGuideProtocol.ts`, `gameGuideLink.ts`, `guideGame.css`; phía cha ở `src/minigame/` |

Mục tiêu (`data-guide`) là thuộc tính có nghĩa gắn vào UI thật; cảnh WebGL dùng proxy DOM (`.guide-proxy*`) đúng vùng vật thể, chỉ gắn khi đúng cảnh. Navigation dùng `WorldTimeline`/Lenis hiện có; khóa cuộn có chủ sở hữu (`tour`, `game`, `dialog`) nên đóng hướng dẫn không mở khóa của game hoặc dialog.

### Kiểm thử

- `npm test` (`node --test "tests/*.test.mjs"`): 142 test, gồm các test gốc và hồi quy cho tiến độ/migration, lease cuộn, huỷ bất đồng bộ, quyền sở hữu dialog, pagehide, khôi phục vị trí qua bố cục Atlas, phục hồi demo, game replay, catalog, vendor Driver, giao thức iframe và cache nền game.
- Trình duyệt thật: `scripts/owl-guide-qa/` dùng puppeteer-core và Chrome, **không** là phụ thuộc của dự án. Cài ngoài repo rồi trỏ biến môi trường, mở `npm run dev` ở cửa sổ khác:

  ```sh
  npm i --prefix /tmp/qa-tools puppeteer-core
  export PUPPETEER_CORE=/tmp/qa-tools/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js CHROME_PATH=/đường/dẫn/chrome
  node scripts/owl-guide-qa/matrix-walk.mjs --module lab --width 360 --height 640 --touch   # một lượt: đi hết các bước của phần Lab
  scripts/owl-guide-qa/run-matrix.sh 3                                                      # cả ma trận (7 phần × 4 cỡ màn hình, giảm chuyển động, zoom 200%, game, a11y)
  node scripts/owl-guide-qa/coverage.mjs                                                    # gộp kết quả thành COVERAGE.md
  ```

  Trên Windows, runner tự tìm Chrome/Edge và nhận cả đường dẫn Windows lẫn file URL. Có thể cài công cụ QA trong thư mục bị Git bỏ qua:

  ```powershell
  npm install --prefix node_modules/.owl-guide-qa-tools puppeteer-core
  npm run build
  # Chạy npm run preview ở terminal riêng.
  $env:QA_URL = 'http://127.0.0.1:4173/'
  node scripts/owl-guide-qa/matrix-walk.mjs --module lab --width 360 --height 640 --touch --tag release-lab-mobile
  node scripts/owl-guide-qa/regressions.mjs
  node scripts/owl-guide-qa/coverage.mjs --prefix release-
  ```

  Walker trả mã lỗi khác 0 khi phát hiện lỗi; `--prefix release-` chỉ tổng hợp các lượt kiểm của bản hoàn thiện, giữ lịch sử chẩn đoán riêng.

  Mỗi walker thao tác thật trên từng bước, ghi `result.json` và ảnh vào `.studio/qa/owl-guide/`; `scenarios/` (01–05, 09), `a11y.mjs`, `resize.mjs`, `states.mjs`, `pointer-thread.mjs`, `game-walk.mjs` kiểm vòng đời, truy cập, qua mốc 899/900, kéo sợi bằng con trỏ và game. Kết quả, lỗi đã sửa và phần chưa kiểm chứng: `.studio/qa/owl-guide/REVIEW.md`; độ phủ 70 ID: `.studio/qa/owl-guide/COVERAGE.md`.

## Mini game cuối bài thuyết trình

Tại cảnh **08 — Kết luận**, chọn **CHƠI MINIGAME** để mở “Hành trình sản xuất”. Nút **QUAY LẠI BÀI THUYẾT TRÌNH** hoặc phím **Esc** đưa người chơi về đúng vị trí đã mở game.

- Chạy, nhảy và cúi theo cơ chế Dino; có 3 trái tim cho toàn bộ lượt chơi. Tốc độ khởi đầu 320 đơn vị/giây, tăng 10 đơn vị/giây sau mỗi giây chạy và thêm 40 mỗi chặng, tối đa 760 (2,38×).
- 5 chặng thay đổi nhân vật, khung cảnh và màu sắc: nông nghiệp, cơ giới hóa, tự động hóa, kinh tế số, kỷ nguyên vươn mình. Đây là các chặng minh họa sự phát triển của lực lượng sản xuất, không phải năm phương thức sản xuất.
- Toàn bộ sân chơi, câu hỏi, đáp án và nút điều khiển nằm trong một màn hình cố định, không cuộn. Câu hỏi va chạm hiện thành popup ngay trên sân chơi; câu hỏi boss nằm cạnh sân chơi trên máy tính, bên dưới trên điện thoại.
- Sân chạy chiếm toàn bộ chiều ngang; khung giới thiệu và danh sách chặng bên phải đã bỏ. Tên chặng, tiến độ, điểm và trái tim nằm trên thanh trạng thái.
- 77 câu hỏi ôn tập: 18 / 15 / 16 / 15 / 13 câu theo 5 chặng. Bộ câu hỏi gồm 60 câu ban đầu và 17 câu từ `bo cau hoi.docx`; giữ giai đoạn, đáp án tô vàng và lời giải của tài liệu. Va chạm dừng nhân vật, vật cản, điểm và tốc độ để mở popup câu hỏi cùng 4 đáp án. Trả lời đúng giữ tim, sai mất một tim; đọc giải thích rồi bấm **TIẾP TỤC CHẠY**. Khi tiếp tục, vật cản được dọn và người chơi có 1 giây miễn va chạm. Boss vẫn chuyển động trong câu hỏi đấu boss.
- Mỗi chặng có một boss 3 HP. Mỗi câu đúng đánh boss mất 1 HP; mỗi câu sai khiến boss phản công, người chơi mất 1 tim. Phải hạ boss mới mở chặng kế tiếp.
- Quãng đường từng chặng: 180 / 230 / 280 / 330 / 380 điểm; mốc cộng dồn: 180 / 410 / 690 / 1020 / 1400.
- Vật cản cao, vật cản dài, cặp vật cản, tổ hợp cúi–nhảy / nhảy–cúi, drone đổi độ cao, gai báo trước và cưa quay. Giữ nhảy để bay xa, thả để nhảy thấp, cúi khi trên không để hạ nhanh. Khoảng cách tổ hợp có nhịp hồi phục và được kiểm tra khả năng vượt qua ở nhiều tốc độ.
- Hỗ trợ bàn phím và nút cảm ứng. Có nút tạm dừng chủ động, chơi lại và thông báo kết quả.
- Hiệu ứng: bụi khi nhảy/tiếp đất, co nhẹ nhân vật khi chạm đất, vệt gió theo tốc độ, rung/chớp đỏ khi va chạm, đáp án sáng xanh hoặc rung khi sai, trái tim vỡ khi mất máu. Đòn boss có đạn, tia va chạm, số sát thương và boss tan thành mảnh sáng khi bị hạ. Qua chặng có cổng đỏ trong 1,35 giây; nhân vật và nền đổi ở giữa cổng, điểm và vật cản dừng đến khi qua cổng. Hoàn thành có pháo giấy; chế độ giảm chuyển động bỏ các hiệu ứng phụ.

Mã tích hợp nằm trong `src/minigame/`: `MiniGame.tsx` quản lý màn chơi và quay lại, `gameDocument.ts` đóng gói tài nguyên, `assets/` chứa giao diện, cơ chế và câu hỏi. Game được tải khi mở, chạy bằng Canvas 2D; phần 3D và cuộn thuyết trình tạm dừng khi game mở. Tài nguyên và font được đóng gói tại máy, không cần backend hoặc CDN riêng.

Câu hỏi nhập từ Word nằm trong `assets/document-questions.js`, dùng chung cho va chạm và boss. Có thể nhập lại bằng `python scripts/import-minigame-questions.py "../bo cau hoi.docx"`. Script nhận đáp án bằng định dạng tô vàng, kiểm tra đủ 4 lựa chọn và ghi nguồn của từng câu. Kiểm tra dữ liệu/đảo đáp án: `node tests/minigame-questions.test.mjs`. Một lỗi gõ trong lời giải giai đoạn 5 được sửa từ “động đất” thành “năng động”; đáp án giữ nguyên.

49 sprite PNG Kenney (nhân vật, robot, boss, vật cản, nền và địa hình) được tải từ [series-ai/jam-ready-assets](https://github.com/series-ai/jam-ready-assets) ở một revision cố định. Hình và giấy phép CC0 gốc nằm trong `public/minigame/sprites/`; nguồn chi tiết trong `SOURCE.json`. `scripts/fetch-minigame-assets.mjs` có thể tải lại và kiểm tra SHA-256 của GitHub LFS. Nhân vật có animation đi/nhảy/cúi; game dùng sprite ảnh thay cho hình nhân vật vẽ từ các hình khối.

## Chạy tại máy

```sh
npm ci
npm run dev
```

Kiểm tra bản xuất bản:

```sh
node tests/model.test.mjs
node tests/surface.test.mjs
node tests/drone.test.mjs
node tests/character.test.mjs
node tests/minigame.test.mjs
npm run build
npm run preview
```

## Triển khai Vercel

[Bản Production](https://mach-vuon-minh.vercel.app/) đã liên kết với [GitHub repository](https://github.com/thanhdicode/MachVuonMinh). Mỗi lần `git push origin main`, Vercel tự build và cập nhật bản Production; các nhánh khác có bản Preview. `vercel.json` cố định Vite, `npm ci`, `npm run build` và thư mục `dist`. Dự án không cần biến môi trường, GitHub Actions hay deployment token trong repo.

Thiết kế và nội dung: đọc `00_NORTH_STAR.md` đến `07_MASTER_PROMPT_V2.md` theo thứ tự. Nguồn dữ kiện, giới hạn diễn giải và quyền sử dụng tài sản được ghi ở `.studio/ASSET-REGISTRY.md` và `.studio/qa/refinement/REVIEW.md`. Ảnh QA cục bộ không được đưa lên GitHub để repo gọn; mã nguồn và tài sản chạy web vẫn được commit.
