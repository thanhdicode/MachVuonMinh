# Scene 02 — Sổ tay Việt Nam Implementation Plan

**Goal:** Replace the rejected V5 scene with MengTo's actual Sketchbook design and motion, using newly generated Vietnamese illustrations and clear Idea 7 content.
**Architecture:** Preserve the original HTML/CSS/JavaScript in a local document, isolated from the host with the same iframe boundary used by ThreeUI. A small React adapter handles parent scrolling, source drawer and chapter entry/exit. Never recreate page curling in React or Three.js.
**Tech stack:** Existing React/Vite/Lenis; authored DOM/CSS paper engine; generated transparent PNG artwork. No new WebGL context.
**Spec:** User's 2026-10-06 request and attached ThreeUI source manifest. This replaces the earlier V5 design brief.

## Research and decisions

- GitHub clone: MengTo/sketchbook, commit c1e477814c4c9e204452ebf9b298aa13629cbfc2. Read complete authored document and registered ThreeUI frame.
- ThreeUI manifest names canonical hash e0330548b1ac905cf1b81698163ffa29f8a3a8c39b8d39f9b71ba5b9255b6dd1. Served document has a storage-image shim and rewritten URLs, hash 518737cb...; record this honestly rather than asserting byte identity.
- Reference physics: 18 nested strips, span .449, curl .60 radians, springs 170/26 and 150/24, pointer tilt 4.5/7 degrees, zoom .9–1.5, magnifier 2.3x, original riffle tempo and blur. Preserve all.
- Three directions: A) nine independent industry sketches; B) one factory walkthrough; C) a Vietnamese field notebook that connects concrete productive capabilities to economic relationships. Choose C: matches the nine-plate source and teaches the whole topic without inventing a real company.
- Preserve watercolor paper, brass magnifier, botanical atmosphere, original serif hierarchy. Harmonize paper/ink/red accents with host. Serif exception is explicitly requested by the user through the reference.
- Original repository describes itself as open source but has no LICENSE file at inspected revision. Retain attribution and record this uncertainty; do not invent an MIT license.

## Content plan / nine plates

Logical reading order starts at original landing index 6 and wraps; keep LAND=6 and the original riffle intact.

1. Việt Nam đang sản xuất khác đi: panorama of Vietnamese production, farms, port and skilled work. Caption: “Công nghệ, dữ liệu và kỹ năng đang mở ra những cách sản xuất mới.”
2. Người lao động học cách làm mới: technician learning to operate precision machinery. Caption: “Đầu tư máy móc cần đi cùng đào tạo người vận hành, kiểm tra và xử lý lỗi.”
3. Máy móc có thêm khả năng: machine vision inspection and operator. Caption: “Cảm biến và AI có thể hỗ trợ phát hiện lỗi, dự báo bảo trì và điều chỉnh quy trình.”
4. Dữ liệu nối các công đoạn: farm-to-packhouse-to-port with shared information. Caption: “Thông tin về nguyên liệu, đơn hàng và chất lượng giúp các khâu phối hợp với nhau.”
5. Đó là lực lượng sản xuất mới: people and their tools in a contemporary workshop. Caption: “Người lao động và tư liệu sản xuất tạo nên lực lượng sản xuất; khoa học và công nghệ làm thay đổi năng lực ấy.”
6. Ai được sử dụng nguồn lực?: cooperative members sharing smart farm equipment/data. Caption: “Máy móc và dữ liệu cần có quyền sở hữu, quyền sử dụng và trách nhiệm rõ ràng.”
7. Công việc được tổ chức ra sao?: worker, engineer and supervisor planning a process. Caption: “Cần đào tạo lại, phân công nhiệm vụ và xác định trách nhiệm khi đưa công nghệ mới vào làm việc.”
8. Thành quả được chia thế nào?: workers and managers discussing pay, training and reinvestment. Caption: “Khi năng suất tăng, cần xem xét tiền công, lợi ích của người lao động và nguồn lực tái đầu tư.”
9. Muốn vươn mình, cần đổi cùng nhau: connected workshop, school and production cooperative. Caption: “Nâng cấp công nghệ cần đi cùng thay đổi về sở hữu, tổ chức sản xuất và phân phối thành quả.”

Evidence: Nghị quyết 57-NQ/TW (22/12/2024), especially I.1/I.3 and data ownership/use/value; World Bank, Viet Nam 2045 (2024), skills and value chains; ILO GenAI and jobs in Viet Nam (16/04/2026), task exposure and transitions. Generated scenes are conceptual illustrations, not fabricated company reportage. Detailed source/provenance stays in the source drawer.

## Tasks

- [x] Vendor source and manifest, verify binary hashes, retain exact motion engine and CSS; create a deterministic content-only adapter with source-integrity checks.
- [x] Generate nine individual open-book watercolor illustrations preserving reference alpha bounds, gutter and paper footprint. Save prompts/provenance and optimized local assets. Load fonts with Vietnamese coverage.
- [x] Replace only Scene02Chapter/scene02.css. Same `.scene02-insertion`, existing source callback and guide target. Remove V5 media from this render path. Bridge iframe wheel/anchor navigation to parent; lazy mount on approach; original engine renders on demand when idle.
- [x] Localize original title/nav/index/captions; add one short readable explanation per plate. Preserve native curl, drag velocity, magnifier, tilt, zoom and intro. Keep original landing index and cycle; order editorial index logically.
- [ ] Verify source motion fidelity automatically; browser-test page next/previous, partial drag cancellation, full drag, loupe drag/shove, zoom, index jump, parent scroll, source drawer, Scene01→02→03, 1440/1366 laptop and mobile/reduced motion. Build before reporting.

## Review focus

- Vietnamese glyphs must not fall back within words.
- New page alpha/gutter must align with strip geometry.
- Scrolling over the iframe must move the existing journey, never trap visitors.
- Original riffle runs on first scene entry, not while offscreen at initial app load.
- Parent navigation/owl/source overlays remain usable and later chapter files remain unchanged by this task.

## Execution rulings

Execute inline under the user's explicit implementation request, after this research and plan. No extra approval gate or unsolicited delegation. Preserve all pre-existing unrelated working-tree changes. Do not commit/push/deploy.

Verification completed with limits recorded in .studio/qa/scene02-sketchbook/REPORT.md; partial-drag cancellation/global pause not independently verified.
