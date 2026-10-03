# Cú Mạch + Driver.js Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Theo quota policy của dự án: triển khai native theo lát nhỏ; chỉ fork khi cần tách ngữ cảnh, tối đa 2 thread. Yêu cầu hiện tại cho phép commit/push bộ kế hoạch và ảnh đã rà lên main; các checkbox tích hợp runtime bên dưới chưa được thực hiện. GitHub/Vercel hiện có có thể tự deploy app và asset từ push đó; không coi đó là tour đã triển khai.

**Goal:** Người mới được cú đeo kính hướng dẫn sử dụng toàn bộ triển lãm, có thực hành, bỏ qua, tiếp tục và replay theo phần hoặc từ đầu.

**Architecture:** Driver.js quản lý spotlight/popover cho các bước đọc; controller điều phối scene, readiness và trạng thái hướng dẫn. Cú dùng bộ ảnh WebP nền trong đã tạo riêng, DOM và GSAP hiện có; thao tác thực hành chuyển sang cue không modal. Native dialog dùng cue nằm trong dialog; game dùng Driver riêng trong iframe, cùng asset/theme và protocol giới hạn.

**Tech Stack:** Driver.js **1.8.0** pin exact, React 19, TypeScript strict, Zustand, GSAP/Lenis hiện có. Giữ R3F hiện có; không thêm renderer hay animation framework. Node hiện tại **24.16.0**, chạy test `.mjs` import module `.ts` thuần tương tự test hiện có.

**Spec:** [Nghiên cứu & thiết kế](C:/Users/ADMIN/Downloads/MLN111_Mach_Vuon_Minh_V2_Red_Thread/mln111_v2_red_thread/docs/superpowers/specs/2026-10-03-owl-guide-design.md).

## Global Constraints

- Palette paper `#F3E8D0`, ink `#171512`, red `#B51F2A`, brass `#B48B43`; chỉ Be Vietnam Pro và IBM Plex Mono.
- `One WebGL context only.` Max DPR ~1.5 desktop / 1 mobile. Mục tiêu dự án desktop ~60fps, integrated laptop >45fps, mobile >30fps; đo khi thực hiện, không tuyên bố đã đạt.
- Reduced-motion và pause của người dùng phải được tôn trọng. Không tự bật sound.
- 8 phần hướng dẫn, 70 bước định danh; intro là phần mở đầu ngắn, các phần còn lại có thể mở riêng.
- Thao tác drag có đường chạm/click/bàn phím; input range dùng phím gốc. Không dùng timer thay cho việc người dùng đọc/thực hiện.
- Không thay question bank, công thức Lab, kết quả policy hoặc nguồn lịch sử để làm tour dễ hơn.
- Mọi bước có Bỏ qua / Đóng hướng dẫn; replay không reset dữ liệu trò chơi hoặc sở thích ngầm.
- **Bỏ qua hướng dẫn** là nút chữ luôn nhìn thấy và bấm được ở welcome, preparing, popover, practice, cue trong dialog và guide trong game. Không thay nút này bằng dấu ×. Không yêu cầu xác nhận, không đợi animation hoặc hết deadline mới cho bỏ qua.
- Lời dẫn chuẩn nằm trong `docs/superpowers/specs/2026-10-03-owl-guide-copy.json`: đủ 70 ID, mỗi ID có title/say/action/observe/completion/pose/motion. Bảng bên dưới đồng bộ lời dẫn từ file này; không tự viết lại thành lời trừu tượng trong lúc tích hợp.
- Kích thước, timing và payload trong spec là target phải đo. Không cam kết tuyệt đối “không bao giờ lỗi”.

## Review Focus

1. Cancel/Next nhanh trong lúc lazy DOM hoặc Lenis đang đi đến scene: bước cũ không sống lại.
2. Mở game/source/map khi tour giữ scroll: teardown không resume owner khác hoặc bỏ sót body lock.
3. Range ArrowLeft/ArrowRight và policy drag ra khỏi target: thực hành hoạt động, không chuyển tour ngoài ý muốn.
4. Resize 899↔900, reduced-motion hoặc zoom chữ làm target đổi: chọn node đang visible, không chỉ node còn tồn tại.
5. iframe Escape, storage cấm, reload và StrictMode: vẫn đóng/replay được; không mất tim/điểm/focus.

## 1. File và trách nhiệm

Root workspace: `C:/Users/ADMIN/Downloads/MLN111_Mach_Vuon_Minh_V2_Red_Thread/mln111_v2_red_thread`.

| File sẽ tạo | Trách nhiệm |
|---|---|
| `src/onboarding/guideTypes.ts` | Hợp đồng ID, phase, progress, step, adapter. |
| `src/onboarding/guideProgress.ts` | Read/write storage có schema và fallback; không phụ thuộc React. |
| `src/onboarding/guideSession.ts` | Snapshot/replay, run token, cancel và trạng thái phiên. |
| `src/onboarding/guideCatalog.ts` | Nội dung/đích/điều kiện của 8 phần; giữ copy ở một nơi. |
| `src/onboarding/guideController.ts` | Chuẩn bị, Next/Back, transition, sở hữu đúng một Driver. |
| `src/onboarding/guideTargets.ts` | Resolve target visible, đợi layout, deadline/AbortSignal. |
| `src/onboarding/GuideProvider.tsx` | Nối lifecycle React với controller và adapter Experience. |
| `src/onboarding/OwlMascot.tsx` | Hiển thị WebP pose trong khung cố định; chuyển pose/motion có cleanup và fallback chữ. |
| `src/onboarding/GuideDock.tsx` | Mở, tiếp tục, phần hiện tại, từ đầu, ẩn và replay menu. |
| `src/onboarding/GuidePopover.tsx` | Nội dung React portal vào host của Driver; progress/nút/cú. |
| `src/onboarding/GuideCue.tsx` | Cue thực hành hoặc trong modal, không overlay riêng. |
| `src/onboarding/guide.css` | Theme scoped `.mach-guide`, mobile/safe area/reduced motion. |
| `src/onboarding/game-guide.js` | Controller native JS trong iframe; cùng catalog game/theme, không import React. |
| `scripts/copy-driver-assets.mjs` | Copy IIFE/CSS/license từ package pin vào public; kiểm tra file/version. |
| `tests/guide-progress.test.mjs` | Storage/schema/tiếp tục/migration. |
| `tests/guide-session.test.mjs` | Snapshot, cancel race và lifecycle phiên. |
| `tests/scroll-leases.test.mjs` | Nhiều owner, idempotent release, intro locked/paused. |
| `tests/game-guide.test.mjs` | Practice không đổi campaign; restore/cancel/protocol. |

Files sửa đúng phạm vi: `package.json`, lockfile; `Experience.tsx`, `WorldTimeline.ts`, `WorldState.ts` (chỉ nếu adapter cần trạng thái scene sẵn có); `HistoryBridge.tsx`, `MachineChapter.tsx`, `LabControls.tsx`, `VietnamEvidence.tsx`, `PolicyChamber.tsx`, `SourceDrawer.tsx`; `MiniGame.tsx`, `gameDocument.ts`, `assets/game.html`, `assets/game.js`; các registry/credits. Giữ CSS/aria/logic control gốc; thêm `data-guide` và hook phối hợp nhỏ, không refactor toàn bộ project.

## 2. Hợp đồng dùng chung

Các signature dưới đây là thiết kế cho code sẽ viết, không phải API đang tồn tại trong repo.

```ts
export type GuideModule = 'intro' | 'history' | 'production' | 'lab'
  | 'vietnam' | 'policy' | 'finale' | 'game';
export type GuideRoute = 'quick' | 'full' | GuideModule;
export type GuidePhase = 'idle' | 'preparing' | 'presenting'
  | 'practice' | 'modal' | 'paused' | 'completed' | 'cancelled';
export type GuideProgress = {
  schemaVersion: 2;
  status: 'new' | 'in-progress' | 'dismissed' | 'skipped' | 'completed';
  route: GuideRoute | null;
  moduleId: GuideModule | null;
  stepId: string | null;
  completedStepIds: string[];
  completedModules: GuideModule[];
  skippedStepIds: string[];
  skippedModuleIds: GuideModule[];
  lastExit: 'pause' | 'skip-guide' | 'skip-module' | 'close' | null;
};
export type GuideStep = {
  id: string;
  moduleId: GuideModule;
  scene: number | 'history' | 'game';
  target: string;
  kind: 'read' | 'practice' | 'modal';
  title: string;
  body: string;
  outcome: string;
  pose: 'neutral' | 'point-left' | 'point-right' | 'inspect' | 'practice' | 'confirm' | 'bye';
  motion: 'welcome' | 'read' | 'point' | 'inspect' | 'practice' | 'confirm' | 'exit' | 'none';
  variants?: {
    when: 'history-static' | 'audio-on' | 'case-farm' | 'keyboard' | 'quiz-no-hearts' | 'boss-final';
    say: string;
    action?: string;
    pose?: GuideStep['pose'];
    motion?: GuideStep['motion'];
  }[];
};
export type GuideAdapters = {
  prepare(step: GuideStep, signal: AbortSignal): Promise<HTMLElement>;
  practice(step: GuideStep, signal: AbortSignal): Promise<void>;
  closeOwnedModal(): Promise<void>;
  restoreDemo(): void;
};
export type GuideController = {
  start(route: GuideRoute, stepId?: string): Promise<void>;
  next(): Promise<void>;
  back(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  skip(scope: 'step' | 'module' | 'guide'): Promise<void>;
  cancel(): Promise<void>;
  finish(): Promise<void>;
};
```

Progress lưu ID, không lưu numeric index. `outcome` là key trong allowlist implementer định nghĩa từ bảng dưới (next, unlocked, audio-interacted, range-committed, token-installed, modal-closed…); không execute string. Mọi transition có generation token và AbortController. Khi run bị cancel, kết quả Promise cũ bị bỏ dù asset/scene vừa hoàn tất. `completedModules` chỉ thêm khi mọi bước của phần đã được đọc/thử theo lựa chọn của người dùng; skip không thêm completed. `completed` áp dụng tuyến đã chọn, không nói người học đã xem cả 70 bước nếu chỉ chọn intro. Khi xem lại rồi hoàn thành bước đã skip, bỏ ID đó khỏi skippedStepIds. Nội dung được thấy bằng chữ, không tự phát giọng đọc.

Welcome truyền rõ `start('quick')` hoặc `start('full')`; replay phần truyền ID phần, không đổi route qua hidden state. Tiến độ đã hoàn thành là monotonic: skip lại bước/phần đã completed không thêm vào skippedStepIds/skippedModuleIds. Hai tập completed/skipped luôn disjoint. Sau mọi completion, bỏ skipped của ID, tính lại phần đủ toàn bộ ID để thêm completedModules và bỏ skippedModuleIds tương ứng. Trạng thái skipped/lastExit phản ánh lượt hướng dẫn vừa thoát, không xóa thành quả đã đọc trước đó. Test các invariants sau reload và replay.

**Skip / pause / close:** `skip('step')` bỏ bước hiện tại và chuẩn bị bước sau; `skip('module')` bỏ phần đang học và đưa lựa chọn phần sau; `skip('guide')` kết thúc hướng dẫn ngay, persist `skipped`/`lastExit='skip-guide'`, giữ ID để có thể tiếp tục. Trong welcome, Tự khám phá/Bỏ qua hướng dẫn lưu `dismissed`; reload không tự chào lại. Đóng/×/Esc gọi cancel, giữ tiến độ `in-progress` và `lastExit='close'`. Pause có teardown giống cancel nhưng giữ step/route và `lastExit='pause'`; resume luôn re-prepare từ ID, không dùng geometry cũ. Không phát pose confirm sau skip/cancel.

**Demo và modal có chủ sở hữu:** khi bỏ qua/thôi hướng dẫn, khôi phục thay đổi mô phỏng của phần thử chưa được chọn Giữ lượt thử, không undo dữ liệu có trước hướng dẫn hoặc preference. Skip bước khôi phục snapshot của riêng bước đó; không undo các bước trước đã giữ. `closeOwnedModal()` chỉ đóng source/zoom/map do guide mở; bảng do user tự mở chỉ mất cue, vẫn dùng bình thường. Game dialog vẫn mở khi Skip guide: child kết thúc tập, trả đúng ready/paused/running trước guide; không restart game. Chỉ Quay lại bài thuyết trình mới đóng game.

## 3. Catalog 70 bước: copy, đích và hành vi

Tên ở cột Đích là **giá trị `data-guide` sẽ thêm**, không phải selector được cho là đã có. Tất cả bước có Tiếp tục/Quay lại/**Bỏ qua hướng dẫn**; bước thử có thêm **Bỏ qua bước này**, đầu/cuối phần có **Bỏ qua phần này**. Chỉ đánh dấu thực hiện sau callback/control state thật hoặc xác nhận tự quan sát được ghi rõ; không chỉ sau pointerdown. Source/map/zoom dùng modal handoff như spec. Pose/motion/action/observe của từng ID đọc từ catalog lời dẫn; bảng dưới giữ đích và điều phối kỹ thuật.

### Phần A — Intro và điều hướng: 6 bước

| ID | Đích | Cú nói — copy đề xuất | Thao tác / điều kiện tiếp |
|---|---|---|---|
| I01 | `welcome` | “Chào bạn, mình là Cú Mạch. Mình sẽ chỉ bạn cách mở triển lãm, tìm từng phần và thử các công cụ. Bạn muốn mình dẫn đường hay tự khám phá?” | Welcome tự xuất hiện một lần; chọn đầy đủ/nhanh/tự khám phá. |
| I02 | `intro-thread` | “Kéo đầu sợi đỏ qua vòng kim loại để mở triển lãm. Bạn cũng có thể chạm vào đầu sợi đỏ hoặc nhấn Enter. Khi mở xong, mình chỉ bạn cách đi tiếp.” | Teardown Driver → practice; đợi `unlocked=true`. Không highlight node đã bị unmount sau unlock. |
| I03 | `intro-next` | “Cuộn xuống để xem phần tiếp theo. Dùng chuột, vuốt màn hình hoặc bấm mũi tên đang được chỉ sáng. Bạn cứ đi theo tốc độ mình thấy thoải mái nhé.” | Cú chỉ next-cue; Next sử dụng `goToScene(1)`, chờ scene settle. |
| I04 | `menu-trigger` | “Bấm nút ba gạch để mở Mục lục. Bạn có thể chọn thẳng phần muốn xem, không cần cuộn lại từ đầu.” | Mở menu qua callback; parent Driver đóng trước dialog. |
| I05 | `menu-settings` | “Trong bảng này, bạn có thể bật hoặc tắt âm thanh, và tạm dừng chuyển động. Chọn cách xem phù hợp với bạn; mình sẽ giữ lựa chọn đó.” | Cue trong menu; chỉ thay preference khi user bấm. Back không tự đảo sound/paused. |
| I06 | `guide-replay` | “Bấm hình cú khi cần mình hướng dẫn lại. Bạn có thể tiếp tục bước đang xem, mở hướng dẫn của phần hiện tại hoặc xem lại từ đầu.” | Đóng menu, focus dock; quick tour kết thúc; full tour quan sát Công cụ ở T01 rồi sang Atlas. |

### Phần B — Atlas lịch sử: 8 bước

| ID | Đích | Cú nói | Thao tác / điều kiện tiếp |
|---|---|---|---|
| H01 | `history-overview` | “Cuộn để đi qua bức tranh lịch sử này. Trên điện thoại, vuốt xuống qua các mốc. Nhìn tên thời kỳ bên cạnh hình để biết bạn đang ở đâu.” | `goToHistory`, đợi `history=true`; resolve panorama desktop hoặc section mobile đầu tiên. |
| H02 | `history-era-nav` | “Bấm mốc 1899–1936 để xem đường sắt, mỏ và cảng. Khi hình dừng lại, đọc tên thời kỳ và chú thích. Các mốc khác cũng mở theo cách này.” | Click mốc 02; chờ era 1 active và caption khớp; Next không nhảy khi animation còn chạy. |
| H03 | `history-next-prev` | “Bấm mũi tên sang phải một lần để xem mốc sau. Mũi tên trái đưa bạn quay lại. Ở mốc đầu hoặc cuối, nút không dùng được sẽ mờ đi.” | Thử next; active era thay đổi, sau đó cho đọc; giới thiệu cùng pattern áp dụng cả 8 mốc. |
| H04 | `history-caption` | “Đọc tên thời kỳ và chú thích ở đây. Hình giúp bạn hình dung lịch sử; đây là minh họa tái dựng. Muốn kiểm tra dữ kiện, bấm Đối chiếu tư liệu.” | Highlight caption đang visible; không dùng hidden caption của era khác. |
| H05 | `history-audio` | “Bấm nút Âm thanh tắt nếu bạn muốn nghe âm nền của thời kỳ đang xem. Khi nút hiện Âm thanh bật, bấm lại để tắt. Không tiện nghe thì cứ bỏ qua bước này nhé.” | User tự toggle; nếu AudioContext không chạy, chỉ hướng dẫn thử lại. Bỏ qua hợp lệ, không yêu cầu có loa. |
| H06 | `history-inspect` | “Bấm Soi chi tiết rồi rê kính lúp lên vùng hình bạn muốn xem. Bấm lại hoặc nhấn Esc để tắt kính lúp.” | Practice lens desktop; modal cue mobile. Đợi đóng lens/dialog rồi resume. |
| H07 | `history-source` | “Bấm Đối chiếu tư liệu để xem nguồn và mốc thời gian của phần này. Muốn đọc tài liệu đầy đủ, bấm Đọc nguồn gốc. Bấm nút × để đóng bảng và quay lại.” | Source đúng active era; cue chỉ dl/link trong dialog; không tự click outbound link. |
| H08 | `history-machine-cta` | “Bấm dòng Cơ giới hóa — khi một chiếc máy trở thành cả một hệ thống để vào xưởng. Bạn sẽ thấy lực được truyền đến nhiều máy qua trục và dây đai.” | Đến cuối Atlas bằng navigation có sẵn/adapter có nghĩa; chờ CTA visible rồi user/Next sang scene 02. |

Đường mobile H02/H03 dùng mốc/section visible, không ép trải nghiệm thành scroll ngang. Mỗi era phải hoạt động với cùng logic; test cả 8, không viết 8 bài giảng lịch sử lặp lại trong tour.

### Phần C — Cơ giới, tự động hóa, dữ liệu: 5 bước

| ID | Đích | Cú nói | Thao tác / điều kiện tiếp |
|---|---|---|---|
| T01 | `agrarian-observation` | “Ở phần Công cụ, cuộn chậm và nhìn sức người, sức kéo cùng đường cày. Sợi đỏ nối các cảnh, giúp bạn theo dõi cách công cụ thay đổi.” | Full route chạy bước này trước H01, tại scene 01; replay production cũng bắt đầu ở scene 01. Không quay ngược sau khi vừa rời Atlas. |
| T02 | `machine-system` | “Cuộn chậm qua xưởng, nhìn từ nguồn lực đến trục rồi dây đai nối các máy. Bạn chỉ cần quan sát, không cần bấm vào bánh răng.” | Desktop proxy vùng máy; mobile/reduced section tĩnh đang visible. Cho user cuộn practice, kết thúc bằng Tiếp tục. |
| T03 | `automation-range` | “Kéo thanh Mức tự động hóa sang phải, rồi nhìn các vai trò phía trên thay đổi. Bạn cũng có thể chọn thanh bằng Tab và dùng phím mũi tên.” | Scene 03; native range pointer/keyboard; commit khi change+pointerup hoặc keyup, không đổi tour bằng Arrow. |
| T04 | `automation-roles` | “Nhìn các nhãn vai trò sau khi bạn đổi thanh. Máy tự động hơn, nhưng con người vẫn có việc giám sát, thiết kế và cải tiến. Thanh này giúp bạn so sánh cách thể hiện đó.” | Chỉ nhãn/role-nodes DOM; đợi user Next, không tự đánh giá đáp án. |
| T05 | `data-observation` | “Quan sát các nhãn dữ liệu, AI, hạ tầng và kỹ năng. Chúng cùng góp vào năng lực sản xuất. Cuộn tiếp để thử thay đổi từng yếu tố trong phần mô phỏng.” | Scene 04, target nhãn/DOM proxy; không gán mesh particle vào Driver. |

### Phần D — Phòng biện chứng: 15 bước

Các bước L02–L06 và L08–L10 là nhánh **Giải thích từng thanh**, luôn truy cập được từ phần Lab. Hành trình đầy đủ có nhánh này; người dùng có thể bỏ qua cả nhánh rồi replay riêng.

| ID | Đích | Cú nói | Thao tác / điều kiện tiếp |
|---|---|---|---|
| L01 | `lab-core` | “Lực lượng sản xuất (LLSX) gồm người lao động và tư liệu sản xuất. Quan hệ sản xuất (QHSX) gồm sở hữu, tổ chức–quản lý và phân phối. Đây là mô phỏng khái niệm, không phải số liệu kinh tế.” | Snapshot trước lượt thử; target proxy core-label gắn bố cục center. |
| L02 | `lab-technology` | “Kéo thanh Công nghệ sang phải hoặc trái, rồi nhìn lõi và trạng thái bên dưới thay đổi. Thanh này giúp bạn thử mức năng lực của công cụ trong mô phỏng.” | Highlight label rồi practice input Công nghệ; xác nhận commit hoặc bỏ qua. |
| L03 | `lab-data` | “Kéo thanh Dữ liệu rồi nhìn lõi và trạng thái bên dưới. Thanh này biểu diễn vai trò của dữ liệu trong sản xuất hiện đại để bạn so sánh.” | Native range; không nói Marx liệt kê dữ liệu trong định nghĩa cổ điển. |
| L04 | `lab-skills` | “Kéo thanh Kỹ năng rồi nhìn lõi và trạng thái bên dưới. Công cụ mới cần người biết vận hành; thanh này giúp bạn thử thay đổi năng lực của người lao động.” | Đổi một thanh, quan sát lõi; cue không che output. |
| L05 | `lab-infrastructure` | “Kéo thanh Hạ tầng rồi nhìn lõi và trạng thái. Hạ tầng gồm những nền tảng như điện và đường truyền, giúp công cụ và người lao động làm việc.” | Chỉnh thanh bằng chuột hoặc Arrow khi focus input; Next vẫn là nút riêng. |
| L06 | `lab-automation` | “Kéo thanh Tự động hóa rồi nhìn lõi và trạng thái. Ở đây bạn đang thử năng lực của hệ thống; thanh ở phần trước dùng để trình bày sự thay đổi vai trò.” | Giải thích đây là Lab, khác thanh biểu diễn scene 03; practice commit. |
| L07 | `lab-relations` | “Nhìn ba thanh Sở hữu, Tổ chức–quản lý và Phân phối. Chúng giúp bạn thử ba mặt của quan hệ sản xuất. Số lớn hơn ở đây không có nghĩa là luôn tốt hơn.” | Nhóm relations; bước đọc, chuẩn bị 3 thanh riêng. |
| L08 | `lab-ownership` | “Kéo thanh Sở hữu rồi nhìn cấu trúc đỏ và trạng thái. Khi đọc tình huống thật, câu hỏi ở mặt này là: ai nắm công cụ và tư liệu để sản xuất?” | Range Sở hữu; không giải nghĩa 100 là luôn tốt hơn. |
| L09 | `lab-organization` | “Kéo thanh Tổ chức–quản lý rồi nhìn cấu trúc đỏ và trạng thái. Mặt này nói về cách phân công công việc, phối hợp và quản lý sản xuất.” | Range; giữ đủ 3 mặt QHSX trong copy. |
| L10 | `lab-distribution` | “Kéo thanh Phân phối rồi nhìn cấu trúc đỏ và trạng thái. Mặt này đặt câu hỏi: thành quả lao động được chia như thế nào?” | Range; commit hoặc skip. |
| L11 | `lab-status` | “Đọc dòng Phù hợp, Căng thẳng hoặc Mâu thuẫn ở đây, rồi đọc câu giải thích bên dưới. Đây là phản hồi của mô phỏng theo các thanh bạn vừa đặt.” | Cú không biến aria-live mỗi frame thành phát ngôn liên tục. |
| L12 | `lab-preset-fit` | “Bấm Cân bằng để đưa các thanh về cùng mức. Nhìn trạng thái và hình ở giữa; dùng cách đặt này làm điểm đầu để so sánh với hai ví dụ tiếp theo.” | User bấm preset fit; kiểm state arrays đúng [50×5], [50×3]. |
| L13 | `lab-preset-ahead` | “Bấm LLSX vượt trước rồi đọc trạng thái. Ví dụ này giúp bạn thấy năng lực sản xuất thay đổi nhanh hơn mức thích ứng của quan hệ sản xuất.” | User preset ahead; đợi UI mô phỏng phản hồi, không coi đây là số liệu thực. |
| L14 | `lab-preset-rigid` | “Bấm QHSX cứng rồi so sánh với ví dụ vừa rồi. Đọc giải thích bên dưới để xem mô phỏng thể hiện sự chưa tương ứng giữa hai nhóm thế nào.” | User preset rigid; cho so sánh với L13, không ép coi là đáp án chính trị. |
| L15 | `lab-preset-adapt` | “Bấm Tái cấu trúc, chờ quá trình kết thúc rồi đọc trạng thái mới. Khi rời phần thử, bạn có thể giữ các thanh vừa đặt hoặc trở về thiết lập trước đó.” | Đợi reconfigure kết thúc thực tế; không dựa vào chỉ một sleep 1800ms. Giữ/rollback demo rõ ràng. |

### Phần E — Việt Nam, bằng chứng và bản đồ: 11 bước

| ID | Đích | Cú nói | Thao tác / điều kiện tiếp |
|---|---|---|---|
| V01 | `vietnam-cases` | “Bấm Cánh đồng, Nhà máy hoặc Kinh tế số để xem từng tình huống. Mỗi phần có dữ kiện và nguồn riêng. Mình bắt đầu cùng bạn ở Cánh đồng nhé.” | Scene 06; case navigation visible; set case chỉ khi user/Next chọn. |
| V02 | `farm-before` | “Bấm Trước để xem người lao động đeo bình và đi từng luống. Nhìn thao tác trong cảnh; đây là cách làm thủ công được minh họa.” | User chọn Trước; farmStage=0. |
| V03 | `farm-after` | “Bấm Sau rồi nhìn cách lập đường bay và giám sát drone. Công cụ đổi thì kỹ năng vận hành cũng cần đổi. Bạn có thể bấm Trước để so sánh lại.” | Sau → farmStage=1; quan sát mô phỏng, không tour auto nâng sound. |
| V04 | `farm-cooperation` | “Bấm Cùng làm để xem xã viên, hợp tác xã và đơn vị drone phối hợp. Nhìn các vai trò trong cảnh để thấy ai làm phần việc nào.” | Cùng làm → farmStage=2. |
| V05 | `case-factory` | “Bấm Nhà máy để xem tình huống sản xuất này. Đọc dữ kiện rồi thử ba câu hỏi: ai sở hữu, ai phối hợp và ai hưởng lợi?” | Case=1; chờ nội dung mới, không reuse target Cánh đồng. |
| V06 | `relation-ownership` | “Bấm Ai sở hữu? rồi đọc phần trả lời mới xuất hiện. Câu hỏi này giúp bạn xem quyền sở hữu tư liệu và công nghệ trong tình huống.” | evidenceLens=0; đọc response mới. |
| V07 | `relation-organization` | “Bấm Ai phối hợp? rồi đọc phần trả lời. Bạn đang xem cách tổ chức công việc và quản lý sản xuất trong tình huống này.” | evidenceLens=1; không đồng nhất QHSX với thể chế. |
| V08 | `relation-distribution` | “Bấm Ai hưởng lợi? rồi đọc phần trả lời. Câu hỏi này giúp bạn xem thành quả được chia và lợi ích đến với ai.” | evidenceLens=2; chờ response, Next do user. |
| V09 | `case-digital` | “Bấm Kinh tế số rồi thử lại ba câu hỏi vừa học. Đọc câu trả lời của tình huống mới; cùng câu hỏi có thể giúp bạn thấy những điểm khác nhau.” | Case=2; dùng lại lens controls, không phải 3 tour trùng nhau. |
| V10 | `case-source` | “Bấm Dữ kiện & nguồn gốc. Trong bảng, xem con số thuộc năm nào và do cơ quan nào công bố. Đóng bảng khi bạn muốn quay lại tình huống.” | Mở source đúng case; cue trong native drawer; link chỉ được user mở. |
| V11 | `case-map` | “Bấm Phóng to bản đồ để nhìn vị trí và ký hiệu rõ hơn, rồi đọc chú thích. Ký hiệu quần đảo không thể hiện ranh giới biển. Bấm Đóng để quay lại.” | Case-map hoặc map-expand tùy case; modal cue rồi Đóng; trả focus đúng nút. |

### Phần F — Buồng chính sách: 11 bước

P02–P08 là nhánh **Xem từng đòn bẩy**. Toàn bộ đều có trong guide; không bắt gắn cả 7 vào 3 socket. Cú giúp đọc trade-off, không chấm đáp án thắng/thua.

| ID | Đích | Cú nói | Thao tác / điều kiện tiếp |
|---|---|---|---|
| P01 | `policy-instruction` | “Bạn có ba vòng trống và bảy lựa chọn. Kéo một lựa chọn vào vòng, hoặc chạm vào nó để gắn vào vòng trống. Mình sẽ chỉ bạn cách đọc từng lựa chọn.” | Scene 07; snapshot trước thử; teardown Driver khi practice kéo thả. |
| P02 | `policy-skills` | “Chọn Kỹ năng số nếu bạn muốn thử hỗ trợ người lao động vận hành và làm chủ công nghệ. Bạn có thể gắn để xem kết quả hoặc bấm Tiếp tục để xem lựa chọn khác.” | Highlight token; đọc/Next; chỉ gắn khi user muốn thử. |
| P03 | `policy-data-rights` | “Chọn Quyền dữ liệu để thử góc nhìn về ai được tiếp cận và sử dụng dữ liệu. Bạn có thể gắn để so sánh, hoặc xem lựa chọn tiếp theo.” | Đọc token, không biến copy thành khẳng định pháp lý mới. |
| P04 | `policy-data-governance` | “Chọn Quản trị dữ liệu để thử cách tổ chức, phối hợp và quản lý dữ liệu. Gắn cùng các lựa chọn khác rồi đọc kết quả để so sánh.” | Đọc/Next hoặc chọn gắn. |
| P05 | `policy-sandbox` | “Sandbox là cách thử nghiệm trong phạm vi có kiểm soát. Bạn có thể chọn token này để xem nó kết hợp với hai lựa chọn khác ra sao.” | Đọc token; không nêu chính sách cụ thể chưa có nguồn. |
| P06 | `policy-reward` | “Chọn Đãi ngộ sáng tạo để thử cách ghi nhận và chia sẻ thành quả đổi mới. Đọc kết quả của cả tổ hợp; một lựa chọn không bảo đảm mọi vấn đề được giải quyết.” | Đọc/Next; không hứa kết quả thực tế. |
| P07 | `policy-infrastructure` | “Chọn Hạ tầng số để thử nền tảng hỗ trợ các công cụ mới hoạt động. Nếu đã đủ ba vòng, tháo một lựa chọn trước khi gắn lựa chọn mới bằng cách chạm.” | Đọc token; nếu đã đầy chỉ hướng dẫn thay, không cài ngầm. |
| P08 | `policy-inclusion` | “Tiếp cận bao trùm nói về cơ hội cùng tham gia và hưởng lợi. Bạn có thể chọn token này rồi đọc điểm mạnh, phần còn thiếu và điều phải đánh đổi.” | Đọc/Next; giữ vai trò quan sát, không chấm điểm đạo đức. |
| P09 | `policy-sockets` | “Chọn đủ ba đòn bẩy để mở kết quả. Chạm vào vòng đã gắn để tháo. Bạn cũng có thể kéo lựa chọn mới vào vòng để thay.” | Practice không overlay chặn đường drag; đạt đủ 3 hoặc skip. Test pointer cancel/outside. |
| P10 | `policy-result` | “Đọc lần lượt Mạnh ở, Còn thiếu và Đánh đổi. Một tổ hợp có thể giúp ở mặt này và để lại vấn đề ở mặt khác. Hãy đọc đủ ba dòng trước khi so sánh.” | Chỉ target khi result thực sự mounted; thiếu slot → quay cue chọn 3. |
| P11 | `policy-retry` | “Tháo một lựa chọn rồi gắn lựa chọn khác, hoặc kéo để thay. Đọc lại cả ba dòng và so sánh. Bạn có thể giữ tổ hợp vừa thử hoặc khôi phục tổ hợp trước hướng dẫn.” | Tháo/thay ít nhất một hoặc skip; giữ/rollback thử rõ ràng. |

### Phần G — Finale và xem lại: 4 bước

| ID | Đích | Cú nói | Thao tác / điều kiện tiếp |
|---|---|---|---|
| F01 | `finale-thesis` | “Đọc câu kết ở đây: khi năng lực sản xuất tiếp tục đổi, quan hệ sản xuất cũng cần được xem xét và điều chỉnh cho phù hợp. Bạn có thể quay lại các phần để thử thêm.” | Scene 08, đọc; không overlay mạnh làm mất adaptive loop. |
| F02 | `finale-lab` | “Bấm Thử lại Lab nếu bạn muốn đổi các thanh một lần nữa. Nếu chỉ muốn xem tiếp hướng dẫn, bấm Tiếp tục. Bạn luôn có thể gọi mình từ hình cú.” | Giới thiệu CTA; full route không tự rời finale nếu user chỉ Next. |
| F03 | `finale-source` | “Bấm Xem nguồn để đọc cơ sở lý luận và tư liệu của triển lãm. Bạn có thể kiểm tra sau khi trải nghiệm; đóng bảng để quay lại đây.” | Cue trong SourceDrawer nếu user mở, rồi đóng về finale. |
| F04 | `finale-game` | “Bấm Chơi minigame để ôn tập qua năm giai đoạn, năm boss và 77 câu hỏi. Mình sẽ chỉ cách chơi trước khi bạn chạy. Chưa muốn chơi thì bỏ qua phần này nhé.” | User chọn mở game; parent tour handoff, không overlay phía sau dialog. |

### Phần H — Minigame: 10 bước

| ID | Đích trong iframe | Cú nói | Thao tác / điều kiện tiếp |
|---|---|---|---|
| G01 | `game-start` | “Mình sẽ chỉ bạn cách điều khiển trước. Khi hướng dẫn xong, bấm Bắt đầu hành trình để chơi. Bạn cũng có thể bỏ qua hướng dẫn và bắt đầu ngay.” | Child ready + Driver IIFE tải; game ready/paused; không auto bắt đầu campaign. |
| G02 | `game-jump` | “Giữ Space hoặc phím ↑ để nhảy xa; thả sớm để nhảy thấp. Trên điện thoại, giữ nút Nhảy. Bạn thử ở đây nhé; phần tập không tính điểm và không mất tim.” | Tập nhảy không spawn vật cản, không tính điểm/mất tim; target touch button hoặc keyboard legend. |
| G03 | `game-duck` | “Giữ phím ↓ hoặc nút Cúi trên điện thoại để cúi. Khi đang trên không, thao tác này giúp hạ nhanh. Bạn thử rồi thả ra để đứng lại nhé.” | Tập input riêng; trả trạng thái trước tập; không advance khi mới pointerdown rồi cancel. |
| G04 | `game-pause` | “Bấm P hoặc nút Tạm dừng để nghỉ. Bấm Tiếp tục khi muốn chạy lại. Trong lúc mình hướng dẫn, game cũng dừng để bạn có thời gian đọc.” | Child practice/bridge; guide pause khác game pause; kết thúc tour giữ pause trước đó. |
| G05 | `game-hud` | “Nhìn Quãng đường và Tốc độ để biết lượt chạy đang tiến đến đâu. Thanh Đường đến boss cho biết bạn còn cách cuối giai đoạn bao xa.” | Bước đọc HUD; không dùng điểm game làm tiến độ guide. |
| G06 | `game-hearts` | “Bạn bắt đầu với ba trái tim. Khi vấp vật cản, game dừng và mở câu hỏi. Trả lời đúng giúp bạn giữ tim; hướng dẫn này không làm bạn mất tim.” | Chỉ giải thích; guide không tự trừ tim để minh họa. |
| G07 | `game-quiz-help` | “Chọn một trong bốn đáp án, đọc giải thích rồi bấm Tiếp tục chạy. Trả lời đúng giúp giữ tim. Hình hướng dẫn là tình huống minh họa, không đổi lượt chơi của bạn.” | Giới thiệu bằng cue minh họa được ghi Tình huống minh họa; khi quiz thật xuất hiện chỉ auto cue nếu người dùng còn bật hướng dẫn. Không thay đáp án hoặc đọc key để chơi hộ. |
| G08 | `game-boss-help` | “Khi gặp boss, chọn đáp án đúng để tấn công; trả lời sai thì bị phản công. Nhìn thanh máu và đọc phản hồi sau mỗi câu trước khi chọn tiếp.” | Preview bằng lời/sơ đồ; cue thật xuất hiện lúc boss panel có sẵn, không teleport campaign tới boss. |
| G09 | `game-next-retry-help` | “Hạ boss rồi bấm nút sang giai đoạn tiếp theo. Nếu hết tim, bấm Chơi lại để bắt đầu lượt mới. Chỉ bấm Chơi lại khi bạn muốn bỏ lượt hiện tại nhé.” | Chỉ target next/restart nếu visible; nếu chưa có dùng panel hướng dẫn chữ. User mới được bấm restart. |
| G10 | `game-guide-replay` | “Bấm hình cú trong game khi cần xem lại cách chơi. Bỏ qua hướng dẫn để trở lại lượt hiện tại. Nút Quay lại bài thuyết trình đưa bạn về phần kết của triển lãm.” | Kết thúc child guide; ready giữ ready. Replaying mid-run khôi phục đúng mode/score/lives/HP; Esc guide trước, game sau. |

G07–G09 có preview thông tin trước chơi và hint ở tình huống thật; catalog giữ một ID cho mỗi kỹ năng, không bắt người mới phải chơi hết 5 boss để ‘hoàn thành hướng dẫn’. Nút quay lại bài thuyết trình nằm ở parent toolbar: giải thích bằng cue trong toolbar sau child handoff, không dùng selector iframe để tìm parent node.

**Thứ tự full route đã chốt:** I01–I06 → T01 (Công cụ) → H01–H08 (Atlas) → T02–T05 (máy/tự động hóa/dữ liệu) → L01–L15 → V01–V11 → P01–P11 → F01–F04 → G01–G10. Bảng nhóm theo phần học để replay, không ép đọc đúng thứ tự nhóm khi đường kể chuyện cần T01 trước Atlas. UI hiển thị tên kỹ năng đang học và counter của phần; route lưu cả moduleId/stepId. Khi bỏ qua game, full tour kết thúc phần chính ở F04 và game vẫn mở được riêng.

## 4. Task 1 — Phiên, tiến độ, replay và scroll lease

**Files:** tạo `guideTypes.ts`, `guideProgress.ts`, `guideSession.ts`; sửa nhỏ `WorldTimeline.ts`; tạo ba test progress/session/scroll-leases.

**Interfaces:** `readGuideProgress(storage): GuideProgress`, `writeGuideProgress(storage, progress): boolean`; storage nhận `getItem/setItem`. `createScrollLeases(apply: (locked:boolean)=>void)` trả `acquire(owner:'tour'|'game'|'dialog'):()=>void`, `isLocked():boolean`. Callback apply chỉ chạy khi trạng thái tổng đổi. Mỗi acquire có token riêng, release idempotent. Existing `setTimelineSuspended` giữ wrapper tương thích cho game đến Task 6.

- [ ] Viết test fail dưới đây và fixture default/schema malformed; thêm duplicate/cancel generation, snapshot deep copy và rollback không đổi sound/paused/unlocked.

```js
import assert from 'node:assert/strict';
import { readGuideProgress, writeGuideProgress } from '../src/onboarding/guideProgress.ts';
const forbidden = {getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}};
assert.equal(readGuideProgress(forbidden).status,'new');
assert.equal(writeGuideProgress(forbidden,readGuideProgress(forbidden)),false);
const bad = {getItem(){return '{broken'},setItem(){}};
assert.deepEqual(readGuideProgress(bad).completedModules,[]);
```

```js
import assert from 'node:assert/strict';
import { createScrollLeases } from '../src/onboarding/guideSession.ts';
const changes=[];
const leases=createScrollLeases(value=>changes.push(value));
const tour=leases.acquire('tour'),game=leases.acquire('game');
tour(); tour();
assert.equal(leases.isLocked(),true);
game();
assert.deepEqual(changes,[true,false]);
```

**Chốt vị trí pure helper:** triển khai/export `createScrollLeases` trong `guideSession.ts`; WorldTimeline import helper đó. Không import module timeline có side effect vào Node test.

- [ ] Chạy `node --test tests/guide-progress.test.mjs tests/guide-session.test.mjs tests/scroll-leases.test.mjs`, xác nhận fail vì chưa có implementation.
- [ ] Implement schemaVersion=2, ID allowlist và key `mach-vuon-minh:guide:v2`; migrate key v1 theo spec, deduplicate các mảng ID; getter/setter catch riêng; không lưu index hoặc snapshot mô phỏng vào localStorage. Test skipped không thêm completed, replay hoàn thành xóa skipped của bước, quick không đánh dấu các phần khác hoàn thành.
- [ ] Migration test cụ thể: chỉ v1 hợp lệ; v1 malformed; cả hai key hợp lệ ưu tiên v2; write v2 thất bại vẫn giữ v1; dismissed còn dismissed; in-progress giữ step hợp lệ; stale ID bị lọc. Test skip lại step/module đã completed không thêm skipped; xong bước cuối từng bị skip tính lại module completed và xóa skippedModuleIds.
- [ ] Test Skip ở preparing/presenting/practice/modal/iframe: abort Promise cũ, không hồi sinh overlay, không khóa cuộn, focus về control đúng, không đổi tim/điểm; pause/resume giữ đúng step; skip sau rollback không undo sound/paused/unlocked hoặc dữ liệu trước hướng dẫn.
- [ ] Session giữ snapshot clone arrays, scroll position và era; chỉ khôi phục các trường mô phỏng đã owned. Module lần đầu không relock intro. Run token tăng khi start/cancel; callback cũ phải kiểm token trước mọi mutate.
- [ ] WorldTimeline tính muốn resume từ tổng leases + unlocked + paused; subscription thay đổi paused/unlocked cập nhật lại. Navigation tour dùng `scrollToPosition(... force:true)` hiện có, không một Lenis thứ hai.
- [ ] Callback khóa tổng sở hữu class/body overflow của hướng dẫn, giữ scrollY và restore giá trị CSS trước đó; Lenis.stop chặn smooth input nhưng còn phải kiểm PageDown/touch/native scroll. Không dùng body position fixed làm đổi geometry. Driver không tự sở hữu khóa body; dialog/game giữ owner riêng đến khi thực sự đóng.
- [ ] Chạy ba test + tests history/machine hiện có, `npm run build`; review diff rồi commit task khi các kiểm tra qua.

**Nghiệm thu:** đóng tour trong game không resume cuộn; storage hỏng không crash; replay không mất thiết lập sound hoặc game.

## 5. Task 2 — Asset cú, welcome và dock

**Files:** `OwlMascot.tsx`, `GuideDock.tsx`, `GuideCue.tsx`, `guide.css`; bộ pose `public/guide/owl-*.webp` và manifest `public/guide/owl-assets.json` đã chuẩn bị; registry/credits. Provider/session từ Task 1 cung cấp progress và module.

**Interfaces:** `OwlMascot({pose:GuideStep['pose'],reduced:boolean,paused:boolean})`; `GuideDock({onStart,onResume,onHide,currentModule})`; mọi callback vào controller, không tự gọi goToScene rải rác. Dock dùng owl-dock.webp; loading/error/paused dùng neutral không motion.

- [ ] Dùng trực tiếp các asset gốc đã generate theo hướng 01: neutral, point-left/right, inspect, practice, confirm, bye; không cắt concept sheet hoặc giả PNG là SVG có rig. Khung img giữ nguyên kích thước/aspect/contain giữa pose để không nhảy layout; preload chỉ pose hiện tại và kế tiếp. Pose còn tải dùng neutral, không để blank.
- [ ] Dùng motion theo spec và catalog từng bước; GSAP context/revert trên unmount và reduced/paused đổi. Đây là ảnh tĩnh: crossfade/translate/nod áp dụng cả ảnh trong wrapper riêng; không hứa cánh, mắt hoặc kính chuyển động độc lập. Không animate outer layout của popup. Xem lại nếu có yêu cầu rig sau này, không cần thêm SVG để chạy bản này.
- [ ] Welcome có 3 lựa chọn đúng copy I01 và nút chữ Bỏ qua hướng dẫn; auto condition từ progress và critical intro readiness. Ready quá 5 giây thì guide chữ vẫn mở được qua dock; không cản nút intro. Preparing cue luôn giữ Skip clickable bên ngoài footer đang disabled Next.
- [ ] Dock chứa Continue/current module/restart/danh sách 8 phần/ẩn; thêm entry tương đương trong SourceDrawer menu.
- [ ] Kiểm tra 40px, 64px, 96px, nền sáng/tối và 390×844: kính nhận ra, scarf đọc được, không che cue hoặc joystick game. Không dùng test chỉ kiểm tên file; kiểm manifest/hash, alpha, kích thước thật và screenshot.
- [ ] Build, kiểm lint/diff theo repo, commit. Payload art đọc manifest đo từ WebP đã xuất; welcome tải dock+neutral trước, pose khác lazy. Nếu vượt budget tối ưu encode/resolution và kiểm lại kính/khăn ở kích thước thật.

**Nghiệm thu:** người mới nhận ra cú, mọi lựa chọn welcome dùng được; ẩn vẫn gọi lại được từ mục lục; reduced không còn idle motion.

## 6. Task 3 — Driver controller và readiness

**Files:** package/lockfile; `guideController.ts`, `guideTargets.ts`, `GuideProvider.tsx`, `GuidePopover.tsx`, `guideCatalog.ts`; adapters trong Experience.

**Interfaces:** controller ở mục 2. `prepare` phải trả một HTMLElement visible hoặc lỗi có loại `missing-target`, `timeout`, `cancelled`. Không trả hidden sentinel.

- [ ] Cài `npm install --save-exact driver.js@1.8.0`. Kiểm actual typings; main import factory và CSS chính thức; lazy import module guide khi cần.
- [ ] Viết test session cho double Next → một transition; Next→Cancel trong pending promise → không highlight/mutate khi promise resolve; StrictMode start-cleanup-start → một owner/observer.
- [ ] Chuẩn bị bước bằng callback thật: `goToScene`/`goToHistory`, era/case cần thiết; đợi context state, target connected, computed visibility, bounds trong viewport và ổn định 2 frame. Abort/deadline chung 5 giây.
- [ ] Resolve duplicate mobile/desktop qua visibility + context; map 3D proxy tới vùng đang nhìn. Layout changes dùng ResizeObserver scoped target/popover + resize; schedule refresh một RAF, không loop toàn trang.
- [ ] Tạo Driver với cấu hình khởi điểm sau; các giá trị controller/view trong mẫu là interface đã nêu, phần render được gắn trong Provider.

```ts
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

// controller implements GuideController; no per-frame state here.
const tour = driver({
  animate: !reduced && !paused,
  duration: reduced || paused ? 0 : 280,
  smoothScroll: false,             // WorldTimeline owns navigation
  allowScroll: true,              // project-owned leases govern scroll
  allowKeyboardControl: false,    // avoid range/history/game arrow collision
  allowClose: true,
  disableActiveInteraction: false,
  advanceOnClick: false,          // app state confirms action completion
  waitForElement: 5000,
  skipMissingElement: false,
  overlayColor: '#171512',
  overlayOpacity: 0.36,
  stagePadding: 8,
  stageRadius: 8,
  popoverClass: 'mach-guide',
  nextBtnText: 'Tiếp tục',
  prevBtnText: 'Quay lại',
  doneBtnText: 'Xong phần này',
  onNextClick: () => { void controller.next(); },
  onPrevClick: () => { void controller.back(); },
  onCloseClick: () => { void controller.cancel(); },
  onDoneClick: () => { void controller.finish(); },
});

// Nút chữ bổ sung trong portal/cue, không giả là native button của Driver.
// Luôn enabled, kể cả lúc Next đang chờ prepare.
// <button onClick={() => void controller.skip('guide')}>Bỏ qua hướng dẫn</button>
```

All controller methods xử lý rejection nội bộ và đưa fallback cue; không để unhandled Promise. Dùng `setSteps`/`drive(index)` cho module hiện tại sau prepare; index chỉ sống trong run, ID mới được persist. Khi chuyển practice/modal, teardown layer với reason `handoff`; `onDestroyed` dọn view mà không đánh dấu tour cancelled. Khi cancel thật, abort trước rồi destroy. Hook `onDestroyStarted` nếu dùng phải kết thúc bằng destroy; `onDeselected` không dùng index như bước cũ vì nó có thể trỏ bước đích.

**Hợp đồng teardown bắt buộc:** finish/cancel/skip-guide/pause đều invalidate run token rồi abort preparation/practice; tắt cue, observer, tween và listener; gọi `closeOwnedModal()` cho modal guide mở; kết thúc child practice/guide nếu còn reachable; gọi rõ `ownedDriver.destroy()` trong finally, release đúng lease tour và trả focus. Từng cleanup có finally riêng: một lỗi không được chặn bước dọn tiếp theo. Sau cleanup mới persist đúng kết quả; chỉ finish không có bước skip mới ghi completed tương ứng. Cancel/pause/skip không thêm completed. Không dựa vào automatic teardown vì `onDoneClick` đã thay nó. Cleanup/release idempotent; handoff chỉ dọn layer Driver, chưa release ngữ cảnh tour. Test từng đường khi cleanup/modal-close báo lỗi vẫn không còn guide overlay hoặc tour lease; lease dialog do user sở hữu vẫn giữ cho tới khi dialog thực sự đóng.
- [ ] Trong practice có Skip riêng ngoài vùng drag và đường thả. Skip giữa pointer capture phải kết thúc gesture/cancel demo bằng adapter, rồi trả input state gốc; không chặn việc bấm Skip bằng overlay hoặc isTransitioning.
- [ ] Tab bị ẩn: freeze deadline theo thời gian visible và dừng tween; hiện lại re-resolve target qua 2 frame rồi tiếp tục nếu user chưa pause/skip. Pagehide/unmount teardown đồng bộ phần layer/lease, lưu ID đang học là in-progress; không ghi skipped/completed và không tự phát motion lúc quay lại.

- [ ] `onPopoverRender` gắn host React portal vào inner wrapper; cleanup portal trước khi DOM Driver bị bỏ. Title/body chỉ từ catalog nội bộ, không đưa raw text lấy từ website hay query string vào innerHTML.
- [ ] Test UI: scene chuyển 3 lần, modal handoff rồi cancel, asset lỗi và target missing → thông báo Thử lại/Bỏ qua/Chữ; sau cleanup không `.driver-overlay`/popover còn sót.
- [ ] Build + test session; commit task. Nghiệm thu bằng hai bước thật (intro và Lab), không chỉ một selector demo luôn nằm trên màn hình.

## 7. Task 4 — Intro, Atlas và các cảnh sản xuất

**Files:** Experience, HistoryBridge, MachineChapter, SourceDrawer; catalog I/H/T và adapters; tests session nếu thêm transition.

**Interfaces:** thêm callback readiness/modal handoff trong component liên quan; adapter vẫn gọi control handler gốc. `data-guide` theo catalog; các stepEra/openInspection/openSource hiện có được nối qua callback nhỏ, không simulate click bằng selector text.

- [ ] Gắn I01–I06, H01–H08 và T01–T05; dùng đúng scene 0/1/history/2/3/4. Không thêm control máy ảo để phục vụ tour.
- [ ] Khi target intro bị unmount sau unlock: hủy view cũ trước, chờ next-cue mount rồi drive. Test chạm/drag/Enter; Esc giữa drag không để `timeline.dragging` mắc kẹt.
- [ ] History keyboard guard bỏ qua phím scene khi phase presenting; trong practice cho input/lens điều khiển gốc. Tour không tranh xử lý Escape với zoom dialog.
- [ ] H05 dựa trên hook audio trạng thái thật; không đòi nghe tiếng mới được Next. H06/H07 dừng Driver, đưa cue vào dialog và restore đúng focus.
- [ ] Test 8 era cho caption/source đúng, mốc đầu/cuối disabled, âm on/off; desktop lens và mobile zoom; resize 899↔900 ở H06 rồi Back/Cancel.
- [ ] Kiểm main route machine caption và single canvas còn nguyên; test history/machine/audio hiện có + build, commit task.

**Nghiệm thu:** người mới mở được Atlas, tới mốc, soi ảnh và đối chiếu tư liệu; tour luôn chỉ vào đúng control nhìn thấy được.

## 8. Task 5 — Lab, Việt Nam và chính sách

**Files:** LabControls/VietnamEvidence/PolicyChamber/SourceDrawer; catalog L/V/P; session snapshot và cue.

**Interfaces:** `practice` subscribe control state với run token, không ghi log slider mỗi frame. Demo snapshot chỉ chứa automation, forces, relations, evidenceCase/evidenceLens/farmStage, slots và vị trí; không restore sound/paused/unlocked. `reconfigure` có handling để kết thúc animation demo trước rollback.

- [ ] Gắn 15 bước Lab, 11 Việt Nam, 11 policy. Đích control dùng ID có nghĩa; sliders theo label cố định, token theo slug cố định, socket theo ID vị trí.
- [ ] Practice range teardown Driver; bắt native change+pointerup hoặc keyup để xác nhận; nút Đã thử vẫn cần có. Tab/Arrow không chuyển tour. Sau xác nhận chờ người dùng đọc phản hồi rồi tiếp tục.
- [ ] Policy practice không spotlight chỉ một token khi cần drag qua socket. Cue nằm ngoài drop-zone, scroll lease giữ scene; capture/move/up/cancel gốc không bị overlay chặn.
- [ ] Result chỉ highlight sau `slots.every(x!==null)`; nếu bị user tháo trong lúc chuẩn bị, quay lại cue P09 thay vì đợi target vô hạn.
- [ ] Case Nhà máy/Kinh tế số mới có relation controls. V06–V08 luôn chuẩn bị case=1 trước; V09 đổi case rồi re-resolve. Map/source native handoff theo đúng nút khởi phát.
- [ ] Test snapshot: cancel sau preset ahead và token install → restore arrays/slots, giữ sound/paused. Chọn Giữ lượt thử → giữ arrays/slots. Replaying phần không đổi context âm ngầm.
- [ ] UI test đủ 8 sliders và 7 tokens; click/tap/keyboard cho install/remove; drag ngoài rồi pointercancel; source case đúng; zoom bản đồ/đóng đúng focus.
- [ ] Existing model tests, guide-session tests và build; commit task.

**Nghiệm thu:** làm thật được bài thử Lab và chọn 3 đòn bẩy; cú chỉ cách đọc đánh đổi thay vì trình bày một đáp án thắng.

## 9. Task 6 — Game guide trong iframe

**Files:** copy-driver-assets script/package build script; public vendor; `game-guide.js`; MiniGame/gameDocument/game.html/game.js; G01–G10; test game-guide.

**Interfaces:** script asset vendor versioned `/vendor/driver/1.8.0/driver.js.iife.js`; global factory `window.driver.js.driver`. Bridge trong closure game expose các method cố định `pauseForGuide()`, `beginGuidePractice('jump'|'duck')`, `endGuidePractice()`, `releaseGuidePause()`. Không expose chỉnh điểm, bỏ boss hoặc đáp án. Parent-frame message envelope `{type, nonce}` trong allowlist `guide:ready`, `guide:start`, `guide:cancel`, `guide:done`, `guide:closed`.

- [ ] Viết test fail: guide pause rồi cancel giữ mode đã paused; ready vẫn ready; jump/duck practice giữ nguyên score/hearts/stage/bossHP; message sai frame/nonce/type không kích hoạt tour.
- [ ] Copy distribution từ pinned package: `dist/driver.js.iife.js`, `dist/driver.css`, `license`; npm prebuild gọi script trước vite build. Script fail rõ nếu package version khác 1.8.0 hoặc file thiếu. Giữ MIT notice/checksum; không import IIFE qua export không có, không CDN.
- [ ] `gameDocument.ts` dùng BASE_URL để tạo đường script/CSS/mascot; đưa game-guide raw script sau gameScript. Runtime chỉ tải Driver khi child guide được mở; script load/error có deadline/fallback chữ.
- [ ] Parent hủy Driver trước showModal game, acquire game lease riêng. Child gửi ready sau listeners được gắn; parent validate frame/origin/nonce. Origin mong đợi được truyền từ parent, không đọc `location.origin` của srcdoc rồi giả định.
- [ ] Bridge snapshot mode và các field campaign cần giữ. Tập jump/duck chỉ cập nhật bản player practice; không spawn obstacle, không chạy collision, không tick score hoặc đổi bossHP. Renderer 2D hiện có hiển thị TẬP THAO TÁC; khi end restore player/mode và resume chỉ nếu trước guide đang running.
- [ ] Quiz/boss/retry help có preview chữ lúc chưa tồn tại; Driver chỉ trỏ controls thật lúc panel visible. Không đánh dấu thao tác campaign hoàn thành khi xem preview. Hint chỉ tự xuất hiện nếu người dùng vẫn ở guided mode, và tại thời điểm game đã dừng.
- [ ] Child có nút chữ Bỏ qua hướng dẫn luôn visible; parent đang chờ handshake cũng có Skip trong toolbar, gửi cùng cancel protocol. Child skip destroy Driver/cue, end practice, release guide pause, gửi guide:closed; game giữ mở. Parent mirror progress skipped và không gọi close game. Late ready sau skip/unmount bị run token bỏ.
- [ ] Một routine parent teardown nhận mode `guide-only` hoặc `dialog-closed`: dùng guide-only cho handshake timeout/Skip và giữ game lease; dialog-closed dùng cho dialog cancel/close, Quay lại, unmount, iframe reload. Cả hai invalidate token, clear deadline/message listeners, dọn child khi reachable; chỉ dialog-closed release game owner và khôi phục focus/scroll về app, mỗi release đúng một lần. Child pagehide dọn Driver/tween/listeners. Timeout hướng dẫn giữ game chạy được với cách chơi bằng chữ, không tự đóng game.
- [ ] Esc: child guide đóng trước; parent onCancel phân biệt childGuideActive để không đồng thời đóng game. Khi không guide thì Escape giữ hành vi đóng game hiện tại. Click quay lại hủy cả guide/game, dọn đúng owner và trả focus CHƠI MINIGAME.
- [ ] Test bằng browser: start→guide→cancel; paused→guide→done; question→help→close; boss help; touch buttons; close/reopen frame; network lỗi Driver. Kiểm keyboard Space/↑/↓/P, game HUD thật, không dựa vào hook debug để cho qua.
- [ ] Tất cả test minigame hiện có (77 câu, 126 tổ hợp vật cản) + guide-game + build; commit task.

**Nghiệm thu:** helper trong iframe luôn ở trên game đúng document, chỉ hướng dẫn chứ không thay diễn biến/đáp án, đóng được và trở về scene 08 ổn định.

## 10. Task 7 — Mobile, motion và accessibility

**Files:** guide.css/OwlMascot/GuidePopover/guideTargets; các cue trong native dialogs; keyboard scopes.

- [ ] Bố cục desktop dùng vị trí Driver tính và auto-flip; không tween outer position. Mobile chọn top/bottom theo target đang visible; popup quá cao chuyển sang cue sheet có target vẫn nhìn thấy, không cố ép spotlight offscreen.
- [ ] Tính safe area `env(safe-area-inset-bottom)`; footer buttons không bị Safari toolbar/bàn phím che; text 200% còn đọc/đóng được. Không tự đổi độ zoom browser.
- [ ] Driver passive step dùng focus của thư viện, practice dùng control gốc, modal cue là descendant dialog. Thêm title/description liên kết rõ và focus fallback; kiểm bằng keyboard thực và screen reader. Không đặt aria-modal true cho layer còn cho tương tác bên ngoài.
- [ ] Esc xử lý layer cao nhất; không trap Tab ở dock menu sau đóng; hàng slider và buttons có thứ tự hợp lý. Theo WAI-ARIA APG trong spec, đo contrast thật.
- [ ] MatchMedia reduced đổi khi đang tour → kill GSAP context, `setConfig` animate false/duration0, refresh sau layout; giữ step ID. Người dùng pause không bị tour bật motion lại.
- [ ] Chạy matrix 1920/1440/1366/1024/390/360; resize 899↔900, landscape, 200% chữ và slow loading. Lưu screenshots/error counts/layout notes theo step.
- [ ] Build/test một lần sau sửa cuối; commit task.

## 11. Task 8 — Kiểm chứng toàn tuyến và bàn giao release

**Files:** `.studio/qa/owl-guide/REVIEW.md` + report; registry/credits; README hướng dẫn replay.

- [ ] `npm ci`; `node --test tests/*.test.mjs`; `npm run build`. Sửa lỗi ở task sở hữu, rồi chạy lại đúng phần bị ảnh hưởng; không bỏ qua regressions cũ.
- [ ] Walkthrough cả 70 step ID và tất cả entry replay. Mỗi step kiểm target visible/fallback, copy chuẩn, pose/motion đúng, Next/Back/Cancel và Bỏ qua hướng dẫn, focus/layer cleanup. Skip-step/module/guide có test riêng; preview G07–G09 và real encounter ghi riêng. Confirm không phát sau skip, kể cả khi callback cũ đến muộn.
- [ ] Test first visit từ storage sạch; returning completed; returning dismissed; storage denied/malformed; stale step ID; refresh giữa phần; rapid Next/Back; cancel trong preparing; game close khi đang load; main tab hidden rồi quay lại.
- [ ] Chụp các trạng thái welcome, intro practice, Atlas lens, source cue, Lab slider/practice, policy drag/result, game help và replay menu. Ghi số console error, overlay còn sót, scroll drift; yêu cầu đều 0.
- [ ] Đo payload lazy/art/observer và FPS trên thiết bị có mô tả rõ. Không suy ra FPS từ screenshot; nếu thiếu thiết bị Safari/iOS phải ghi chưa đo và coi đó là gate còn lại, không tuyên bố tất cả browser qua.
- [ ] 3–5 người mới thử 5 tác vụ trong spec. Ghi task time, chỗ đọc nhầm/không biết bấm gì, và lời họ nói; sửa copy/target gây vướng trước bàn giao.
- [ ] Review cuối: API1.8 đúng, scroll owner không rò, WebP art nhỏ còn rõ, không đổi nội dung lý luận/nguồn/bank câu hỏi; capture preview cuối và build.
- [ ] Bàn giao tour chạy preview + report đạt/chưa đạt trong lượt tích hợp. Yêu cầu hiện tại đã cho phép push tài liệu/asset đã rà; không để checkbox runtime này chặn push đó. Khi release code tour đã được yêu cầu, xác nhận commit Vercel Ready rồi smoke intro/replay/Atlas/Lab/game trên URL production. GitHub/Vercel có thể tự deploy asset chuẩn bị khi main được push; trạng thái deploy không chứng minh tour có trong app.

## 12. Ví dụ người dùng thấy và nghiệm thu cụ thể

**Lần đầu:** cú chào → user chọn Dẫn tôi khám phá → cú chỉ đầu sợi đỏ → user Enter → tour chờ handle biến mất và next-cue xuất hiện → cú chỉ cách đi tiếp. Kết thúc intro có lựa chọn đi vào Atlas hoặc tự khám phá.

**Lab:** “Thử kéo Công nghệ” → spotlight label → lớp spotlight đóng, cue nhỏ vẫn ở rìa → người dùng Tab tới range, ArrowRight thay giá trị → lõi phản hồi, bước tour giữ nguyên → “Đã thử / Tiếp tục” → cú chỉ thanh Dữ liệu. Xong phần có lựa chọn giữ thiết lập thử hoặc khôi phục.

**Policy:** cú giới thiệu 3 socket → user mở nhánh từng đòn bẩy hoặc bỏ qua → cue thực hành nhỏ → user kéo Kỹ năng số đến socket rồi thêm hai token → result mới xuất hiện → cú giải thích đủ ba dòng → user tháo/thay để so sánh. Không có spotlight chặn đường kéo hoặc tự gắn đáp án hộ.

**Game:** parent tour đóng → native game dialog mở → iframe báo ready → cú trong iframe chỉ phím/nhảy/cúi → tập không ảnh hưởng score/lives → kết thúc vẫn ở màn sẵn sàng → user bấm Start thật. Giữa trận user gọi cú, game pause; khi đóng guide chỉ resume nếu trước đó game đang chạy.

**Replay:** đang ở mốc lịch sử 06 → bấm cú → Hướng dẫn phần đang xem → H01 có thể được bỏ qua vì đang ở Atlas, nhưng H02–H07 dùng đúng mốc đang thấy → user đóng guide → source/lens/timer sạch, focus trả launcher, âm thanh và motion preference giữ nguyên. Replay từ đầu được chọn riêng, không xảy ra do nhấn nhầm dock.

## 13. Thứ tự và cổng chất lượng

| Mốc | Task | Bằng chứng trước khi sang mốc tiếp |
|---|---|---|
| Nền ổn định | 1–3 | Progress/owner/cancel tests qua; welcome + hai target thật chạy; cleanup sạch. |
| Hành trình chính | 4–5 | Intro/Atlas/production/Lab/Vietnam/policy dùng thật bằng pointer và keyboard. |
| Game độc lập | 6 | Guide trong iframe không đổi campaign, mọi close path trả đúng scene/focus. |
| Bản hoàn chỉnh | 7–8 | Mobile/reduced/a11y matrix, 70 step review, usability và build/report qua. |

Ước lượng ban đầu: 3–5 ngày làm việc tập trung cho một người, gồm tích hợp, kiểm tra và sửa vướng mắc; không phải lịch cam kết. Bộ ảnh đã chuẩn bị ở lượt rà kế hoạch, còn cần kiểm art trong UI thật. Làm preview nền+intro trước để đánh giá cảm giác cú và timing; sau đó triển khai toàn bộ scope. Chỉ gọi “đã xong toàn bộ” khi cả 8 phần và matrix nghiệm thu hoàn thành.

## Self-review của bản kế hoạch

- Đủ 8 phần và 70 ID, có copy/target/action, không chỉ danh sách tính năng.
- Đã phân biệt target mới và DOM hiện có; không hứa highlight mesh hoặc xuyên iframe bằng Driver cha.
- Đã ghi motion/timing, mobile, quyền dùng tài nguyên, storage, replay và đường lỗi.
- Có task/kiểm tra cho cả 5 Review Focus, cùng build và 10 test baseline.
- Tài liệu, catalog lời dẫn 70 bước và bộ ảnh là đầu ra của lượt rà trước push; tích hợp Driver.js/React/game là đầu ra của lượt thực thi tiếp theo. Asset public đã sẵn sàng, chưa có runtime import.
## 14. Pose và motion từng bước (catalog là nguồn chuẩn)

Câu chữ, action, observe, completion và các biến thể thiết bị/trạng thái đầy đủ trong [catalog](../specs/2026-10-03-owl-guide-copy.json). `point-right` được resolve sang `point-left` nếu target nằm phía trái. Tất cả timing là token ở catalog; reduced/paused hoặc lỗi tải pose → `none`. Confirm là phản hồi sau thao tác, không dùng làm pose đọc và không phát khi skip.

| ID | Tư thế khi giải thích | Motion | Chỗ người dùng cần nhìn |
|---|---|---|---|
| I01 | neutral | welcome | Lựa chọn của bạn quyết định cách bắt đầu. |
| I02 | practice | practice | Màn mở đầu chuyển sang triển lãm. |
| I03 | point-right | point | Cảnh mới và tên phần xuất hiện. |
| I04 | point-right | point | Danh sách phần mở ra. |
| I05 | neutral | read | Nhãn nút phản ánh lựa chọn. |
| I06 | point-right | point | Các lựa chọn tiếp tục và xem lại. |
| H01 | neutral | read | Tên thời kỳ đổi cùng vị trí đang xem. |
| H02 | point-right | point | Hình và chú thích đúng mốc 02. |
| H03 | point-right | point | Mốc đang xem và chú thích thay đổi. |
| H04 | neutral | read | Phân biệt minh họa với dữ kiện có nguồn. |
| H05 | point-right | point | Trạng thái âm thanh và âm nền nếu thiết bị cho phép. |
| H06 | inspect | inspect | Chi tiết vùng hình được phóng. |
| H07 | inspect | inspect | Tên nguồn, thời gian và liên kết. |
| H08 | point-right | point | Xưởng máy xuất hiện. |
| T01 | neutral | read | Các phương thức lao động trong cảnh. |
| T02 | neutral | read | Chuỗi truyền động trong cảnh hoặc hình tĩnh. |
| T03 | practice | practice | Các vai trò phía trên thay đổi. |
| T04 | neutral | read | Vai trò thay đổi; không suy diễn con người biến mất. |
| T05 | point-right | point | Các nhãn và phần Lab tiếp theo. |
| L01 | neutral | read | Lõi biểu đạt năng lực; cấu trúc đỏ biểu đạt quan hệ. |
| L02 | practice | practice | Lõi và trạng thái. |
| L03 | practice | practice | Lõi và trạng thái; không gán dữ liệu vào định nghĩa cổ điển. |
| L04 | practice | practice | Lõi và trạng thái. |
| L05 | practice | practice | Lõi và trạng thái. |
| L06 | practice | practice | Lõi và trạng thái; phân biệt hai thanh. |
| L07 | neutral | read | Ba mặt đầy đủ; không thang đánh giá đạo đức. |
| L08 | practice | practice | Cấu trúc đỏ và trạng thái. |
| L09 | practice | practice | Cấu trúc đỏ và trạng thái. |
| L10 | practice | practice | Cấu trúc đỏ và trạng thái. |
| L11 | neutral | read | Trạng thái hiện tại, không nhận xét từng frame. |
| L12 | point-right | point | Mức 50 của hai nhóm và trạng thái. |
| L13 | point-right | point | Preset và giải thích hiện tại. |
| L14 | point-right | point | So sánh trạng thái và hình; không chấm đáp án chính trị. |
| L15 | practice | practice | Trạng thái sau reconfigure. |
| V01 | point-right | point | Nội dung Cánh đồng. |
| V02 | point-right | point | FarmStage 0. |
| V03 | point-right | point | FarmStage 1 và nội dung đúng. |
| V04 | point-right | point | FarmStage 2; giải nghĩa HTX trước viết tắt. |
| V05 | point-right | point | Case 1 và ba câu hỏi. |
| V06 | point-right | point | Lens 0 và response. |
| V07 | point-right | point | Lens 1 và response. |
| V08 | point-right | point | Lens 2 và response. |
| V09 | point-right | point | Case 2 và response đúng. |
| V10 | inspect | inspect | Năm, cơ quan, nguồn. |
| V11 | inspect | inspect | Vị trí và legend. |
| P01 | practice | practice | Ba socket và bảy token. |
| P02 | point-right | point | Tên token và phản hồi khi gắn. |
| P03 | point-right | point | Tên token; không khẳng định pháp lý mới. |
| P04 | point-right | point | Tên token và tổ hợp. |
| P05 | point-right | point | Tổ hợp; không nói chính sách cụ thể chưa có nguồn. |
| P06 | point-right | point | Tổ hợp và trade-off sau đủ 3. |
| P07 | point-right | point | Không tự thay token khi click đầy slots. |
| P08 | point-right | point | Ba loại kết quả; không chấm đạo đức. |
| P09 | practice | practice | Kết quả xuất hiện chỉ khi đủ 3. |
| P10 | neutral | read | Strength/missing/tradeoff đúng slots. |
| P11 | practice | practice | Kết quả mới. |
| F01 | neutral | read | Câu kết và vòng chuyển động hiện có. |
| F02 | point-right | point | CTA thật và đường quay lại. |
| F03 | inspect | inspect | SourceDrawer. |
| F04 | point-right | point | Game dialog hoặc kết thúc tuyến chính. |
| G01 | neutral | welcome | Màn sẵn sàng. |
| G02 | practice | practice | Độ cao/độ dài tương ứng giữ/thả. |
| G03 | practice | practice | Player practice cúi/đứng. |
| G04 | point-right | point | Nhãn pause/resume đúng. |
| G05 | neutral | read | Các chỉ số game thật. |
| G06 | neutral | read | Ba tim hoặc lives hiện tại khi replay. |
| G07 | point-right | point | Feedback và continue button. |
| G08 | point-right | point | HP và feedback. |
| G09 | point-right | point | Stage transition hoặc ready mới. |
| G10 | neutral | read | Game mode/focus đúng; score/hearts giữ. |

Biến thể H02/H03: bản tĩnh đổi sang neutral/read, practice vuốt/cuộn; không trỏ arrow group bị ẩn. H06 soi bằng lens desktop hoặc ảnh zoom bản tĩnh; V11 chọn đúng map trigger ở Cánh đồng hoặc Kinh tế số; G07 hết tim dùng Xem kết quả; G09 boss cuối dùng Hoàn thành hành trình. GuideStep bổ sung `variants` có `when/say/action/pose/motion`; resolver chọn theo context thật trước render.

**Nội dung dài trên mobile:** title 1 dòng, body tối đa 40 từ ở bản hiện tại, 16px/1.5. Khi chữ 200% hoặc viewport 360×640 không đủ, cue sheet có vùng body cuộn riêng, footer Skip cố định trong safe area; không thu nhỏ chữ hoặc ẩn target. L01 được chia thành hai đoạn khi render, không thêm bước thứ 71. Những con số này cần kiểm UI trong task 7; tài liệu không tuyên bố đã đo fit.
