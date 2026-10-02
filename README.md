# Mạch Vươn Mình

Triển lãm tương tác về lực lượng sản xuất mới và yêu cầu thích ứng của quan hệ sản xuất ở Việt Nam. Xây bằng React, TypeScript, Vite và một cảnh Three.js/WebGL.

## Mini game cuối bài thuyết trình

Tại cảnh **08 — Kết luận**, chọn **CHƠI MINIGAME** để mở “Hành trình sản xuất”. Nút **QUAY LẠI BÀI THUYẾT TRÌNH** hoặc phím **Esc** đưa người chơi về đúng vị trí đã mở game.

- Chạy, nhảy và cúi theo cơ chế Dino; có 3 trái tim cho toàn bộ lượt chơi. Tốc độ khởi đầu 320 đơn vị/giây, tăng 10 đơn vị/giây sau mỗi giây chạy và thêm 40 mỗi chặng, tối đa 760 (2,38×).
- 5 chặng thay đổi nhân vật, khung cảnh và màu sắc: nông nghiệp, cơ giới hóa, tự động hóa, kinh tế số, kỷ nguyên vươn mình. Đây là các chặng minh họa sự phát triển của lực lượng sản xuất, không phải năm phương thức sản xuất.
- Toàn bộ sân chơi, câu hỏi, đáp án và nút điều khiển nằm trong một màn hình cố định, không cuộn. Câu hỏi va chạm hiện thành popup ngay trên sân chơi; câu hỏi boss nằm cạnh sân chơi trên máy tính, bên dưới trên điện thoại.
- 60 câu hỏi ôn tập, 12 câu mỗi chặng. Va chạm dừng nhân vật, vật cản, điểm và tốc độ để mở popup câu hỏi cùng 4 đáp án. Trả lời đúng giữ tim, sai mất một tim; đọc giải thích rồi bấm **TIẾP TỤC CHẠY**. Khi tiếp tục, vật cản được dọn và người chơi có 1 giây miễn va chạm. Boss vẫn chuyển động trong câu hỏi đấu boss.
- Mỗi chặng có một boss 3 HP. Mỗi câu đúng đánh boss mất 1 HP; mỗi câu sai khiến boss phản công, người chơi mất 1 tim. Phải hạ boss mới mở chặng kế tiếp.
- Quãng đường từng chặng: 180 / 230 / 280 / 330 / 380 điểm; mốc cộng dồn: 180 / 410 / 690 / 1020 / 1400.
- Vật cản cao, vật cản dài, cặp vật cản, tổ hợp cúi–nhảy / nhảy–cúi, drone đổi độ cao, gai báo trước và cưa quay. Giữ nhảy để bay xa, thả để nhảy thấp, cúi khi trên không để hạ nhanh. Khoảng cách tổ hợp có nhịp hồi phục và được kiểm tra khả năng vượt qua ở nhiều tốc độ.
- Hỗ trợ bàn phím và nút cảm ứng. Có nút tạm dừng chủ động, chơi lại và thông báo kết quả.

Mã tích hợp nằm trong `src/minigame/`: `MiniGame.tsx` quản lý màn chơi và quay lại, `gameDocument.ts` đóng gói tài nguyên, `assets/` chứa giao diện, cơ chế và câu hỏi. Game được tải khi mở, chạy bằng Canvas 2D; phần 3D và cuộn thuyết trình tạm dừng khi game mở. Tài nguyên và font được đóng gói tại máy, không cần backend hoặc CDN riêng.

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
