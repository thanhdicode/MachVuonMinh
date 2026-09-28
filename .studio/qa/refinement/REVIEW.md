# Audit concept, vật thể và tương tác — 28/09/2026

Bản chạy: http://127.0.0.1:4173/. Đây là lượt tiếp nối sau bản dựng lại; kết quả cũ trong ../REVIEW.md không được coi là đo lại trên bản mới.

## Kịch bản

Điểm yếu trước đây: người xem thấy công nghệ đổi nhưng chưa thấy rõ vì sao quan hệ sản xuất phải thích ứng. Cảnh Việt Nam dựa nhiều vào trích dẫn chính sách. Bản mới nối công cụ → năng lực con người → ba mặt quan hệ → lựa chọn và đánh đổi. Chi tiết lập luận và các phương án sáng tạo nằm ở ../../CONCEPT-AUDIT.md.

Ba tình huống có một dữ kiện, một minh họa và ba câu hỏi sở hữu / tổ chức / phân phối. Phần “Gợi mở” là vận dụng lý luận, tách khỏi thông tin được nguồn xác nhận. Không coi thể chế là toàn bộ QHSX; không coi công nghệ tự động tạo công bằng; không gọi chỉ số Lab là GDP hay năng suất.

Nguồn đối chiếu:
- [Trung tâm Khuyến nông Quốc gia](https://khuyennongvn.gov.vn/chuong-trinh-nganh-nong-nghiep/tai-co-cau-nganh-nong-nghiep/nong-dan-trieu-co-huong-ung-ap-dung-thiet-bi-bay-khong-nguoi-lai-phun-thuoc-tru-sau-31942.html): HTX Thâm Triều, 28,4 ha, vụ Đông Xuân 2025–2026; sử dụng liên kết dịch vụ drone, không suy ra HTX sở hữu drone.
- [VinFast](https://vinfastauto.com/vn_vi/vinfast-hoan-thanh-san-xuat-thu-nghiem-xe-lux-sa20): công bố 07/03/2019, 1.200 robot trong mô tả xưởng dập/hàn, kết nối MES. Không phải kiểm kê hiện tại.
- [Cơ quan thống kê](https://www.nso.gov.vn/du-lieu-va-so-lieu-thong-ke/2025/01/thong-cao-bao-chi-ket-qua-bien-soan-chi-tieu-ty-trong-gia-tri-tang-them-cua-kinh-te-so-trong-gdp-grdp-giai-doan-2020-2024/): kinh tế số năm 2024 ước 13,17% GDP theo giá trị tăng thêm. Không phải tỷ lệ việc làm hay thước đo phân phối công bằng.

## Vòng phản biện hình ảnh

| Cảnh | Sửa và kiểm tra |
|---|---|
| 00 | Vành có tiết diện, khắc chia, chất liệu mờ; mở đầu nêu ý nghĩa sợi đỏ/cấu trúc. |
| 01 | Đất liền khối có rãnh, sắc độ và đá nhỏ; bỏ cảm giác tấm gỗ xếp chồng. |
| 02 | Vạch chia và chi tiết máy dùng geometry chia sẻ/instancing. |
| 03 | Dây bám khớp robot; phôi chạy qua băng chuyền; nhãn vai trò tách khỏi nền máy. |
| 04 | Dữ liệu, chip, máy chủ, người có vật thể riêng; nhãn bám đúng vị trí chiếu của vật thể. |
| 05 | Lõi mịn với pháp tuyến biến dạng; đai giữ độ sâu; tái cấu trúc không tràn vùng điều khiển. |
| 06 | Minh họa cánh đồng có ghi rõ loại ảnh; nhà máy có người vận hành; 100 khối biểu diễn tỷ trọng. Atlas đủ Hoàng Sa/Trường Sa, phóng to được trên mobile. |
| 07 | Socket báo điểm thả; bàn phím gắn/tháo được; ba dòng kết quả mobile không chạm khay. |
| 08 | Giữ thông điệp và nút quay lại khi cuộn tới cuối; kết nối phát triển năng lực với chia sẻ thành quả. |

Ảnh 1440×900: 00-final.png đến 08-final.png. Các ảnh chụp giữa animation bị loại khỏi đánh giá và chụp lại sau khi cảnh ổn định. Các tình huống khác ở 06-factory-desktop-final.png, 06-economy-desktop-final.png. Mobile 390×844 có bộ ảnh riêng và 06-map-mobile-final.png. Ảnh gốc giữ nguyên; contact-final.png chỉ là bảng ghép để đối chiếu.

## Kiểm tra chạy được

- `node tests/model.test.mjs`: đạt.
- `node tests/surface.test.mjs`: đạt; geometry hữu hạn, giới hạn địa hình, giảm chi tiết mobile, texture dữ liệu tuyến tính.
- `scripts/browser-refinement-qa.mjs`: resize 1280×720/1440×900/390×844, kéo thật, Enter/Space, gắn/tháo, tải lại từ giữa hành trình, cuộn sau mở khóa. report.json ghi kết quả đạt.
- `wheel-report.json`: bánh xe chuột thật qua 9 cảnh; cảnh cuối còn nút thao tác; không có console error.
- `scripts/browser-concept-qa.mjs`: 3 tình huống, 9 lựa chọn quan hệ, 3 nguồn; không chồng tiêu đề/số liệu hoặc phản hồi/điều hướng trên mobile; modal bản đồ có Escape, trả focus và nhả khóa cuộn. concept-report.json đạt.
- `npm run build`: TypeScript và Vite đạt. JavaScript WorldCanvas 276,70 KB gzip; chunk vẫn vượt ngưỡng cảnh báo 500 KB trước gzip.

Hiệu năng: một WebGL context, DPR giới hạn 1,5 desktop / 1 mobile; hạt dữ liệu desktop giảm từ 54.000 xuống 18.000 tam giác, mobile 240 hạt; vật thể lặp dùng instancing; texture dữ liệu 256 px. Không có phép đo FPS đối chứng mới để khẳng định tốc độ tăng bao nhiêu. Native touch trên điện thoại thật và GPU yếu chưa được đo lại trong lượt này. Không triển khai ra dịch vụ ngoài.

Ảnh minh họa được tạo bằng image_gen tích hợp; file dự án public/images/cooperative-drone.webp. Prompt/spec và đường dẫn nguồn: ../../IMAGE-PROMPT.md. Quyền và nguồn tài sản: ../../ASSET-REGISTRY.md.
