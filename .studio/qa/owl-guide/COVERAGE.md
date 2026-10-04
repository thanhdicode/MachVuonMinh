# Cú Mạch · độ phủ 70 bước trong trình duyệt thật

Sinh bởi `node scripts/owl-guide-qa/coverage.mjs --prefix driver-laptop` từ các `result.json` do walker ghi (`walk/`, `responsive/`) và `manual-evidence.json`. Chrome thật (puppeteer-core, kết xuất phần mềm), không phải jsdom.

## Tóm tắt

- 68/70 ID có ít nhất một lượt walker đi tới.
- 2 ID chỉ có bằng chứng thủ công (kịch bản vòng đời, không phải walker): I01, I02.
- Không còn ID nào thiếu bằng chứng.
- Không lượt nào gắn cờ.

## Các lượt chạy

| Lượt | Màn hình / chế độ | Phần | Bước ghi nhận | Bước có cờ | Lỗi console |
|---|---|---|---:|---:|---:|
| responsive/driver-laptop-finale-1366 | 1366×768 | finale | 4 | 0 | 0 |
| responsive/driver-laptop-history-1024 | 1024×768 | history | 8 | 0 | 0 |
| responsive/driver-laptop-history-1366 | 1366×768 | history | 8 | 0 | 0 |
| responsive/driver-laptop-intro-1366 | 1366×768 | intro | 4 | 0 | 0 |
| responsive/driver-laptop-lab-1366 | 1366×768 | lab | 15 | 0 | 0 |
| responsive/driver-laptop-policy-1366 | 1366×768 | policy | 11 | 0 | 0 |
| responsive/driver-laptop-production-1366 | 1366×768 | production | 5 | 0 | 0 |
| responsive/driver-laptop-vietnam-1366 | 1366×768 | vietnam | 11 | 0 | 0 |
| walk/driver-laptop-game-1366 | 1366×768 | game | 10 | 0 | 0 |

## Theo từng ID

| # | ID | Phần | Tiêu đề | Đích `data-guide` | Lượt sạch / tổng | Ghi chú |
|---:|---|---|---|---|---:|---|
| 1 | `I01` | MỞ ĐẦU | Chào bạn | `welcome` | 0/0 | thủ công: 2026-10-04 laptop audit: responsive/states-driver-laptop-1366/result.json, welcome at1366x768; owl loaded, four choices clickable, no clipping or layout issues. Prior lifecycle/01-first-visit checks first-visit-only behavior23/23. |
| 2 | `I02` | MỞ ĐẦU | Mở triển lãm | `intro-thread` | 0/0 | thủ công: 2026-10-04 laptop audit: responsive/states-driver-laptop-1366/result.json, I02 practice plus pause/skip/menu states; no layout issues or browser errors. Prior lifecycle/pointer-thread-390x844-touch verifies a real pointer drag9/9. |
| 3 | `I03` | MỞ ĐẦU | Đi tiếp | `intro-next` | 1/1 |  |
| 4 | `I04` | MỞ ĐẦU | Tìm một phần | `menu-trigger` | 1/1 |  |
| 5 | `I05` | MỞ ĐẦU | Âm thanh và chuyển động | `menu-settings` | 1/1 |  |
| 6 | `I06` | MỞ ĐẦU | Gọi mình lại | `guide-replay` | 1/1 |  |
| 7 | `T01` | CÔNG CỤ & MÁY | Quan sát công cụ | `agrarian-observation` | 1/1 |  |
| 8 | `H01` | ATLAS | Đi qua lịch sử | `history-overview` | 2/2 |  |
| 9 | `H02` | ATLAS | Chọn một mốc | `history-era-nav` | 2/2 |  |
| 10 | `H03` | ATLAS | Mốc trước và sau | `history-next-prev` | 2/2 |  |
| 11 | `H04` | ATLAS | Đọc chú thích | `history-caption` | 2/2 |  |
| 12 | `H05` | ATLAS | Nghe âm nền | `history-audio` | 2/2 |  |
| 13 | `H06` | ATLAS | Xem hình rõ hơn | `history-inspect` | 2/2 |  |
| 14 | `H07` | ATLAS | Kiểm tra tư liệu | `history-source` | 2/2 |  |
| 15 | `H08` | ATLAS | Vào xưởng máy | `history-machine-cta` | 2/2 |  |
| 16 | `T02` | CÔNG CỤ & MÁY | Theo đường truyền động | `machine-system` | 1/1 |  |
| 17 | `T03` | CÔNG CỤ & MÁY | Thử tự động hóa | `automation-range` | 1/1 |  |
| 18 | `T04` | CÔNG CỤ & MÁY | Đọc vai trò con người | `automation-roles` | 1/1 |  |
| 19 | `T05` | CÔNG CỤ & MÁY | Đi đến phần thử nghiệm | `data-observation` | 1/1 |  |
| 20 | `L01` | LAB | Hai nhóm thanh | `lab-core` | 1/1 |  |
| 21 | `L02` | LAB | Thử Công nghệ | `lab-technology` | 1/1 |  |
| 22 | `L03` | LAB | Thử Dữ liệu | `lab-data` | 1/1 |  |
| 23 | `L04` | LAB | Thử Kỹ năng | `lab-skills` | 1/1 |  |
| 24 | `L05` | LAB | Thử Hạ tầng | `lab-infrastructure` | 1/1 |  |
| 25 | `L06` | LAB | Thử Tự động hóa | `lab-automation` | 1/1 |  |
| 26 | `L07` | LAB | Đọc nhóm quan hệ | `lab-relations` | 1/1 |  |
| 27 | `L08` | LAB | Thử Sở hữu | `lab-ownership` | 1/1 |  |
| 28 | `L09` | LAB | Thử Tổ chức–quản lý | `lab-organization` | 1/1 |  |
| 29 | `L10` | LAB | Thử Phân phối | `lab-distribution` | 1/1 |  |
| 30 | `L11` | LAB | Đọc kết quả đang thấy | `lab-status` | 1/1 |  |
| 31 | `L12` | LAB | Thử Cân bằng | `lab-preset-fit` | 1/1 |  |
| 32 | `L13` | LAB | Thử LLSX vượt trước | `lab-preset-ahead` | 1/1 |  |
| 33 | `L14` | LAB | Thử QHSX cứng | `lab-preset-rigid` | 1/1 |  |
| 34 | `L15` | LAB | Thử Tái cấu trúc | `lab-preset-adapt` | 1/1 |  |
| 35 | `V01` | VIỆT NAM | Chọn tình huống | `vietnam-cases` | 1/1 |  |
| 36 | `V02` | VIỆT NAM | Xem cách làm trước | `farm-before` | 1/1 |  |
| 37 | `V03` | VIỆT NAM | Xem cách làm sau | `farm-after` | 1/1 |  |
| 38 | `V04` | VIỆT NAM | Xem cách cùng làm | `farm-cooperation` | 1/1 |  |
| 39 | `V05` | VIỆT NAM | Sang Nhà máy | `case-factory` | 1/1 |  |
| 40 | `V06` | VIỆT NAM | Hỏi Ai sở hữu? | `relation-ownership` | 1/1 |  |
| 41 | `V07` | VIỆT NAM | Hỏi Ai phối hợp? | `relation-organization` | 1/1 |  |
| 42 | `V08` | VIỆT NAM | Hỏi Ai hưởng lợi? | `relation-distribution` | 1/1 |  |
| 43 | `V09` | VIỆT NAM | Thử Kinh tế số | `case-digital` | 1/1 |  |
| 44 | `V10` | VIỆT NAM | Đọc dữ kiện có nguồn | `case-source` | 1/1 |  |
| 45 | `V11` | VIỆT NAM | Phóng bản đồ | `case-map` | 1/1 |  |
| 46 | `P01` | BA ĐỜI SỐNG | Đổi nhịp công việc | `policy-instruction` | 1/1 |  |
| 47 | `P02` | BA ĐỜI SỐNG | Vai trò của người lao động | `policy-skills` | 1/1 |  |
| 48 | `P03` | BA ĐỜI SỐNG | Ai được dùng dữ liệu? | `policy-data-rights` | 1/1 |  |
| 49 | `P04` | BA ĐỜI SỐNG | Cùng dùng, cùng thỏa thuận | `policy-data-governance` | 1/1 |  |
| 50 | `P05` | BA ĐỜI SỐNG | Mở có kiểm soát | `policy-sandbox` | 1/1 |  |
| 51 | `P06` | BA ĐỜI SỐNG | Chia dòng giá trị | `policy-reward` | 1/1 |  |
| 52 | `P07` | BA ĐỜI SỐNG | Tái đầu tư | `policy-infrastructure` | 1/1 |  |
| 53 | `P08` | BA ĐỜI SỐNG | Năng lực mới | `policy-inclusion` | 1/1 |  |
| 54 | `P09` | BA ĐỜI SỐNG | Thử đổi cách phân phối | `policy-sockets` | 1/1 |  |
| 55 | `P10` | BA ĐỜI SỐNG | Ba đời sống, một hệ thống | `policy-result` | 1/1 |  |
| 56 | `P11` | BA ĐỜI SỐNG | Thử một nhịp khác | `policy-retry` | 1/1 |  |
| 57 | `F01` | KẾT | Nhìn lại câu chuyện | `finale-thesis` | 1/1 |  |
| 58 | `F02` | KẾT | Quay lại phần thử | `finale-lab` | 1/1 |  |
| 59 | `F03` | KẾT | Đọc nguồn sau khi xem | `finale-source` | 1/1 |  |
| 60 | `F04` | KẾT | Mở phần ôn tập | `finale-game` | 1/1 |  |
| 61 | `G01` | GAME | Sẵn sàng chơi | `game-start` | 1/1 |  |
| 62 | `G02` | GAME | Tập nhảy | `game-jump` | 1/1 |  |
| 63 | `G03` | GAME | Tập cúi | `game-duck` | 1/1 |  |
| 64 | `G04` | GAME | Dừng và chơi tiếp | `game-pause` | 1/1 |  |
| 65 | `G05` | GAME | Đọc đường chạy | `game-hud` | 1/1 |  |
| 66 | `G06` | GAME | Giữ trái tim | `game-hearts` | 1/1 |  |
| 67 | `G07` | GAME | Trả lời câu hỏi | `game-quiz-help` | 1/1 |  |
| 68 | `G08` | GAME | Đối mặt boss | `game-boss-help` | 1/1 |  |
| 69 | `G09` | GAME | Sang chặng hoặc chơi lại | `game-next-retry-help` | 1/1 |  |
| 70 | `G10` | GAME | Gọi cú trong game | `game-guide-replay` | 1/1 |  |

## Cờ

Không có.
