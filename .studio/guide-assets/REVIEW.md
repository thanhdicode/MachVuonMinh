# Cú Mạch — rà trước push main, 03/10/2026

Phạm vi: kế hoạch, lời dẫn và ảnh sẵn sàng để triển khai. Không có code Driver.js/React onboarding/game guide được thêm trong lượt này. Không gọi việc kiểm gallery là kiểm tour trên website.

## Đã kiểm và sửa

- Nút chữ **Bỏ qua hướng dẫn** luôn khả dụng trong mọi phase, kể cả preparing/cue trong dialog/game. Thêm skip-step/module/guide, phân biệt skipped và completed, schema2/migration/replay. Pause/cancel và ownership của modal/game được ghi cụ thể; late callbacks không được mở lại guide.
- Rà độc lập hai lượt lời dẫn và một lượt nhất quán cuối. Sửa LLSX thành người lao động và tư liệu sản xuất, giải nghĩa các chữ viết tắt; giữ mô phỏng khái niệm và đủ ba mặt QHSX.
- H02/H03 có đường vuốt/cuộn ở bản tĩnh vì arrow group và rail year labels bị ẩn. Dùng nhãn1899–1936, Soi chi tiết, Đối chiếu tư liệu, Xem bản đồ/Phóng to bản đồ. Policy keyboard nói rõ tháo rồi gắn. Quiz hết tim dùng Xem kết quả; boss cuối dùng Hoàn thành hành trình.
- 70 ID duy nhất, 8 biến thể context. Mỗi bước có lời nói, action, observe, completion, pose và motion; nội dung chính tối đa40 từ. Bảng trong kế hoạch đồng bộ đúng70 lời dẫn, kiểm bằng chương trình.
- Rà cuối sửa contract start nhận quick/full/module, invariant completed/skipped disjoint và monotonic, tái tính module sau replay; bổ sung migration cases và ghi rõ quyền push bộ chuẩn bị đã có. Những trường hợp này là yêu cầu test cho implementation, chưa phải runtime test đã chạy.
- 7 ảnh PNG được native imagegen tạo riêng; không cắt sheet concept. 8 WebP gồm7 pose256px và dock80px. Tất cả source có alpha min0/max255; export giữ alpha. Kiểm SHA256 source và delivery khớp manifest.
- 149,732 bytes (146.2KiB) cho tất cả WebP; welcome neutral+dock23,754 bytes (23.2KiB). PNG gốc tổng khoảng13.5MiB giữ ở studio, không vào public bundle. WebP pose khác tải khi cần.
- Gallery trình duyệt1280px: đủ49 img instances tải thành công, không overflow ngang; ảnh40/64/96px trên nền paper/ink cho thấy kính/khăn vẫn nhận ra. Screenshot gốc: `qa-assets-desktop.png`. Gallery Skip đóng ví dụ, focus sang Gọi Cú Mạch lại; replay mở ví dụ và focus về Tiếp tục. Đây chỉ là phép kiểm gallery.
- `node --test tests/*.test.mjs`: 10/10 file qua,0 fail, gồm77 câu hỏi và126 tổ hợp runner. `npm run build`: TypeScript + Vite qua, exit0. Warning chunk size là warning hiện có; guide chưa được import.

## Còn phải kiểm trong lượt tích hợp

Driver overlay/placement/arrow focus thật;70 bước trong các scene; native dialog và iframe handshake; kéo/slider; đủ close path; mobile360×640/390×844,200% chữ, resize899↔900, reduced-motion; Safari/iOS;3–5 người mới; FPS và payload JS/CSS. Không tuyên bố motion đã chạy hoặc tour không có lỗi khi chưa có implementation.

## Xem và tạo lại

`node scripts/preview-owl-guide-assets.mjs` → http://127.0.0.1:5176/.

Encoder: `node scripts/prepare-owl-guide-assets.mjs`. Cần module `sharp`; nếu dùng runtime có sẵn, đặt `MACH_GUIDE_SHARP_MODULE` bằng file URL của module đó trước khi chạy. Chỉ resize contain/mã hóa, không crop, vẽ lại hoặc recolor. Source/prompt: `prompts.json` và `originals/`; thông tin public: `public/guide/owl-assets.json`.
