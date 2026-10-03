# MASTER PROMPT — triển khai toàn bộ Cú Mạch + Driver.js

Copy toàn bộ nội dung từ “Vai trò và nhiệm vụ” trở xuống, gửi agent có quyền đọc và sửa repository này.

## Vai trò và nhiệm vụ

Bạn là kỹ sư frontend chịu trách nhiệm triển khai hoàn chỉnh tính năng hướng dẫn Cú Mạch bằng Driver.js cho website Mạch Vươn Mình. Hãy trực tiếp viết code, tích hợp vào ứng dụng thật, chạy kiểm thử, kiểm tra bằng browser và sửa lỗi cho đến khi hoàn thành phạm vi dưới đây.

Repository:
`C:/Users/ADMIN/Downloads/MLN111_Mach_Vuon_Minh_V2_Red_Thread/mln111_v2_red_thread`

Baseline được đối chiếu ngày 03/10/2026: `a1ae95f`. Bộ thiết kế, catalog lời dẫn và ảnh đã có; `package.json` tại baseline chưa cài Driver.js. Kiểm tra trạng thái hiện tại trước khi sửa; không reset về baseline hoặc ghi đè thay đổi của người khác.

Đây là lệnh triển khai runtime toàn bộ tính năng. Những câu trong tài liệu cũ nói “lượt này chỉ chuẩn bị”, “chưa tích hợp” hoặc cho phép push bộ tài liệu là mô tả lượt trước. Không dùng chúng để thu hẹp nhiệm vụ này thành nghiên cứu hoặc chỉ làm demo. Nhiệm vụ này kết thúc ở bản chạy local/preview có bằng chứng nghiệm thu; không tự push, merge, deploy hoặc publish.

Tự quyết định chi tiết kỹ thuật theo tài liệu và code hiện có. Không hỏi lại những lựa chọn đã được chốt. Chỉ hỏi khi thiếu thông tin bắt buộc mà code và tài liệu không giải quyết được; tiếp tục phần việc độc lập trong lúc chờ.

## 1. Đọc nguồn trước khi code

Đọc `AGENTS.md`, rồi đọc đủ tám tài liệu theo thứ tự:

1. `00_NORTH_STAR.md`
2. `01_RESEARCH_REFERENCES.md`
3. `02_DESIGN_SYSTEM_V2.md`
4. `03_SCENE_BY_SCENE_V2.md`
5. `04_MOTION_AND_EFFECT_MAP.md`
6. `05_CONTENT_CORRECTIONS_V2.md`
7. `06_TECH_ARCHITECTURE_V2.md`
8. `07_MASTER_PROMPT_V2.md`

Sau đó đọc:

- `docs/superpowers/specs/2026-10-03-owl-guide-design.md`: thiết kế và quy tắc trải nghiệm.
- `docs/superpowers/specs/2026-10-03-owl-guide-copy.json`: nguồn chuẩn cho 70 step ID, lời dẫn, biến thể, nút và motion token.
- `docs/superpowers/plans/2026-10-03-owl-guide-driverjs.md`: thực hiện Task 1–8, hợp đồng controller, target và nghiệm thu.
- `public/guide/owl-assets.json`: tám ảnh WebP, kích thước, dung lượng, provenance và checksum.
- `.studio/ART-DIRECTION.md`, phần Cú Mạch trong `.studio/ASSET-REGISTRY.md`, `public/ASSET-CREDITS.md`.

Kế hoạch đã có. Kiểm tra lại điểm nối với code rồi triển khai theo từng lát nhỏ; không dành lượt này viết lại một kế hoạch thay cho code. Dùng workflow thực thi, TDD cho logic trạng thái và kiểm chứng trước khi báo xong. Điều chỉnh hợp đồng nếu code hiện tại chứng minh cần thiết, ghi rõ lý do và cập nhật nơi liên quan.

## 2. Phạm vi bắt buộc: tám phần, 70 bước

Triển khai đủ catalog, không bỏ phần khó:

| Phần | ID | Số bước |
|---|---|---:|
| Intro và điều hướng | I01–I06 | 6 |
| Atlas lịch sử | H01–H08 | 8 |
| Công cụ, cơ giới, tự động hóa, dữ liệu | T01–T05 | 5 |
| Dialectic Lab | L01–L15 | 15 |
| Tình huống Việt Nam | V01–V11 | 11 |
| Policy Chamber | P01–P11 | 11 |
| Kết thúc triển lãm | F01–F04 | 4 |
| Minigame trong iframe | G01–G10 | 10 |

Thứ tự hành trình đầy đủ:
`I01–I06 → T01 → H01–H08 → T02–T05 → L01–L15 → V01–V11 → P01–P11 → F01–F04 → G01–G10`.

T01 diễn ra ở Công cụ trước Atlas. Không đưa người dùng vừa rời Atlas quay ngược về Công cụ. Game là phần có thể chọn tiếp hoặc bỏ qua sau F04; khi bỏ qua, ghi đúng tiến độ và không tuyên bố đã hoàn thành hướng dẫn game.

Quyết định persistence khi chọn bỏ qua game ở F04: ghi F04 completed vì người dùng đã thực hiện lựa chọn hợp lệ; tính lại completedModules theo các bước thực sự completed. Kết thúc lượt với `route='full'`, `status='skipped'`, `lastExit='skip-module'`, `moduleId='game'`, `stepId='G01'`. Đánh dấu các G ID chưa completed là skipped và thêm game vào skippedModuleIds chỉ nếu phần game chưa completed; giữ các invariants monotonic/disjoint. UI báo tuyến triển lãm đã kết thúc, phân biệt phần đã đọc và phần đã bỏ qua; dock cho mở **Hướng dẫn cách chơi** hoặc tiếp tục từ G01. Không gán completed cho các G ID chưa học hoặc tự mở game.

Mỗi bước phải có target thật hoặc fallback rõ ràng, lời dẫn đúng ngữ cảnh, thao tác cần thử, chỗ cần quan sát và điều kiện tiếp tục. G07–G09 có minh họa trước khi chơi và cue ở tình huống thật; không bắt người mới chơi hết năm boss để học cách dùng game.

## 3. Welcome, dock và replay

- Người mới được chào một lần khi intro và font sẵn sàng. Readiness có deadline tổng 5 giây; quá hạn vẫn mở được hướng dẫn bằng chữ qua dock, không chặn thao tác intro.
- Welcome có ba lựa chọn hành trình: **Dẫn tôi khám phá**, **Hướng dẫn nhanh**, **Tự khám phá**; thêm nút footer riêng **Bỏ qua hướng dẫn** theo yêu cầu luôn có đường Skip. Tại welcome, cả Tự khám phá và Bỏ qua hướng dẫn đều lưu `dismissed`, không mở tour và không chào lại sau reload. Không tự bắt đầu tour bằng timer. Quick chỉ gồm I01–I06.
- Cú ở dock mở được: tiếp tục bước dang dở, hướng dẫn phần đang xem, xem lại từ đầu, chọn bất kỳ phần nào, ẩn cú trong phiên này.
- Accessible name của dock: **Mở hướng dẫn của Cú Mạch**. Mục lục có **Cú Mạch / Hướng dẫn & xem lại**, gọi lại được khi dock đã ẩn.
- Game có launcher **Cú Mạch / Cách chơi** trong chính iframe. Dock cha không phủ lên game.
- Có Next, Back, pause, resume, close, skip bước, skip phần và skip toàn bộ theo spec. Hiển thị tên phần và tiến độ phần, ví dụ `LAB · 04 / 15`.
- Nút chữ **Bỏ qua hướng dẫn** luôn nhìn thấy, enabled và bấm được ở welcome, preparing, Driver popover, practice, dialog, lúc chờ iframe và guide trong game. Dấu × không thay thế nút này. Không yêu cầu xác nhận hoặc chờ animation mới cho thoát.

## 4. Kiến trúc và vòng đời

- Cài exact `driver.js@1.8.0`, cập nhật lockfile. Kiểm typings và distribution thật của bản pin; dùng factory TypeScript chính thức, không thêm React wrapper, CDN hoặc animation framework.
- Lazy-load Driver và theme khi cần. Một controller quản lý route, phase, preparation, navigation, cleanup và tiến độ; không rải singleton không có owner trong nhiều component.
- Bám cấu trúc `src/onboarding/` đã đề xuất: types, progress, session, catalog, controller, targets, provider, mascot, dock, popover, cue, stylesheet và game guide. Tách theo trách nhiệm, tránh một component khổng lồ.
- Nối đúng `Experience.tsx`, `WorldTimeline.ts`, `WorldState.ts`, `HistoryBridge.tsx`, `MachineChapter.tsx`, `LabControls.tsx`, `VietnamEvidence.tsx`, `PolicyChamber.tsx`, `SourceDrawer.tsx` và `src/minigame/` khi cần. Thêm adapter và `data-guide` có nghĩa; giữ sửa đổi ngoài onboarding ở phạm vi nhỏ.
- Phase theo hợp đồng trong kế hoạch, phân biệt rõ presenting, practice, modal, pause và handoff. Chỉ một guide hiện diện tại một thời điểm; hủy Driver cha trước khi giao cho dialog/iframe.
- Navigation dùng WorldTimeline/Lenis hiện có. Readiness phải chờ scene/era, layout và target thực sự visible, không chỉ selector tồn tại. Không dùng `nth-child`, text hoặc tọa độ cố định làm định danh.
- Target WebGL dùng DOM proxy khớp vùng vật thể, chỉ hoạt động ở đúng scene. Không tạo canvas hoặc renderer mới để highlight.
- Mỗi run/transition có generation token và AbortController. Promise, observer, listener và readiness nhận AbortSignal; không dùng timeout mù làm bằng chứng cảnh đã ổn định.
- Serialize chuyển bước: double Next chỉ tạo một transition. Next/Back/Skip nhanh, resize, unmount, StrictMode và callback cũ không được làm guide sống lại.
- Timeout/target thiếu có **Thử lại**, **Bỏ qua bước này**, hướng dẫn bằng chữ; không spinner vô hạn hoặc silently đánh dấu completed.
- Nếu override hook Next/Back/Done/Destroy của Driver, tự điều phối và teardown đúng API. Đặc biệt `onDoneClick` phải dẫn tới explicit destroy; không dựa vào teardown tự động.
- Finish, pause, close và skip toàn bộ phải invalidate run, abort, dọn view/cue/observer/listener/tween/portal, kết thúc practice, đóng modal guide sở hữu, destroy Driver, release đúng lease và trả focus. Cleanup/release idempotent; dùng finally để một lỗi dọn dẹp không ngăn các bước còn lại. Handoff chỉ dọn layer, giữ ngữ cảnh phiên cần thiết.

## 5. Cuộn, dialog và thực hành

- Thay khóa boolean bằng scroll lease có owner `tour`, `game`, `dialog`, mỗi acquire có token riêng. Resume chỉ khi tổng lease cho phép, intro đã unlock và người dùng không pause. Release tour không mở khóa của game/dialog.
- Phân biệt bước đọc khóa cuộn và practice cần người dùng cuộn. Practice Công cụ/xưởng/Atlas phải nhận wheel, touch và bàn phím thật; tạm nhả hoặc điều chỉnh riêng lease tour phù hợp. Không nhả lease của owner khác, không đánh dấu practice xong chỉ vì cuộn đã bị chặn.
- Native dialog dùng cue nằm bên trong dialog và giữ focus của dialog. Không cố tăng z-index của Driver trên body để vượt modal top layer. Đóng Driver cha trước khi mở SourceDrawer, zoom, map hoặc game.
- Guide chỉ tự đóng source/map/zoom mà guide đã mở. Bảng người dùng tự mở giữ nguyên, chỉ gỡ cue của guide.
- Slider, kéo thả, lens và thao tác intro chuyển sang cue thực hành không modal; teardown Driver trước khi tập. Không để spotlight chặn pointer capture hoặc đường kéo token.
- Tắt keyboard navigation mặc định của Driver theo kế hoạch; phím Arrow điều khiển range gốc, không đổi tour. Bảo đảm Tab/focus và Esc vẫn có hành vi đúng bằng xử lý riêng theo lớp đang active.
- Practice hoàn tất bằng tín hiệu thao tác phù hợp và nút **Đã thử, tiếp tục**; không auto tiến bằng timer. Không fake click/control state để giả người dùng đã học.
- Replay lưu snapshot mô phỏng/vị trí cần thiết. Lab và Policy kết thúc có **Giữ các thiết lập vừa thử** hoặc **Khôi phục thiết lập trước hướng dẫn**, mặc định khôi phục. Skip-step rollback riêng bước; skip/close/pause rollback phần thử chưa giữ theo spec. Không undo dữ liệu có trước phiên, sound/motion preference hoặc intro đã unlock.

## 6. Tiến độ và persistence

- Dùng schema v2 trong kế hoạch. Lưu route/moduleId/stepId ổn định; không persist numeric index hoặc geometry.
- Hoàn thành, bỏ qua, tạm dừng và đóng có ngữ nghĩa riêng. Quick completed không đồng nghĩa hoàn thành 70 bước. Tự khám phá/Skip tại welcome lưu dismissed; Skip sau khi bắt đầu tour dùng skipped theo hợp đồng.
- completed và skipped luôn disjoint; thành quả completed không bị xóa vì skip lại. Replay hoàn thành bước đã skip phải bỏ skipped ID, tính lại completedModules và bỏ skippedModuleIds tương ứng.
- Pause/×/Esc giữ khả năng resume đúng ID. Skip toàn bộ kết thúc ngay, vẫn gọi lại được từ dock; không phát confirm sau skip.
- Storage malformed, blocked, stale ID, migration v1 và refresh giữa phần phải có fallback an toàn. Khi storage không dùng được, guide vẫn chạy trong phiên và không crash.

## 7. Hướng dẫn minigame thật

- Driver của game chạy trong document iframe, không tìm selector iframe từ Driver cha.
- Viết `scripts/copy-driver-assets.mjs`, nối prebuild và đường chạy dev/test cần thiết. Bản clone sạch chạy `npm ci` rồi `npm run dev` hoặc `npm run build` đều tải được asset vendor; không phụ thuộc một lần build thủ công trước đó.
- Copy `dist/driver.js.iife.js`, `dist/driver.css`, license từ dependency 1.8.0 sang `public/vendor/driver/1.8.0/`; kiểm version/file, giữ MIT notice. Không deep import đường IIFE không được package exports cho phép. Child dùng factory `window.driver.js.driver` sau khi load thành công.
- Parent/child handshake có deadline, AbortSignal/run token và cleanup khi đóng/reload/unmount. Bridge chỉ cho method cố định theo kế hoạch, message type allowlist, đúng source frame, origin và nonce. Kiểm origin thực của `about:srcdoc`; không giả định từ `location.origin` và không nhận selector/script tùy ý.
- Tập jump/duck dùng trạng thái tập riêng: không tăng quãng đường, điểm, stage; không mất tim, không đổi boss HP, không sinh vật cản làm hỏng campaign. Restore đúng ready/paused/running trước hướng dẫn; tập đang giữ phím cũng phải kết thúc sạch khi cancel.
- G07–G09 giải thích quiz/boss/next/retry bằng minh họa có nhãn rõ khi panel thật chưa xuất hiện. Cue thật chỉ mở khi guide còn enabled; không teleport boss, sửa bank 77 câu, đọc key đáp án hoặc trả lời hộ.
- Skip guide giữ game dialog và game lease, kết thúc practice/guide pause; không restart game. Esc lần đầu đóng guide; Esc tiếp theo giữ hành vi trở về bài thuyết trình. Parent toolbar vẫn có đường Skip trong lúc chờ child.
- Phân biệt teardown `guide-only` và `dialog-closed`; chỉ đóng game thật mới release game owner và restore app focus/scroll. Timeout guide giữ game chơi được, cung cấp cách chơi bằng chữ. Late ready sau Skip không khởi động guide lại.

## 8. Lời dẫn, hình ảnh và motion

- Import/map catalog JSON thành dữ liệu runtime có kiểm tra đủ 70 ID duy nhất. Giữ copy chuẩn, button label và variant theo control/context đang visible; không nhân bản lời dẫn vào nhiều component.
- Cú xưng mình/bạn; gọi đúng nhãn, chỉ thao tác và chỗ quan sát. Không đưa từ kỹ thuật như lease, proxy, iframe hoặc state vào lời dẫn cho người dùng.
- Dùng tám WebP hiện có: neutral, point-left, point-right, inspect, practice, confirm, bye và dock. Không generate lại mascot hoặc tải stock khi tài nguyên đã đủ. Chọn ảnh trái/phải theo geometry; không lật CSS khiến khăn/kính bị đảo.
- Art giữ paper `#F3E8D0`, ink `#171512`, red `#B51F2A`, brass `#B48B43`; Be Vietnam Pro và IBM Plex Mono. Duy trì sợi đỏ và cảnh hiện có; không biến triển lãm thành dashboard hoặc card grid.
- Dùng motionTokens trong JSON: welcome 260ms, read 200ms, point 220ms, inspect 240ms, practice/confirm 180ms, exit 160ms. Animate inner wrapper, không tween vị trí/transform outer `.driver-popover` mà Driver đang quản lý.
- Đây là ảnh pose tĩnh: crossfade/translate/rotate nhẹ toàn ảnh. Không giả bộ đã có rig để chớp mắt, vỗ cánh hoặc xoay kính riêng.
- Confirm chỉ sau thao tác xác nhận thật. Không confirm sau Skip, không idle loop, confetti, nhấp nháy hoặc tự phát tiếng. Khi thoát, overlay/lock được dọn ngay; fade chỉ trang trí.
- Reduced-motion và pause loại bỏ chuyển động trang trí, giữ bước/focus. Đổi preference khi tour đang chạy phải kill/reconfigure tween đúng cách, không tự bật motion hoặc sound lại.

## 9. Mobile, accessibility và hiệu năng

- Mobile dùng cue/sheet theo target và safe area; giữ target nhìn thấy và footer Skip bấm được. Kiểm 360×640 và chữ 200%; body được cuộn khi cần, không thu nhỏ chữ để ép vừa.
- H02/H03 bản tĩnh dùng đúng lời dẫn và thao tác cuộn, không yêu cầu rail/mũi tên đang ẩn. Resize 899↔900 phải resolve lại target, giữ tiến độ và vị trí hợp lý.
- Pointer, touch và keyboard dùng được thật. Kiểm focus entry/restore, thứ tự Tab, Esc lớp cao nhất, title/description, contrast và không có focus trap sót. Không đặt aria-modal cho cue không modal.
- Giữ một WebGL context, DPR tối đa khoảng 1.5 desktop/1 mobile. Không pause toàn bộ GSAP/R3F làm mất phản hồi Lab. Observer/tween phải ngừng khi guide không active.
- Mục tiêu guide JS+CSS dưới 45KB gzip, art welcome dưới 30KiB, toàn bộ WebP dưới 160KiB; chỉ tải neutral/dock đầu, lazy pose cần dùng. Đo bundle tích hợp, không suy tốc độ từ dung lượng ảnh.
- Mục tiêu dự án: desktop khoảng 60fps, laptop GPU tích hợp >45fps, mobile >30fps. Ghi thiết bị/phương pháp đo và kết quả; thiếu thiết bị thì ghi chưa kiểm chứng, không suy FPS từ screenshot.

## 10. Trình tự làm và nghiệm thu

Thực hiện Task 1–8 của kế hoạch: nền progress/session/lease; welcome/dock; Driver controller; intro/Atlas/production; Lab/Vietnam/Policy/finale; iframe game; responsive/accessibility; QA và bàn giao. Nền+intro là mốc kiểm tra trung gian, không phải điểm kết thúc nhiệm vụ.

Viết test hành vi có ý nghĩa cho progress/migration, completed-vs-skipped, ownership, rollback, async cancellation, explicit teardown và game practice/protocol. Có test cleanup vẫn release/destroy đúng khi một routine dọn dẹp báo lỗi. Không dùng test tìm chuỗi code/CSS làm bằng chứng tour hoạt động.

Sau sửa cuối, chạy trên clone/dependency sạch nếu khả thi:

```powershell
npm ci
node --test tests/*.test.mjs
npm run build
git diff --check
```

Giữ cả 10 test baseline và thêm test cần thiết. Nếu môi trường không expand glob, truyền danh sách `tests/*.test.mjs` bằng cú pháp shell phù hợp; không coi việc runner nhận sai tên file là test đã chạy.

Kiểm bằng browser thật, lưu bằng chứng tại `.studio/qa/owl-guide/`:

- Coverage đủ 70 ID: đúng target/fallback, copy/variant, pose/motion, Next/Back, pause/resume và Skip. Thử mọi entry replay, cả game preview và cue khi gặp tình huống thật.
- Viewport 1920×1080, 1440×900, 1366×768, 1024×768, 390×844, 360×640; portrait/landscape, chữ 200%, reduced-motion và resize 899↔900. Kiểm Chrome/Edge, Firefox, Safari/iOS theo thiết bị/tool thực có; liệt kê rõ phần chưa chạy.
- First visit storage sạch; returning completed/dismissed; blocked/malformed storage; stale ID; refresh giữa phần; hidden tab; slow load/asset failure; rapid Next/Back; Skip/close khi preparing; StrictMode.
- Atlas caption đúng era, lens/source/map còn hoạt động; practice wheel/touch/range/drag/keyboard không bị guide chặn. Sau cleanup: không overlay/portal/lease còn sót, không mất focus hoặc cuộn lệch ngoài ý muốn, không console error mới.
- Đóng/Skip tour khi game/dialog còn mở không release owner khác; game ready/paused/running, điểm/tim/stage/HP giữ đúng. Mọi đường đóng game trả về app ổn định.
- Chụp welcome, intro practice, Atlas lens/source, Lab practice, policy/result, game guide và replay. Ghi kết quả từng case vào `REVIEW.md` và bảng coverage theo step ID, gồm bằng chứng hoặc lý do chưa kiểm.
- Kiểm 3–5 người mới theo spec nếu có người tham gia. Nếu chưa có, ghi gate usability còn lại; không tạo người dùng/kết quả giả, không dừng phần code có thể hoàn thành.

Không gọi “đã xong toàn bộ” nếu còn phần runtime chưa tích hợp hoặc case bắt buộc chưa qua. Thiếu browser/thiết bị/người thử phải phân biệt rõ “đã triển khai” và “đã kiểm chứng”, nêu gate còn lại sau khi hoàn thành công việc khả thi.

## 11. Bàn giao

- Code hoạt động trong ứng dụng thật, không stub, TODO, nút giả hoặc module chỉ đăng ký tên mà không chạy.
- README có cách chạy, gọi/ẩn cú, replay, reset tiến độ guide khi phát triển và các giới hạn đã xác minh.
- Báo cáo QA và coverage 70 ID; danh sách test/build đã chạy, screenshot và vấn đề còn lại. Ghi delta bundle/performance đã đo.
- Cập nhật registry/credits nếu có tài nguyên mới. Giữ nguyên nội dung lý luận, nguồn lịch sử, công thức Lab, kết quả Policy và question bank.
- Bảo toàn thay đổi ngoài phạm vi, kể cả file QA untracked có sẵn. Không `git add .`, reset/clean, force-push hoặc tự phát hành.
- Mở bản local/preview cuối để người dùng kiểm tra nếu công cụ cho phép. Cuối cùng báo ngắn bằng tiếng Việt: đã làm gì, đủ phần nào, kiểm thử nào qua, URL preview và gate nào chưa kiểm chứng.

Nguồn API chính thức để đối chiếu lúc thực thi: [Installation](https://driverjs.com/docs/installation), [Configuration và lifecycle hooks](https://driverjs.com/docs/configuration), [Async tour](https://driverjs.com/docs/async-tour), [API](https://driverjs.com/docs/api), [bản pin 1.8.0 trên npm](https://registry.npmjs.org/driver.js/1.8.0). Tại thời điểm soạn prompt, registry xác nhận bản 1.8.0 và MIT; các API phải được kiểm lại với dependency đã cài.

Bắt đầu đọc nguồn và triển khai ngay. Tiếp tục qua toàn bộ Task 1–8, sửa lỗi phát hiện trong quá trình kiểm chứng, rồi bàn giao bản chạy được cùng bằng chứng.
