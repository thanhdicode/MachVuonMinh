# Cú Mạch · báo cáo kiểm chứng hướng dẫn Driver.js 1.8.0

Phạm vi: toàn bộ hướng dẫn Cú Mạch (8 phần, 70 bước theo `docs/superpowers/specs/2026-10-03-owl-guide-copy.json`), lời chào lần đầu, gọi lại/tiếp tục/tiến độ, luyện tập trên UI thật, dialog, quyền cuộn và hướng dẫn game trong iframe. Mã được kiểm là working tree hiện tại (chưa commit, chưa push). Số liệu do các script trong `scripts/owl-guide-qa/` ghi; chạy lại bằng README.

Môi trường kiểm chứng: Chrome 154 headless qua puppeteer-core, kết xuất WebGL bằng SwiftShader (phần mềm), Vite dev server. **Không có GPU thật, không có thiết bị thật, không có Firefox/Safari.** Vì vậy mọi nhận định về FPS, cảm ứng thật, bfcache thật và trình duyệt khác đều là *chưa kiểm chứng*.

## 1. Đã chạy gì

| Kiểm chứng | Phạm vi | Kết quả |
|---|---|---|
| Unit test (`npm test`) | {{TESTS}} test, gồm test mới cho tiến độ/migration, lease cuộn, controller, targets, vendor Driver, giao thức và hành vi game | {{TESTS_RESULT}} |
| Kiểu và build | `tsc -b`, `npm run build` | {{BUILD_RESULT}} |
| Walker từng bước (Chrome thật) | 7 phần × 1440×900, 1366×768, 360×640 cảm ứng, 390×844 cảm ứng; thêm 899/900 và 1024×768 (qua mốc bố cục Atlas), 768×1024 cảm ứng, 1920×1080, giảm chuyển động, zoom trình duyệt 200% | {{MATRIX_RESULT}} |
| Game trong iframe (`game-walk.mjs`) | G01–G10 thật: vào từ menu, vào từ F04, 390×844 cảm ứng, giảm chuyển động; tập nhảy/cúi thật bằng phím hoặc nút cảm ứng | {{GAME_RESULT}} |
| Vòng đời (`scenarios/01–05`) | lần đầu, hạn sẵn sàng 5 giây, người dùng quay lại/lưu trữ hỏng/bị chặn, nhấn dồn và thoát từ mọi lớp, các kiểu hỏng (chunk Driver chậm/bị chặn, tab ẩn, mất target, pagehide) | {{LIFECYCLE_RESULT}} |
| Game: F04, Skip, Esc, đóng giữa chừng (`scenarios/09`) | từ chối game ở F04, Skip trong game giữ dialog, Esc hai lần, đóng khi hướng dẫn chạy, Skip trước khi iframe sẵn sàng | {{S09_RESULT}} |
| Kéo sợi đỏ bằng con trỏ (`pointer-thread.mjs`) | I02 bằng chuột (1440×900) và cảm ứng (390×844) | {{POINTER_RESULT}} |
| Truy cập (`a11y.mjs`) | vai trò/tên, focus, Tab, Esc theo lớp, trả focus, tương phản tính thật, mục tiêu cảm ứng, giảm chuyển động; 1440×900 và 360×640 cảm ứng | {{A11Y_RESULT}} |
| Qua mốc 899↔900 khi bước đang hiện (`resize.mjs`) | H02 và H03 | {{RESIZE_RESULT}} |
| Trạng thái ngoài walker (`states.mjs`) | lời chào, cue I02 trên sợi, thông báo tạm dừng, menu cú, thông báo bỏ qua | {{STATES_RESULT}} |

Độ phủ theo từng ID: `COVERAGE.md` (sinh bằng `node scripts/owl-guide-qa/coverage.mjs`). Hai bước không có walker (lời chào I01 và kéo sợi I02) dựa vào `manual-evidence.json` và `lifecycle/`.

## 2. Lỗi tìm thấy khi kiểm chứng và đã sửa

Mỗi mục có test hoặc lượt chạy trình duyệt xác nhận sau khi sửa.

**Luồng và tiến độ**
- Bàn giao sang game từ tuyến chỉ xem lại một phần giữ route cũ nên "Tiếp tục" trỏ vào bước không thuộc tuyến. Nay route chuyển thành `game` (hoặc giữ `full`). Có test; mutation làm test đỏ.
- Sau khi đổi cảnh hoặc mất target, các nút của cue (Quay lại bước này, Thử lại, Bỏ qua bước này, Đọc bằng chữ) không làm gì. Đã sửa; test cho cả bốn.
- Khởi động lại từ cue tạm dừng làm mất mốc khôi phục demo ("Khôi phục" trả về trạng thái đã bị đổi). Nay khôi phục mốc cũ trước khi chụp mốc mới.
- Bỏ qua một bước bị redirect bật lại (P09 → P10, I02 → I03), nút Bỏ qua trông như hỏng. Nay `prepare` nhận lý do `skip` và không redirect.
- Bỏ qua trong game không được lưu: chạy xong vẫn ghi "trọn vẹn". Nay lưu từng bước bị bỏ qua và cả phần game; thông báo cuối là "một phần".
- Hướng dẫn game mở từ tuyến chỉ-xem-lại không ghi route đúng; resume lệch (xem trên).

**Dialog, cuộn, focus**
- Người đọc tự bấm ☰ ở bước chỉ ☰ (đường tự nhiên nhất): drawer không thuộc guide, popover bước kế bị che dưới drawer. Nay guide nhận quyền sở hữu và đóng drawer khi đi tiếp.
- Bước I03 mời cuộn/vuốt nhưng khóa cuộn. Nay cho cuộn; cuộn sang cảnh sau tự hoàn thành bước.
- Đổi chiều cao cửa sổ (thanh URL điện thoại) bật lại khóa cuộn trên bước cho cuộn tự do. Nay chỉ chuẩn bị lại bước khi đổi chiều rộng.
- Đóng game xong focus rơi về `<body>`. Nay về nút cú (hoặc phần tử đã mở game).
- Nút Skip của thanh game biến mất mà không chuyển focus. Nay focus vào game hoặc nút đóng.
- Esc khi đang chuẩn bị không làm gì; Skip bấm đúng lúc guide mở dialog để dialog treo; pagehide để lại cue chết; chunk Driver treo giữ mãi "đang chuẩn bị". Các lỗi này do kịch bản vòng đời tìm ra và đã sửa (Esc theo lớp trên cùng, hạn 5 giây rồi hiện hướng dẫn bằng chữ, reset view khi pagehide).

**Game**
- Tập nhảy/cúi bằng bàn phím không hoạt động vì phím bị bỏ qua khi focus nằm trên thẻ hướng dẫn. Nay thẻ cho phím tập đi qua trong lúc tập; nút của thẻ vẫn giữ Space/Enter. Có test và mutation.
- Trạng thái giảm chuyển động của game guide không theo công tắc trong ứng dụng. Nay theo.

**Bố cục (desktop và điện thoại)**
- Mục tiêu nằm dưới nếp gấp trên điện thoại (era 1 của Atlas tĩnh ở H02; khối cài đặt trong drawer ở I05): guide chờ mãi rồi báo thiếu mục tiêu. Nay cuộn tới mục tiêu khi bố cục cho cuộn tự do.
- Cue dính đáy trong drawer che mục tiêu trên điện thoại thấp. Nay cuộn drawer vừa đủ.
- Cue luyện tập của Buồng chính sách trên desktop che ba token vì thuật toán chọn góc tính cả hộp proxy của ring (cỡ cảnh). Nay bỏ qua mục tiêu cỡ cảnh khi chọn góc.
- Nút "Bỏ qua hướng dẫn" bị cắt khi cue có năm nút trên điện thoại. Nay chỉ hàng văn bản co lại; nút luôn đủ.
- Văn bản cue trong dialog zoom/map bị kẹp ba dòng (phần trăm vòng tròn trong lưới). Nay dùng đơn vị viewport.
- Nhãn Driver `×` bằng tiếng Anh ("Close"). Nay "Đóng hướng dẫn".

## 3. Giới hạn đã biết và phần chưa kiểm chứng

- **Không có thiết bị thật, GPU thật, Firefox, Safari**; không đo FPS. Cảm ứng được mô phỏng bằng Chrome (emulation), không phải màn hình cảm ứng thật. bfcache thật chưa thử (chỉ mô phỏng pagehide/pageshow).
- **Buồng chính sách trên điện thoại ≤ 390px:** cue luyện tập dựa trên đỉnh màn hình và che ổ số 1 của vòng. Người dùng phải "Tạm dừng hướng dẫn" hoặc "Bỏ qua bước này" để tự gắn token vào ổ đó; ổ 2 và 3 và các token vẫn dùng được. Chưa có thiết kế gọn hơn.
- **Popover Driver chồng lên mục tiêu cỡ cảnh** (T02, T05, L01, L07, F01, H03/H04 trên điện thoại): mục tiêu quá lớn để tránh hoàn toàn; phần chính vẫn thấy. Driver chỉ đặt trên/dưới, chưa chọn trái/phải theo chỗ trống.
- Chữ gợi ý của cue luyện tập trên điện thoại là 14px (chữ chính 16px).
- Hướng dẫn game mở từ nút cú trong game (không qua tour) là phát lại: không ghi tiến độ.
- Esc trong bước luyện tập chỉ đóng hướng dẫn khi focus nằm trong cue (để không cướp Esc của điều khiển đang tập); người dùng bàn phím tới Bỏ qua bằng Tab qua phần còn lại của trang hoặc dùng menu cú.
- Thông báo kết thúc (xong phần, xong tuyến, đã bỏ qua) không có nút Bỏ qua vì không còn gì để bỏ qua; chúng có "Để sau"/"Đóng".
- Lời chào và I02 được chứng minh bằng kịch bản vòng đời và `pointer-thread.mjs`, không qua walker từng bước.
- Ảnh trong `.studio/qa/owl-guide/` là bằng chứng của đúng lượt chạy; nếu mã đổi, chạy lại.

## 4. Kích thước và hiệu năng

{{SIZES}}

Driver.js và CSS của nó chỉ tải khi hướng dẫn bắt đầu bước đầu tiên dùng Driver (`guideDriver` là chunk riêng; không CDN). Khi guide không chạy, tải thêm là nút cú, bộ điều khiển và catalog (đã cắt các trường `action/observe/completion` khỏi bundle bằng plugin `trimmed-guide-copy`). Không đổi giới hạn DPR, số context WebGL hay vòng vẽ của cảnh 3D; cảnh WebGL dùng proxy DOM chứ không thêm canvas. Chưa đo FPS với GPU thật.

## 5. Chạy lại

Xem mục "Kiểm thử" trong `README.md`: `npm test`, `scripts/owl-guide-qa/run-matrix.sh`, các kịch bản trong `scenarios/`, rồi `node scripts/owl-guide-qa/coverage.mjs`.
