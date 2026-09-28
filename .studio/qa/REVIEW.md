# Audit bản dựng lại — 28/09/2026

Đối chiếu `07_MASTER_PROMPT_V2.md`, ảnh người dùng gửi và bộ ảnh thực chạy trong Chromium. Preview production: http://127.0.0.1:4173/.

## Những lỗi đã loại bỏ

- Vòng torus bóng, thô: thay bằng vành cơ khí có tiết diện bậc, lòng sâu, rãnh đồng tâm, vít và vạch chia; thu nhỏ sợi đỏ và giảm nhiễu nền.
- Cảnh cuộn bị đứng sau hot reload: các module singleton của timeline được tải lại toàn trang khi thay đổi. Thêm CSS Lenis, đồng bộ ticker, cập nhật kích thước sau mở khóa. Camera có chuyển động ngay trong đoạn đọc.
- Menu chuyển chương thiếu ổn định: đóng dialog trước khi cuộn, trả focus bằng `preventScroll`, đo lại vùng cuộn. Cảnh cuối giữ nguyên độ hiển thị ở cuối tài liệu.
- Canvas chặn thao tác: chuyển tương tác sang DOM, cho phép vuốt dọc tự nhiên. Token cho phép vuốt ngang thanh lựa chọn và kéo dọc vào socket.
- Bản đồ phác tay, thiếu hải đảo: thay bằng đường bờ Natural Earth; bổ sung Hoàng Sa và Trường Sa với nhãn, điểm đảo có dữ liệu, Phú Quốc, Côn Đảo. Lọc Trường Sa theo feature riêng để không lấy nhầm đảo ven Philippines. Nguồn và quyền sử dụng ghi tại `../ASSET-REGISTRY.md`.
- Mobile: đưa vòng mở đầu vào giữa khung hình, tách chữ khỏi vật thể, tăng nhãn quần đảo và vùng chạm slider; điều chỉnh DPR khi đổi kích thước.
- Bỏ giả lập 1440 px khỏi tab người dùng sau QA. Tab trở lại kích thước cửa sổ thực, không còn vùng xám thừa bên phải.

## Phản biện từng cảnh ở 1440 × 900

| Cảnh | Lỗi ở vòng kiểm tra trước | Kết quả kiểm tra cuối |
|---|---|---|
| 00 | Vật liệu giống nhựa; đầu dây cụt; mobile cắt nửa vật thể | Vành có chiều sâu, sợi đỏ đi qua lòng vòng; tiêu đề hai dòng; kéo/Enter hoạt động |
| 01 | Đất giống các tấm gỗ; hai sợi đỏ chồng nhau | Địa hình rãnh gồ ghề, thân cày cong, một đường cày đỏ; không dùng khung nội dung |
| 02 | Mặt bánh răng quá phẳng; rãnh bị chìm dưới bề mặt | Rãnh nổi đúng mặt, hub xuyên sâu và bánh phụ; camera xuyên qua cụm máy |
| 03 | Cần kiểm chứng slider thực sự thay đổi thế giới | Thay góc khớp, nhịp cánh tay và vai trò con người; có phản hồi khi giảm chuyển động |
| 04 | Vòng dây trang trí lấn trường dữ liệu | Giữ các spline và hạt dữ liệu có nhãn; bỏ vòng dây thừa |
| 05 | Lồng vuông cứng và vùng chạm mobile nhỏ | Các đai cong bao lõi; preset làm biến dạng/tái lắp; điều khiển nằm hai mép |
| 06 | Địa lý sai, thiếu quần đảo, chữ mobile nhỏ | Atlas có dữ liệu, đủ hai quần đảo; một bằng chứng mỗi lần; drawer nguồn đầy đủ |
| 07 | Cần kiểm chứng thao tác vật lý và phản hồi | Kéo thật vào socket, chạm để gắn/tháo; ba lựa chọn tạo thế mạnh, phần thiếu và đánh đổi |
| 08 | Vòng kết bằng khối hộp; nội dung mất ở cuối trang | Đai cong mở tiếp tục chuyển động; luận điểm và nút quay lại vẫn hiện ở cuối trang |

Các ảnh cuối giữ vật thể hoặc trường dữ liệu làm trọng tâm; không có lưới thẻ chương, thanh điều hướng trái hay toolbar cố định. Cảnh sáng/tối luân phiên; các chi tiết dài nằm trong drawer. Bộ ảnh là bằng chứng kiểm tra bố cục, không thay cho đánh giá thẩm mỹ của người dùng.

## Kiểm chứng chạy được

- `node tests/model.test.mjs`: khoảng cách LLSX/QHSX hai chiều; socket không trùng, không nhận chỉ số lỗi; phản hồi chính sách.
- `scripts/browser-qa.mjs`: kéo sợi mở đầu thật, Enter, bánh xe chuột qua 9 cảnh, menu, Lab mâu thuẫn/tái cấu trúc, nguồn/Escape/trả focus, kéo token, 390×844, 1920×1080, vuốt touch, giảm chuyển động và mất WebGL context.
- `rebuild/report.json`: production, không có console error. Mẫu 90 khung hình trên máy này: trung vị 5,6 ms; P95 5,7 ms. Đây không phải cam kết hiệu năng trên điện thoại thật hoặc GPU tích hợp khác.
- `rebuild/map-report.json`: kiểm lại địa lý và ảnh map desktop/mobile sau lần lọc đảo cuối.
- `rebuild/motion-report.json`: slider bàn phím 0→100 đổi tư thế robot ngay khi giảm chuyển động.
- `npm run build`: thành công. WorldCanvas tải lười, khoảng 271 KB gzip; Vite vẫn cảnh báo chunk JavaScript trên 500 KB trước gzip. Không tăng ngưỡng để che cảnh báo.

Ảnh: `rebuild/contact-desktop.jpg`, `rebuild/contact-mobile.jpg`; từng ảnh gốc PNG nằm cùng thư mục. Không thêm runtime dependency, không triển khai lên dịch vụ ngoài.
