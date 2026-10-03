# Cú Mạch · độ phủ 70 bước trong trình duyệt thật

Sinh bởi `node scripts/owl-guide-qa/coverage.mjs` từ các `result.json` do walker ghi (`walk/`, `responsive/`) và `manual-evidence.json`. Chrome thật (puppeteer-core, kết xuất phần mềm), không phải jsdom.

## Tóm tắt

- 4/70 ID có ít nhất một lượt walker đi tới.
- **66 ID chưa có bằng chứng nào:** I01, I02, T01, H01, H02, H03, H04, H05, H06, H07, H08, T02, T03, T04, T05, L01, L02, L03, L04, L05, L06, L07, L08, L09, L10, L11, L12, L13, L14, L15, V01, V02, V03, V04, V05, V06, V07, V08, V09, V10, V11, P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, F01, F02, F03, F04, G01, G02, G03, G04, G05, G06, G07, G08, G09, G10.
- Không lượt nào gắn cờ.

## Các lượt chạy

| Lượt | Màn hình / chế độ | Phần | Bước ghi nhận | Bước có cờ | Lỗi console |
|---|---|---|---:|---:|---:|
| responsive/intro-360x640-touch | 360×640 touch | intro | 4 | 0 | 0 |

## Theo từng ID

| # | ID | Phần | Tiêu đề | Đích `data-guide` | Lượt sạch / tổng | Ghi chú |
|---:|---|---|---|---|---:|---|
| 1 | `I01` | MỞ ĐẦU | Chào bạn | `welcome` | 0/0 | CHƯA có bằng chứng |
| 2 | `I02` | MỞ ĐẦU | Mở triển lãm | `intro-thread` | 0/0 | CHƯA có bằng chứng |
| 3 | `I03` | MỞ ĐẦU | Đi tiếp | `intro-next` | 1/1 |  |
| 4 | `I04` | MỞ ĐẦU | Tìm một phần | `menu-trigger` | 1/1 |  |
| 5 | `I05` | MỞ ĐẦU | Âm thanh và chuyển động | `menu-settings` | 1/1 |  |
| 6 | `I06` | MỞ ĐẦU | Gọi mình lại | `guide-replay` | 1/1 |  |
| 7 | `T01` | CÔNG CỤ & MÁY | Quan sát công cụ | `agrarian-observation` | 0/0 | CHƯA có bằng chứng |
| 8 | `H01` | ATLAS | Đi qua lịch sử | `history-overview` | 0/0 | CHƯA có bằng chứng |
| 9 | `H02` | ATLAS | Chọn một mốc | `history-era-nav` | 0/0 | CHƯA có bằng chứng |
| 10 | `H03` | ATLAS | Mốc trước và sau | `history-next-prev` | 0/0 | CHƯA có bằng chứng |
| 11 | `H04` | ATLAS | Đọc chú thích | `history-caption` | 0/0 | CHƯA có bằng chứng |
| 12 | `H05` | ATLAS | Nghe âm nền | `history-audio` | 0/0 | CHƯA có bằng chứng |
| 13 | `H06` | ATLAS | Xem hình rõ hơn | `history-inspect` | 0/0 | CHƯA có bằng chứng |
| 14 | `H07` | ATLAS | Kiểm tra tư liệu | `history-source` | 0/0 | CHƯA có bằng chứng |
| 15 | `H08` | ATLAS | Vào xưởng máy | `history-machine-cta` | 0/0 | CHƯA có bằng chứng |
| 16 | `T02` | CÔNG CỤ & MÁY | Theo đường truyền động | `machine-system` | 0/0 | CHƯA có bằng chứng |
| 17 | `T03` | CÔNG CỤ & MÁY | Thử tự động hóa | `automation-range` | 0/0 | CHƯA có bằng chứng |
| 18 | `T04` | CÔNG CỤ & MÁY | Đọc vai trò con người | `automation-roles` | 0/0 | CHƯA có bằng chứng |
| 19 | `T05` | CÔNG CỤ & MÁY | Đi đến phần thử nghiệm | `data-observation` | 0/0 | CHƯA có bằng chứng |
| 20 | `L01` | LAB | Hai nhóm thanh | `lab-core` | 0/0 | CHƯA có bằng chứng |
| 21 | `L02` | LAB | Thử Công nghệ | `lab-technology` | 0/0 | CHƯA có bằng chứng |
| 22 | `L03` | LAB | Thử Dữ liệu | `lab-data` | 0/0 | CHƯA có bằng chứng |
| 23 | `L04` | LAB | Thử Kỹ năng | `lab-skills` | 0/0 | CHƯA có bằng chứng |
| 24 | `L05` | LAB | Thử Hạ tầng | `lab-infrastructure` | 0/0 | CHƯA có bằng chứng |
| 25 | `L06` | LAB | Thử Tự động hóa | `lab-automation` | 0/0 | CHƯA có bằng chứng |
| 26 | `L07` | LAB | Đọc nhóm quan hệ | `lab-relations` | 0/0 | CHƯA có bằng chứng |
| 27 | `L08` | LAB | Thử Sở hữu | `lab-ownership` | 0/0 | CHƯA có bằng chứng |
| 28 | `L09` | LAB | Thử Tổ chức–quản lý | `lab-organization` | 0/0 | CHƯA có bằng chứng |
| 29 | `L10` | LAB | Thử Phân phối | `lab-distribution` | 0/0 | CHƯA có bằng chứng |
| 30 | `L11` | LAB | Đọc kết quả đang thấy | `lab-status` | 0/0 | CHƯA có bằng chứng |
| 31 | `L12` | LAB | Thử Cân bằng | `lab-preset-fit` | 0/0 | CHƯA có bằng chứng |
| 32 | `L13` | LAB | Thử LLSX vượt trước | `lab-preset-ahead` | 0/0 | CHƯA có bằng chứng |
| 33 | `L14` | LAB | Thử QHSX cứng | `lab-preset-rigid` | 0/0 | CHƯA có bằng chứng |
| 34 | `L15` | LAB | Thử Tái cấu trúc | `lab-preset-adapt` | 0/0 | CHƯA có bằng chứng |
| 35 | `V01` | VIỆT NAM | Chọn tình huống | `vietnam-cases` | 0/0 | CHƯA có bằng chứng |
| 36 | `V02` | VIỆT NAM | Xem cách làm trước | `farm-before` | 0/0 | CHƯA có bằng chứng |
| 37 | `V03` | VIỆT NAM | Xem cách làm sau | `farm-after` | 0/0 | CHƯA có bằng chứng |
| 38 | `V04` | VIỆT NAM | Xem cách cùng làm | `farm-cooperation` | 0/0 | CHƯA có bằng chứng |
| 39 | `V05` | VIỆT NAM | Sang Nhà máy | `case-factory` | 0/0 | CHƯA có bằng chứng |
| 40 | `V06` | VIỆT NAM | Hỏi Ai sở hữu? | `relation-ownership` | 0/0 | CHƯA có bằng chứng |
| 41 | `V07` | VIỆT NAM | Hỏi Ai phối hợp? | `relation-organization` | 0/0 | CHƯA có bằng chứng |
| 42 | `V08` | VIỆT NAM | Hỏi Ai hưởng lợi? | `relation-distribution` | 0/0 | CHƯA có bằng chứng |
| 43 | `V09` | VIỆT NAM | Thử Kinh tế số | `case-digital` | 0/0 | CHƯA có bằng chứng |
| 44 | `V10` | VIỆT NAM | Đọc dữ kiện có nguồn | `case-source` | 0/0 | CHƯA có bằng chứng |
| 45 | `V11` | VIỆT NAM | Phóng bản đồ | `case-map` | 0/0 | CHƯA có bằng chứng |
| 46 | `P01` | CHÍNH SÁCH | Chọn ba đòn bẩy | `policy-instruction` | 0/0 | CHƯA có bằng chứng |
| 47 | `P02` | CHÍNH SÁCH | Kỹ năng số | `policy-skills` | 0/0 | CHƯA có bằng chứng |
| 48 | `P03` | CHÍNH SÁCH | Quyền dữ liệu | `policy-data-rights` | 0/0 | CHƯA có bằng chứng |
| 49 | `P04` | CHÍNH SÁCH | Quản trị dữ liệu | `policy-data-governance` | 0/0 | CHƯA có bằng chứng |
| 50 | `P05` | CHÍNH SÁCH | Thử nghiệm có kiểm soát | `policy-sandbox` | 0/0 | CHƯA có bằng chứng |
| 51 | `P06` | CHÍNH SÁCH | Đãi ngộ sáng tạo | `policy-reward` | 0/0 | CHƯA có bằng chứng |
| 52 | `P07` | CHÍNH SÁCH | Hạ tầng số | `policy-infrastructure` | 0/0 | CHƯA có bằng chứng |
| 53 | `P08` | CHÍNH SÁCH | Cùng tham gia | `policy-inclusion` | 0/0 | CHƯA có bằng chứng |
| 54 | `P09` | CHÍNH SÁCH | Gắn và tháo lựa chọn | `policy-sockets` | 0/0 | CHƯA có bằng chứng |
| 55 | `P10` | CHÍNH SÁCH | Đọc cả ba dòng | `policy-result` | 0/0 | CHƯA có bằng chứng |
| 56 | `P11` | CHÍNH SÁCH | Thử tổ hợp khác | `policy-retry` | 0/0 | CHƯA có bằng chứng |
| 57 | `F01` | KẾT | Nhìn lại câu chuyện | `finale-thesis` | 0/0 | CHƯA có bằng chứng |
| 58 | `F02` | KẾT | Quay lại phần thử | `finale-lab` | 0/0 | CHƯA có bằng chứng |
| 59 | `F03` | KẾT | Đọc nguồn sau khi xem | `finale-source` | 0/0 | CHƯA có bằng chứng |
| 60 | `F04` | KẾT | Mở phần ôn tập | `finale-game` | 0/0 | CHƯA có bằng chứng |
| 61 | `G01` | GAME | Sẵn sàng chơi | `game-start` | 0/0 | CHƯA có bằng chứng |
| 62 | `G02` | GAME | Tập nhảy | `game-jump` | 0/0 | CHƯA có bằng chứng |
| 63 | `G03` | GAME | Tập cúi | `game-duck` | 0/0 | CHƯA có bằng chứng |
| 64 | `G04` | GAME | Dừng và chơi tiếp | `game-pause` | 0/0 | CHƯA có bằng chứng |
| 65 | `G05` | GAME | Đọc đường chạy | `game-hud` | 0/0 | CHƯA có bằng chứng |
| 66 | `G06` | GAME | Giữ trái tim | `game-hearts` | 0/0 | CHƯA có bằng chứng |
| 67 | `G07` | GAME | Trả lời câu hỏi | `game-quiz-help` | 0/0 | CHƯA có bằng chứng |
| 68 | `G08` | GAME | Đối mặt boss | `game-boss-help` | 0/0 | CHƯA có bằng chứng |
| 69 | `G09` | GAME | Sang chặng hoặc chơi lại | `game-next-retry-help` | 0/0 | CHƯA có bằng chứng |
| 70 | `G10` | GAME | Gọi cú trong game | `game-guide-replay` | 0/0 | CHƯA có bằng chứng |

## Cờ

Không có.
