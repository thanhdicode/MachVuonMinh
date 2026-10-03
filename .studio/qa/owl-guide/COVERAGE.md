# Cú Mạch · độ phủ 70 bước trong trình duyệt thật

Sinh bởi `node scripts/owl-guide-qa/coverage.mjs --prefix release-` từ các `result.json` do walker ghi (`walk/`, `responsive/`) và `manual-evidence.json`. Chrome thật (puppeteer-core, kết xuất phần mềm), không phải jsdom.

## Tóm tắt

- 68/70 ID có ít nhất một lượt walker đi tới.
- 2 ID chỉ có bằng chứng thủ công (kịch bản vòng đời, không phải walker): I01, I02.
- Không còn ID nào thiếu bằng chứng.
- Không lượt nào gắn cờ.

## Các lượt chạy

| Lượt | Màn hình / chế độ | Phần | Bước ghi nhận | Bước có cờ | Lỗi console |
|---|---|---|---:|---:|---:|
| responsive/release-finale-desktop | 1440×900 | finale | 4 | 0 | 0 |
| responsive/release-finale-mobile | 360×640 touch | finale | 4 | 0 | 0 |
| responsive/release-history-desktop | 1440×900 | history | 8 | 0 | 0 |
| responsive/release-history-mobile | 360×640 touch | history | 8 | 0 | 0 |
| responsive/release-intro-desktop | 1440×900 | intro | 4 | 0 | 0 |
| responsive/release-intro-mobile | 360×640 touch | intro | 4 | 0 | 0 |
| responsive/release-lab-desktop | 1440×900 | lab | 15 | 0 | 0 |
| responsive/release-lab-mobile | 360×640 touch | lab | 15 | 0 | 0 |
| responsive/release-policy-desktop | 1440×900 | policy | 11 | 0 | 0 |
| responsive/release-policy-mobile | 360×640 touch | policy | 11 | 0 | 0 |
| responsive/release-production-desktop | 1440×900 | production | 5 | 0 | 0 |
| responsive/release-production-mobile | 360×640 touch | production | 5 | 0 | 0 |
| responsive/release-vietnam-desktop | 1440×900 | vietnam | 11 | 0 | 0 |
| responsive/release-vietnam-mobile | 360×640 touch | vietnam | 11 | 0 | 0 |
| walk/release-game-mobile | 390×844 touch | game | 10 | 0 | 0 |
| walk/release-game-origin | 1440×900 | game | 10 | 0 | 0 |

## Theo từng ID

| # | ID | Phần | Tiêu đề | Đích `data-guide` | Lượt sạch / tổng | Ghi chú |
|---:|---|---|---|---|---:|---|
| 1 | `I01` | MỞ ĐẦU | Chào bạn | `welcome` | 0/0 | thủ công: lifecycle/01-first-visit: lời chào lần đầu hiện đúng một lần, không tự chạy theo timer, ba lựa chọn + Bỏ qua hướng dẫn (23/23 kiểm tra đạt); ảnh welcome.png |
| 2 | `I02` | MỞ ĐẦU | Mở triển lãm | `intro-thread` | 0/0 | thủ công: lifecycle/01-first-visit: thực hành bằng bàn phím; lifecycle/pointer-thread-390x844-touch: kéo thật bằng con trỏ cảm ứng rồi xác nhận hoàn tất, 9/9 kiểm tra đạt, không bị cue che tay nắm |
| 3 | `I03` | MỞ ĐẦU | Đi tiếp | `intro-next` | 2/2 |  |
| 4 | `I04` | MỞ ĐẦU | Tìm một phần | `menu-trigger` | 2/2 |  |
| 5 | `I05` | MỞ ĐẦU | Âm thanh và chuyển động | `menu-settings` | 2/2 |  |
| 6 | `I06` | MỞ ĐẦU | Gọi mình lại | `guide-replay` | 2/2 |  |
| 7 | `T01` | CÔNG CỤ & MÁY | Quan sát công cụ | `agrarian-observation` | 2/2 |  |
| 8 | `H01` | ATLAS | Đi qua lịch sử | `history-overview` | 2/2 |  |
| 9 | `H02` | ATLAS | Chọn một mốc | `history-era-nav` | 2/2 |  |
| 10 | `H03` | ATLAS | Mốc trước và sau | `history-next-prev` | 2/2 |  |
| 11 | `H04` | ATLAS | Đọc chú thích | `history-caption` | 2/2 |  |
| 12 | `H05` | ATLAS | Nghe âm nền | `history-audio` | 2/2 |  |
| 13 | `H06` | ATLAS | Xem hình rõ hơn | `history-inspect` | 2/2 |  |
| 14 | `H07` | ATLAS | Kiểm tra tư liệu | `history-source` | 2/2 |  |
| 15 | `H08` | ATLAS | Vào xưởng máy | `history-machine-cta` | 2/2 |  |
| 16 | `T02` | CÔNG CỤ & MÁY | Theo đường truyền động | `machine-system` | 2/2 |  |
| 17 | `T03` | CÔNG CỤ & MÁY | Thử tự động hóa | `automation-range` | 2/2 |  |
| 18 | `T04` | CÔNG CỤ & MÁY | Đọc vai trò con người | `automation-roles` | 2/2 |  |
| 19 | `T05` | CÔNG CỤ & MÁY | Đi đến phần thử nghiệm | `data-observation` | 2/2 |  |
| 20 | `L01` | LAB | Hai nhóm thanh | `lab-core` | 2/2 |  |
| 21 | `L02` | LAB | Thử Công nghệ | `lab-technology` | 2/2 |  |
| 22 | `L03` | LAB | Thử Dữ liệu | `lab-data` | 2/2 |  |
| 23 | `L04` | LAB | Thử Kỹ năng | `lab-skills` | 2/2 |  |
| 24 | `L05` | LAB | Thử Hạ tầng | `lab-infrastructure` | 2/2 |  |
| 25 | `L06` | LAB | Thử Tự động hóa | `lab-automation` | 2/2 |  |
| 26 | `L07` | LAB | Đọc nhóm quan hệ | `lab-relations` | 2/2 |  |
| 27 | `L08` | LAB | Thử Sở hữu | `lab-ownership` | 2/2 |  |
| 28 | `L09` | LAB | Thử Tổ chức–quản lý | `lab-organization` | 2/2 |  |
| 29 | `L10` | LAB | Thử Phân phối | `lab-distribution` | 2/2 |  |
| 30 | `L11` | LAB | Đọc kết quả đang thấy | `lab-status` | 2/2 |  |
| 31 | `L12` | LAB | Thử Cân bằng | `lab-preset-fit` | 2/2 |  |
| 32 | `L13` | LAB | Thử LLSX vượt trước | `lab-preset-ahead` | 2/2 |  |
| 33 | `L14` | LAB | Thử QHSX cứng | `lab-preset-rigid` | 2/2 |  |
| 34 | `L15` | LAB | Thử Tái cấu trúc | `lab-preset-adapt` | 2/2 |  |
| 35 | `V01` | VIỆT NAM | Chọn tình huống | `vietnam-cases` | 2/2 |  |
| 36 | `V02` | VIỆT NAM | Xem cách làm trước | `farm-before` | 2/2 |  |
| 37 | `V03` | VIỆT NAM | Xem cách làm sau | `farm-after` | 2/2 |  |
| 38 | `V04` | VIỆT NAM | Xem cách cùng làm | `farm-cooperation` | 2/2 |  |
| 39 | `V05` | VIỆT NAM | Sang Nhà máy | `case-factory` | 2/2 |  |
| 40 | `V06` | VIỆT NAM | Hỏi Ai sở hữu? | `relation-ownership` | 2/2 |  |
| 41 | `V07` | VIỆT NAM | Hỏi Ai phối hợp? | `relation-organization` | 2/2 |  |
| 42 | `V08` | VIỆT NAM | Hỏi Ai hưởng lợi? | `relation-distribution` | 2/2 |  |
| 43 | `V09` | VIỆT NAM | Thử Kinh tế số | `case-digital` | 2/2 |  |
| 44 | `V10` | VIỆT NAM | Đọc dữ kiện có nguồn | `case-source` | 2/2 |  |
| 45 | `V11` | VIỆT NAM | Phóng bản đồ | `case-map` | 2/2 |  |
| 46 | `P01` | CHÍNH SÁCH | Chọn ba đòn bẩy | `policy-instruction` | 2/2 |  |
| 47 | `P02` | CHÍNH SÁCH | Kỹ năng số | `policy-skills` | 2/2 |  |
| 48 | `P03` | CHÍNH SÁCH | Quyền dữ liệu | `policy-data-rights` | 2/2 |  |
| 49 | `P04` | CHÍNH SÁCH | Quản trị dữ liệu | `policy-data-governance` | 2/2 |  |
| 50 | `P05` | CHÍNH SÁCH | Thử nghiệm có kiểm soát | `policy-sandbox` | 2/2 |  |
| 51 | `P06` | CHÍNH SÁCH | Đãi ngộ sáng tạo | `policy-reward` | 2/2 |  |
| 52 | `P07` | CHÍNH SÁCH | Hạ tầng số | `policy-infrastructure` | 2/2 |  |
| 53 | `P08` | CHÍNH SÁCH | Cùng tham gia | `policy-inclusion` | 2/2 |  |
| 54 | `P09` | CHÍNH SÁCH | Gắn và tháo lựa chọn | `policy-sockets` | 2/2 |  |
| 55 | `P10` | CHÍNH SÁCH | Đọc cả ba dòng | `policy-result` | 2/2 |  |
| 56 | `P11` | CHÍNH SÁCH | Thử tổ hợp khác | `policy-retry` | 2/2 |  |
| 57 | `F01` | KẾT | Nhìn lại câu chuyện | `finale-thesis` | 2/2 |  |
| 58 | `F02` | KẾT | Quay lại phần thử | `finale-lab` | 2/2 |  |
| 59 | `F03` | KẾT | Đọc nguồn sau khi xem | `finale-source` | 2/2 |  |
| 60 | `F04` | KẾT | Mở phần ôn tập | `finale-game` | 2/2 |  |
| 61 | `G01` | GAME | Sẵn sàng chơi | `game-start` | 2/2 |  |
| 62 | `G02` | GAME | Tập nhảy | `game-jump` | 2/2 |  |
| 63 | `G03` | GAME | Tập cúi | `game-duck` | 2/2 |  |
| 64 | `G04` | GAME | Dừng và chơi tiếp | `game-pause` | 2/2 |  |
| 65 | `G05` | GAME | Đọc đường chạy | `game-hud` | 2/2 |  |
| 66 | `G06` | GAME | Giữ trái tim | `game-hearts` | 2/2 |  |
| 67 | `G07` | GAME | Trả lời câu hỏi | `game-quiz-help` | 2/2 |  |
| 68 | `G08` | GAME | Đối mặt boss | `game-boss-help` | 2/2 |  |
| 69 | `G09` | GAME | Sang chặng hoặc chơi lại | `game-next-retry-help` | 2/2 |  |
| 70 | `G10` | GAME | Gọi cú trong game | `game-guide-replay` | 2/2 |  |

## Cờ

Không có.
