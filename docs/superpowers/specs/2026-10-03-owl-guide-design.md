# Cú dẫn đường — nghiên cứu và thiết kế đề xuất

Ngày đối chiếu: **03/10/2026, Asia/Saigon**. Nền dự án: commit `2ebd049`, React 19.3, Vite 8.3, GSAP 3.15, Lenis 1.3.26, Zustand và một canvas R3F. Đây là tài liệu nghiên cứu/thiết kế; tour chưa được cài vào ứng dụng. Các thời lượng và ngân sách bên dưới là mục tiêu để nghiệm thu.

## 1. Kết quả cần đạt

Người mới thấy một cú đeo kính giới thiệu cách sử dụng Mạch Vươn Mình. Cú dẫn người dùng qua thao tác mở đầu, điều hướng, Atlas, xưởng máy, tự động hóa, Lab, tình huống Việt Nam, chính sách và minigame. Người dùng luôn có thể bỏ qua, dừng, tiếp tục và xem lại. Hướng dẫn phải giúp thực hiện thao tác, không chỉ đọc tên nút.

Tên dùng trong bộ chuẩn bị: **Cú Mạch**. Lời dẫn bằng chữ: thân thiện, rõ, trưởng thành, xưng mình/bạn. User ngày 03/10 yêu cầu rà lời dẫn, từng motion, generate toàn bộ ảnh và push main; lượt này chuẩn bị tài liệu/asset, chưa cài tour vào app. Không tự bật âm thanh, không cần tài khoản, không gửi dữ liệu học tập ra ngoài.

## 2. Driver.js mới nhất và các kết luận kỹ thuật

Đã đọc metadata registry trực tiếp: `latest = 1.8.0`, repository `nilbuild/driver.js`, license MIT. Release 1.8.0 được công bố 17/07/2026. Pin **đúng 1.8.0**, giữ lockfile; kiểm tra lại registry trước ngày thực thi nếu có khoảng cách thời gian. Dùng factory TypeScript chính thức, không thêm wrapper React không cần thiết. Nguồn: [npm registry](https://registry.npmjs.org/driver.js/latest), [release](https://github.com/nilbuild/driver.js/releases/tag/1.8.0), [installation](https://driverjs.com/docs/installation).

| Điều đã xác minh | Hệ quả cho dự án |
|---|---|
| Có `animate`, `duration`, `popoverClass`, `onPopoverRender`, `disableActiveInteraction`, `allowKeyboardControl` | Tạo theme và cú bằng lớp giao diện riêng; dùng đúng tên API. Không dùng `allowActiveInteraction`. |
| Có `waitForElement`, `skipMissingElement`, `advanceOnClick` trong 1.8.0 | Có thể chờ DOM mới. Dự án vẫn cần chờ scene, vị trí cuộn và target nhìn thấy được. |
| Override `onNextClick` / `onPrevClick` thay thế điều hướng mặc định | Controller phải chuyển bước rõ ràng sau khi hoàn tất chuẩn bị. |
| `onDoneClick` thay thế hook cuối và không tự teardown | Controller gọi cleanup rồi `destroy()`; không để overlay sót. |
| `refresh()` cập nhật hình học; `onDestroyed` cho cleanup | Refresh sau resize/layout; dọn observer, React root, tween và listener. |

Nguồn API: [configuration](https://driverjs.com/docs/configuration), [async tour](https://driverjs.com/docs/async-tour), [API](https://driverjs.com/docs/api), [theming](https://driverjs.com/docs/theming). Những quyết định về trải nghiệm dưới đây là thiết kế đề xuất của dự án, không phải tính năng có sẵn của Driver.js.

Kiểm tra distribution **1.8.0** cho thấy listener phím mũi tên ở `window`; tập focusable của thư viện không bao gồm mọi loại input, trong đó có range. Vì vậy: tắt điều hướng phím mặc định; giữ Tab/focus của Driver ở bước đọc; tháo Driver khi thực hành slider hoặc kéo thả để các control dùng hành vi bàn phím gốc. Không coi việc dùng thư viện là chứng nhận accessibility. Nguồn thực thi: [tarball 1.8.0](https://registry.npmjs.org/driver.js/-/driver.js-1.8.0.tgz).

## 3. Đối chiếu code hiện tại

| File hiện có | Điểm phải nối với tour |
|---|---|
| `src/experience/Experience.tsx` | Intro kéo/chạm/Enter; menu; range automation; lazy WorldCanvas và MiniGame; trạng thái mở drawer/game đang cục bộ. |
| `WorldTimeline.ts` | `goToScene`, `goToHistory`, `scrollToPosition`; Atlas và machine có interval riêng. Không tính scene bằng số pixel cứng. |
| `HistoryBridge.tsx` | 8 mốc, previous/next, âm thanh, kính lúp, source, dialog zoom; target khác giữa desktop và mobile/reduced-motion. |
| `MachineChapter.tsx` | Desktop truyền động trong canvas; bản mobile/reduced dùng đoạn kể tĩnh. Không phát minh nút điều khiển máy chưa có. |
| `LabControls.tsx` | 5 thanh LLSX, 3 thanh QHSX, 4 preset, phản hồi trạng thái; tái cấu trúc đang báo trong 1.8 giây. |
| `VietnamEvidence.tsx` | 3 tình huống; Trước/Sau/Cùng làm; 3 câu hỏi quan hệ ở Nhà máy/Kinh tế số; map dialog và source. |
| `PolicyChamber.tsx` | 7 token, 3 socket, drag/chạm/keyboard click; kết quả chỉ render khi đủ 3. |
| `SourceDrawer.tsx` | Menu/source/history là native dialog; mở với `showModal()`, có khôi phục focus. |
| `src/minigame/MiniGame.tsx` + `gameDocument.ts` | Native dialog chứa iframe `srcDoc`; code game là raw JS riêng. Parent dừng Lenis và canvas chính khi game mở. |

Một giới hạn quan trọng: `setTimelineSuspended(boolean)` hiện không phân biệt tour, game hay tác nhân khác. Kế hoạch thêm khóa có chủ sở hữu để kết thúc tour không vô tình mở cuộn khi game vẫn còn mở.

## 4. Nghiên cứu ảnh tham khảo và Pinterest

Đã đối chiếu trực quan **8 ảnh người dùng đã gửi trong cuộc trò chuyện**. Chúng là tham khảo bố cục/nhịp thị giác; không phải hình mẫu của cú.

| Ảnh | Nguyên tắc lấy cho tour |
|---|---|
| Timeline dọc, đồng hồ hai đầu, collage ở giữa | Trình tự rõ, chú thích nằm bên cạnh hiện vật; trên mobile chuyển hướng đọc tự nhiên. |
| Collage lịch sử có kiến trúc, đường dẫn mảnh | Một điểm nhấn ở mỗi lần giải thích; leader nối câu chữ với vật đang nói tới. |
| Timeline phát minh đen trắng và cột năm | Thứ bậc chữ số/nhãn; sắc độ vật liệu tiết chế. |
| Phù Lãng với lớp cảnh liền mạch | Hướng dẫn đi theo câu chuyện, không tách thành dashboard. |
| Vách bảo tàng với chữ năm cực lớn | Mốc/tiến độ nhìn nhanh; chú thích đủ nhỏ để không lấn trải nghiệm. |
| Vách trắng nhiều tư liệu và chân dung | Khoảng cách, độ đọc, sự liên hệ giữa thông tin và hình ảnh. |
| Vách đỏ với khối ảnh/đồ vật đen trắng | Tương phản và nhịp; tour cần thay độ tối overlay theo nền. |
| Infographic thể thao, số liệu và chân dung cutout | Nhãn ngắn, số rõ, icon có chức năng. Không đưa hệ thống biểu đồ thể thao vào tour. |

Đã tìm Pinterest công khai: [Timeline Mural](https://uk.pinterest.com/phillobb/timeline-mural/), [Timelines](https://ie.pinterest.com/keoghyvonne/timelines/), [TB graphics](https://uk.pinterest.com/ruthlloyd33/tb-graphics/). Search cung cấp metadata của các board liên quan; truy cập chi tiết một số pin/board trả lỗi hoặc 403. **Chưa xác định được URL gốc của 8 ảnh đã gửi, chưa xác minh tác giả/quyền dùng của pin, và không tuyên bố đã xem toàn bộ board.** Kết quả tìm cú đeo kính có nhiều mascot costume, không phù hợp art của dự án nên không chọn làm mẫu sản xuất. Kết luận bố cục ở bảng trên chủ yếu dựa trên ảnh người dùng thực sự cung cấp.

Không đưa ảnh Pinterest vào bundle. Asset của cú được tạo riêng; khi thực hiện, ghi nguồn và bản quyền distribution Driver vào `.studio/ASSET-REGISTRY.md` và `public/ASSET-CREDITS.md`.

## 5. Ba hướng art và lựa chọn đề xuất

| Hướng | Đặc trưng | Đánh giá theo ART-DIRECTION |
|---|---|---|
| **01 — Cú quản thủ, nét in** | Lông nâu/ivory, kính đồng tròn, khăn đỏ; chi tiết gợi woodcut hiện đại | **Đề xuất chọn.** Hợp giấy, mực, đồng và ý tưởng sợi đỏ; biểu cảm ấm, hợp triển lãm. |
| 02 — Cú điêu khắc mềm | Cảm giác vật liệu và khối, bóng sáng tinh tế | Có chiều sâu nhưng cần giữ nhất quán nhiều pose; dễ nặng hoặc giống đồ chơi nếu đẩy quá mức. |
| 03 — Cú biểu tượng hình học | Ít nét, tương phản rõ, sợi đỏ sắc | Đọc tốt ở kích thước nhỏ; dùng làm gợi ý cho bản dock giản lược, cần giữ nhận diện của 01. |

Concept gốc `.studio/guide-concept-2026-10-03.png` giữ ba hướng để đối chiếu. Bộ sản xuất được generate riêng theo hướng 01, không cắt sheet: 7 ảnh PNG alpha gốc trong `.studio/guide-assets/originals/`, 7 pose WebP và 1 dock WebP trong `public/guide/`. Các pose: neutral, point-left, point-right, inspect, practice, confirm, bye. Giữ kính đồng/khăn đỏ/nhận diện; không dùng emoji. Prompt đầy đủ và checksum nằm trong bộ provenance. Đây là ảnh tĩnh, không phải rig SVG: motion thực tế là crossfade/translate/nod trên cả ảnh; pose chỉnh kính/chỉ cánh đã được vẽ trong ảnh, không chuyển động từng bộ phận độc lập.

![Concept cú đề xuất](C:/Users/ADMIN/Downloads/MLN111_Mach_Vuon_Minh_V2_Red_Thread/mln111_v2_red_thread/.studio/guide-concept-2026-10-03.png)

| Quy tắc art sản xuất | Giá trị đề xuất |
|---|---|
| Palette | Paper `#F3E8D0`, ink `#171512`, red `#B51F2A`, brass `#B48B43`; thêm nâu lông giới hạn. |
| Typography | Be Vietnam Pro cho nội dung, IBM Plex Mono cho mã bước. |
| Cú trong popover | 88–104px desktop; 56–64px mobile; kính và mắt vẫn đọc ở bản nhỏ. |
| Dock xem lại | Target tối thiểu 44×44px; hình cú giản lược 36–40px, không dùng emoji thay asset. |
| Popover | 320–360px desktop; mobile rộng viewport trừ 32px; tối đa 35–40% chiều cao màn hình trước khi chuyển bố cục. |
| Leader | Nét đỏ 1–1.5px, chấm kết thúc nhỏ; không vẽ đè lên chữ/nút. |
| Bố cục | Nhãn triển lãm + cú ở rìa; popup là lớp trợ giúp phụ, không thay bố cục cảnh chính. |

## 6. Cách xuất hiện lần đầu và replay

1. Chờ React, intro target và font sẵn sàng; thời hạn tổng 5 giây. Thiếu WebGL vẫn hướng dẫn phần DOM. Không chờ tải toàn bộ ảnh/audio mới chào.
2. Cú xuất hiện một lần, cạnh nhãn đầu trải nghiệm: “Chào bạn, mình là Cú Mạch. Mình sẽ chỉ bạn cách mở triển lãm, tìm từng phần và thử các công cụ. Bạn muốn mình dẫn đường hay tự khám phá?”
3. Ba lựa chọn: **Dẫn tôi khám phá** (primary, hành trình đầy đủ), **Hướng dẫn nhanh** (6 bước intro), **Tự khám phá** (đóng welcome). Cú đã tự xuất hiện; người dùng quyết định bắt đầu hành trình và tốc độ.
4. Hành trình đầy đủ có 8 phần, tổng 70 bước chi tiết trong kế hoạch. Mỗi bước chờ đọc/thử/bấm tiếp, không chạy theo timer. Các bước giải thích từng control có thể mở như nhánh chi tiết của phần đang học.
5. Mỗi phần có **Xong phần này**, **Tiếp tục khám phá**, **Tạm dừng hướng dẫn**, **Bỏ qua phần này**. Mọi lớp hướng dẫn có nút chữ **Bỏ qua hướng dẫn** luôn enabled, kể cả preparing, modal cue và trong game; không chỉ có ×. Bước thực hành có **Bỏ qua bước này**. Không ép xác nhận hoặc chờ animation để thoát. Tiến độ ví dụ `LAB · 04 / 15`.
6. Xong hoặc bỏ qua: cú thu về dock. Không tự bật lại toàn bộ khi reload. Không tự chen giữa câu hỏi/boss của game.

Dock có tên accessible **Mở hướng dẫn của Cú Mạch**. Menu nhỏ gồm **Tiếp tục bước dang dở**, **Hướng dẫn phần đang xem**, **Xem lại từ đầu**, danh sách 8 phần và **Ẩn cú trong phiên này**. Mục lục vẫn có **Cú Mạch / Hướng dẫn & xem lại** để gọi lại khi dock bị ẩn. Trong iframe có nút riêng **Cú Mạch / Cách chơi**; parent dock không nổi lên trên game.

Lưu key `mach-vuon-minh:guide:v2`, schemaVersion 2: status (`new`, `in-progress`, `dismissed`, `skipped`, `completed`), route, moduleId, stepId, completedStepIds, completedModules, skippedStepIds, skippedModuleIds, lastExit. Skip không ghi completed và không phát lời khen đã làm đúng. Hoàn thành áp dụng tuyến đã chọn; intro không đồng nghĩa đã xem toàn bộ. Replay rồi hoàn thành xóa trạng thái skipped của bước đó. V1 chưa cài trên app; vẫn có migration phòng preview cũ: lấy completedModules hợp lệ, suy ra ID đã hoàn thành chỉ trong những phần đó, giữ dismissed/in-progress/step hợp lệ, default các mảng mới; không tự chào lại người đã dismissed. Key v1 giữ nguyên đến khi write v2 thành công. Catch get/parse/set riêng; storage cấm/hỏng dùng state phiên. Không lưu snapshot Lab/policy/game hoặc thông tin cá nhân.

**Bỏ qua toàn bộ:** abort chờ, kết thúc gesture/tập, dọn Driver/cue/tween/listener, đóng source/map/zoom chỉ khi guide tự mở, release lease tour, trả focus, lưu skipped và thu cú về dock. Game vẫn mở; trả mode ready/paused/running trước guide, giữ điểm/tim/HP. Intro chưa mở thì vẫn giữ thao tác mở gốc. Skip riêng bước giữ các phần đã hoàn thành; skip phần không đánh dấu phần đó completed. Pause và ×/Esc giữ in-progress để tiếp tục từ ID. Giữ âm thanh và lựa chọn motion. Các thay đổi thử chưa chọn Giữ lượt thử được khôi phục; dữ liệu có trước hướng dẫn được giữ.

Completed/skipped của bước và phần luôn disjoint; skip lại phần đã hoàn thành không xóa thành quả hoặc ghi skipped cho nó. Sau khi replay xong bước cuối còn thiếu, tính lại completedModules và xóa skippedModuleIds tương ứng. Route quick/full/module được truyền rõ vào controller. Push tài liệu/asset lên main đã được yêu cầu ở lượt này; CI Vercel có thể đưa những file đó lên cùng app hiện tại, nhưng tour runtime vẫn chưa được tích hợp.

## 6a. Lời dẫn thân thiện, cụ thể

Catalog `docs/superpowers/specs/2026-10-03-owl-guide-copy.json` có đủ 70 bước: lời Cú, thao tác, chỗ nhìn kết quả, điều kiện tiếp, pose và motion. Mỗi bước nói rõ nên bấm/kéo/quan sát gì. Không dùng thuật ngữ implementation trong lời Cú. Giải nghĩa lực lượng sản xuất/quan hệ sản xuất trước viết tắt, không thu hẹp tư liệu sản xuất thành chỉ công cụ. Lời chính tối đa 40 từ hiện tại; nội dung mobile kiểm fit thật, nếu cần chuyển cue sheet để giữ target và nút Skip visible.

Ví dụ: “Kéo thanh Kỹ năng rồi nhìn lõi và trạng thái bên dưới. Công cụ mới cần người biết vận hành; thanh này giúp bạn thử thay đổi năng lực của người lao động.” H02/H03 có lời riêng cho bản tĩnh: vuốt đến mốc 1899–1936, không yêu cầu mũi tên bị ẩn. Nút lịch sử dùng đúng nhãn Soi chi tiết/Đối chiếu tư liệu; bản đồ phân biệt Xem bản đồ và Phóng to bản đồ. Boss cuối dùng Hoàn thành hành trình. Lỗi cũng có lời rõ: “Mình chưa tìm thấy phần này trên màn hình. Bạn có thể thử lại, bỏ qua bước này hoặc đọc hướng dẫn bằng chữ.”

Thời lượng dự kiến: intro 45–75 giây; học toàn bộ chi tiết 15–25 phút tùy tốc độ. Đây là **ước tính**, cần đo với người dùng. Trải nghiệm chính 3–4 phút vẫn sử dụng được khi bỏ qua tour.

## 7. Hệ motion đề xuất

Driver lo spotlight/hình học; GSAP sẵn có lo wrapper ảnh và lớp nội dung. Không thêm Framer Motion, Lottie runtime hoặc canvas mới. Mỗi ID trong catalog có pose/motion cụ thể; point đổi trái/phải theo vị trí target thật, không chỉ hướng ngược. Error/loading/paused dùng neutral + none.

| Chuyển động | Timing / biên độ | Mục đích |
|---|---|---|
| Welcome | 240–280ms, opacity 0→1, dịch lên 10px | Chào dễ nhận biết, không nhảy vào giữa màn hình. |
| Spotlight giữa 2 target | Driver `duration: 280`, `animate: true` | Người xem theo được vị trí mới. |
| Nội dung popover | 180–220ms, dịch 6px trên **inner wrapper** | Giữ nguyên vị trí mà Driver tính cho outer node. |
| Đổi sang pose chỉ dẫn | 220ms crossfade, không xoay cánh độc lập | Chỉ đúng control vừa được giới thiệu; trái/phải theo geometry. |
| Đổi sang pose chỉnh kính | 240ms crossfade, wrapper dịch 2px, một lần | Dùng ở source/kính lúp; ảnh đã thể hiện tư thế chỉnh kính. |
| Leader | 200–240ms draw sau target ổn định | Nối lời hướng dẫn tới đối tượng. |
| Thực hiện đúng thao tác | 180ms, gật tối đa 3°, check nhỏ | Xác nhận, không phá nhịp đọc. |
| Rời hướng dẫn | 160ms fade và thu về dock | Người dùng biết có thể gọi lại. |

Không tween `top`, `left`, `transform` của `.driver-popover` outer; chỉ animate child để tránh đánh nhau với reposition. Không thêm ink-bleed/dither toàn cục. Không lắc lỗi, confetti, phát tiếng tự động, nhấp nháy spotlight hoặc idle loop. Confirm/gật chỉ xảy ra sau thao tác thật đã được xác nhận; skip không phát confirm. Exit fade tối đa 160ms chỉ trang trí: interaction/overlay/lock được dọn ngay khi bấm, không đợi fade mới trả quyền điều khiển.

`reduced || paused` → Driver `animate:false`, `duration:0`, GSAP duration 0; không bobbing, blink hoặc smooth scroll. Nội dung/trạng thái vẫn đầy đủ. Nguồn nguyên tắc reduced-motion: [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion).

## 8. Quy tắc phối hợp Driver, modal, WebGL và iframe

**Một người dẫn hiện diện tại một thời điểm.** Controller có các trạng thái `idle → preparing → presenting → practice → modal → completed/cancelled`.

- `preparing`: lấy scroll lease; đi đến scene/era; chờ Zustand đúng context, DOM connected/visible, font/layout ổn định qua 2 frame; mới drive. Deadline 5 giây, có hủy.
- `presenting`: popover/spotlight Driver, hướng dẫn bằng chữ. Target WebGL dùng DOM proxy ở vùng vật thể, không giả mesh là HTMLElement. Target proxy phải theo bố cục thực, chỉ hiện khi đúng scene.
- `practice`: teardown Driver nhưng giữ ngữ cảnh/scroll lease; cú ở cue nhỏ không modal. Slider, pointer capture, kéo token đến socket, kính lúp dùng control gốc. Sau xác nhận hoặc **Đã thử, tiếp tục**, mở bước Driver kế. Có **Bỏ qua bước này** và **Bỏ qua hướng dẫn**, nằm ngoài đường kéo/thả.
- `modal`: dừng parent Driver **trước** khi mở SourceDrawer, zoom hoặc map. Đặt cue cùng nhân vật trong dialog đang mở; native dialog quản lý focus. Khi đóng, chờ target cũ trở lại rồi tiếp tục parent tour.

Native dialog thuộc top layer, cao hơn lớp body bất kể z-index. Driver 1.8 thêm overlay/popover vào body; tăng z-index không chữa cấu trúc này. Đây là suy luận tích hợp từ runtime và [MDN top layer](https://developer.mozilla.org/en-US/docs/Glossary/Top_layer).

**Game:** đóng parent Driver trước khi mở MiniGame. Tạo **Driver riêng trong document iframe**. Distribution có `dist/driver.js.iife.js`, `dist/driver.css`, `license`; copy từ dependency đã pin sang `public/vendor/driver/1.8.0/` trong prebuild. Không deep import IIFE qua package exports vì đường đó không export. Child gọi `window.driver.js.driver(...)`; cùng cú/theme, không CDN. License MIT đi kèm distribution.

Child guide pause game bằng bridge giới hạn; thực hành nhảy/cúi dùng trạng thái tập tách biệt, không tăng quãng đường, mất tim hay đổi HP boss. Thoát tập khôi phục trạng thái game. Esc lần đầu đóng guide; Esc khi guide đã đóng giữ hành vi quay lại bài thuyết trình. Khi game đóng: hủy child tour/timer, parent chỉ release lease của game, rồi khôi phục focus và cuộn. Message chỉ nhận từ đúng frame, đúng origin được parent truyền rõ ràng, đúng nonce và loại message trong allowlist; không nhận selector/script tùy ý. Kiểm tra riêng origin của `about:srcdoc` trên browser mục tiêu, không giả định `location.origin` của child luôn bằng parent.

## 9. Dữ liệu, accessibility và lỗi

Tour không dùng `.nth-child()` hoặc text làm ID ổn định. Thêm `data-guide` có nghĩa; mobile/desktop resolver chọn đúng target đang visible. Không chỉ kiểm tra selector tồn tại: caption cũ/offscreen có thể vẫn ở DOM.

Khóa cuộn theo owner: `tour`, `game`, `dialog`. Cleanup tour không resume khi owner khác vẫn giữ khóa, intro còn locked hoặc người dùng đã pause. Giữ GSAP/R3F cần thiết cho feedback Lab; không pause toàn bộ ticker để “dừng trang”. Tất cả Promise/listener chờ readiness phải nhận AbortSignal. Double click Next chỉ có một transition; cancel trong lúc loading không được khởi động lại tour muộn.

Replay lưu snapshot của control mô phỏng và vị trí scene/era. Demo không tự bật/tắt âm thanh hoặc đổi sở thích motion. Lab/policy báo rõ đây là lượt thử: cuối phần có **Giữ các thiết lập vừa thử** hoặc **Khôi phục thiết lập trước hướng dẫn** (mặc định). Hành trình lần đầu kết thúc tại finale; replay theo phần quay lại điểm bắt đầu của phần replay khi được yêu cầu. Intro đã unlock thì không bị khóa lại do rollback.

Focus vào tiêu đề/nút hợp lý; đóng trả về launcher nếu còn tồn tại, nếu không về control có nghĩa trong scene. Không dựa vào `aria-modal=true` khi vẫn cho phép thao tác bên ngoài. Mọi nút có tên rõ; touch target tối thiểu 44px; nội dung 16px trở lên mobile. Không để popup che slider/drop-zone. Nguồn focus/modal: [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

| Sự cố | Hành vi bắt buộc |
|---|---|
| Target thiếu/hết thời gian | Cú báo ngắn, cho Thử lại / Bỏ qua / Xem hướng dẫn bằng chữ; không spinner vô hạn. |
| Scene đổi giữa tour | Tạm dừng bước, đóng layer cũ; hỏi Tiếp tục phần này hoặc Hướng dẫn phần mới trong UI. |
| Resize 899↔900 / rotate | Hủy geometry cũ, re-resolve target mobile/desktop, refresh một lần sau settle. |
| Asset cú/Driver tải lỗi | Control và hướng dẫn chữ vẫn dùng được; không khóa intro/game. |
| localStorage lỗi | Dùng state phiên; người dùng vẫn bỏ qua/replay bình thường. |
| Audio bị chặn | Giải thích nút thử lại, không đánh dấu là đã phát chỉ vì người dùng click. |
| Modal mở/đóng nhanh | Một người dẫn, không listener/overlay tồn tại sau unmount. |
| Giảm motion thay đổi lúc đang tour | Cập nhật config, kill tween, refresh geometry; giữ bước và nội dung. |

## 10. Ngân sách và nghiệm thu

- Không tạo thêm WebGL renderer/context. WorldCanvas giữ DPR 1.5 desktop / 1 compact; game vẫn là canvas 2D hiện có.
- Driver/theme lazy-load sau khi welcome đủ điều kiện; dock là phần DOM nhỏ. Mục tiêu guide JS+CSS dưới45KB gzip, art welcome dưới30KiB, toàn bộ WebP dưới160KiB. Đã đo bộ ảnh: welcome neutral+dock23,754 bytes (23.2KiB); đủ8 WebP149,732 bytes (146.2KiB). Chỉ tải neutral/dock đầu tiên, pose đang dùng/kế tiếp lazy. JS/CSS và hiệu năng tích hợp chưa đo; không coi size ảnh là bằng chứng tốc độ tour.
- Chỉ một observer scope và một RAF cập nhật guide; observer/ticker kết thúc khi tour kết thúc. Không update React mỗi frame theo scroll.
- Test viewport 1920×1080, 1440×900, 1366×768, 1024×768, 390×844 và 360×640; portrait/landscape; zoom chữ 200%; Chrome/Edge, Firefox, Safari/iOS ở phiên bản mục tiêu lúc thực hiện.
- 70 bước đều có target hoặc fallback hợp lệ; keyboard không đổi bước khi chỉnh range; drop thao tác được; modal/iframe không bị overlay che; dừng/xem lại không mất trạng thái bất ngờ.
- Skip-guide/step/module được kiểm trong preparing/presenting/practice/modal/game; không completion giả, callback trễ không mở lại guide, mọi modal/child close path dọn đúng owner. Hidden tab freeze deadline; hiện lại resolve target; pagehide lưu in-progress và teardown.
- Không console error, không body lock/overlay/timer sót; toàn bộ 10 test hiện tại vẫn qua; test guide bổ sung qua; `npm ci` và `npm run build` qua.
- Thử với 3–5 người chưa biết dự án: tự vào Atlas, bật/tắt âm thanh, chỉnh Lab, gắn/tháo token và mở/chơi/đóng game. Ghi vướng mắc và sửa trước release. Mục tiêu ít nhất 4/5 hoàn thành tác vụ mà không cần người khác giải thích; mẫu nhỏ chỉ là usability check, không kết luận thống kê.

Kế hoạch file, hợp đồng kỹ thuật, 70 lời hướng dẫn và các mốc triển khai nằm trong [Implementation Plan](C:/Users/ADMIN/Downloads/MLN111_Mach_Vuon_Minh_V2_Red_Thread/mln111_v2_red_thread/docs/superpowers/plans/2026-10-03-owl-guide-driverjs.md).
