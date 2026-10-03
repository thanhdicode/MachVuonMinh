# Cú Mạch và game — kiểm chứng 2026-10-04

Đã lấy bản agent `0b095d1`, sửa lỗi build, hoàn thiện luồng Driver.js và đổi nền game thành năm panorama gốc theo hướng giấy–mực–sợi đỏ. Copy chuẩn giữ đủ 8 phần / 70 ID. Báo cáo này thay thế các placeholder và giới hạn đã cũ trong bản agent.

Môi trường: Windows, Chrome 147.0.7727.102 headless / Puppeteer, WebGL SwiftShader, Vite production preview. Các lượt đời đầu dùng bản production chụp cố định; kiểm tra hồi quy cuối dùng build hiện tại. Cảm ứng và zoom là mô phỏng trình duyệt; không có phép đo FPS trên thiết bị thật hay kiểm tra Firefox/Safari.

| Kiểm tra | Kết quả |
| --- | --- |
| `npm test` | 142/142, không bỏ qua test |
| `npm run build` | TypeScript và Vite đạt, 666 modules |
| Độ phủ catalog | 68 ID qua walker; I01/I02 qua kịch bản lời chào, bàn phím và kéo thật; đủ 70 ID |
| 7 phần trên desktop 1440×900 và mobile 360×640 | Không có cờ bố cục, lỗi walker hay console trong các lượt `release-*` |
| Game G01–G10 | Đạt trên mobile 390×844 và desktop; đóng bàn giao từ Finale trả về đúng vị trí người gọi |
| Lần đầu / readiness / quay lại / nhấn dồn và thoát / failure modes | 23/23, 15/15, 57/57, 103/103, 30/30 |
| Game F04, Skip, Esc, đóng giữa hướng dẫn và Skip sớm | 26/26 |
| Phát lại từ cú trong game, Esc theo lớp và trả về Atlas sau relayout | 14/14; era 3 vẫn là era 3 sau desktop→mobile |
| Kéo sợi đỏ cảm ứng rồi xác nhận hoàn tất | 9/9 |
| Truy cập mobile / đổi 899↔900 / trạng thái zoom 200% | 65/65; 69/69; không cờ bố cục và không lỗi console |
| Game mới: start, chạy, pause, thanh điểm và năm panorama | Desktop/mobile đạt; canvas opaque, panel nằm trong màn hình, thanh điểm không chồng tên chặng, hình pause ổn định, không lỗi console/request |

Độ phủ cụ thể: [COVERAGE.md](COVERAGE.md), sinh bằng `node scripts/owl-guide-qa/coverage.mjs --prefix release-`. Các JSON ngoài nhóm phát hành giữ lịch sử chẩn đoán, có thể ghi lỗi trước khi sửa; chúng không chứng minh bản cuối. Ảnh chụp ở cùng thư mục lượt chạy và được Git bỏ qua.

Các sửa chính:

- Thay import `?minraw` không có plugin bằng `?raw`; so copy chuẩn với line ending LF/CRLF tương đương. QA chạy được trên Windows và tự tìm Chrome/Edge.
- Dialog chỉ đóng khi guide sở hữu; teardown/pagehide nhả lease đồng bộ, hủy tải chậm, không bật lại guide sau khi Skip. Giữ mốc phục hồi demo và vị trí người gọi; game bàn giao không ghi đè vị trí bằng scroll cũ.
- Esc theo đúng lớp, kể cả luyện tập; menu Tùy chọn trên điện thoại giúp giữ nút Skip và mục tiêu thật trong màn hình. Cue Lab/Policy, proxy 3D, caption lịch sử và bố cục zoom được chỉnh.
- Cú trong game tự mở/phát lại có lưu tiến độ và giữ bước đã hoàn tất. Skip chỉ kết thúc guide; dialog và game vẫn chơi được.
- Năm nền gốc có palette riêng và hai lớp parallax. Ba lớp Canvas được cache, không dựng lại hàng loạt hình mỗi frame; HUD cập nhật tối đa mỗi 100ms khi chạy, còn thao tác người chơi cập nhật ngay. Ready/pause/quiz không vẽ lại liên tục; reduced motion cố định parallax. Nút cú trên mobile giữ kích thước 44px và tên truy cập, bỏ chữ trang trí để thanh điểm không chồng lên tên chặng.

Build gzip: chunk Driver JS 8.31kB + CSS 2.15kB; MiniGame JS 50.44kB; main JS 225.47kB; WorldCanvas JS 307.12kB. Driver vẫn tải lazy từ bản npm 1.8.0 ghim, không CDN. Không có plugin `trimmed-guide-copy`; không tuyên bố tổng chi phí guide đã đạt ngưỡng 45kB. Cảnh 3D giữ một WebGL context và giới hạn DPR hiện có. Cảnh báo chunk lớn có sẵn vẫn còn; chưa đo FPS thiết bị thật. Chiều mobile→desktop có unit kiểm logic vị trí nhưng chưa chạy trình duyệt trong lượt chốt gấp này.

Nền mới là code gốc, không tải art bên ngoài; ghi nhận tại [ASSET-REGISTRY.md](../../ASSET-REGISTRY.md). Hướng tối ưu tham khảo [MDN Canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas): cache offscreen và canvas opaque.
