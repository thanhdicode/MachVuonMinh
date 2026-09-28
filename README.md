# Mạch Vươn Mình

Triển lãm tương tác về lực lượng sản xuất mới và yêu cầu thích ứng của quan hệ sản xuất ở Việt Nam. Xây bằng React, TypeScript, Vite và một cảnh Three.js/WebGL.

## Chạy tại máy

```sh
npm ci
npm run dev
```

Kiểm tra bản xuất bản:

```sh
node tests/model.test.mjs
node tests/surface.test.mjs
npm run build
npm run preview
```

## Triển khai Vercel

[Bản Production](https://mach-vuon-minh.vercel.app/) đã liên kết với [GitHub repository](https://github.com/thanhdicode/MachVuonMinh). Mỗi lần `git push origin main`, Vercel tự build và cập nhật bản Production; các nhánh khác có bản Preview. `vercel.json` cố định Vite, `npm ci`, `npm run build` và thư mục `dist`. Dự án không cần biến môi trường, GitHub Actions hay deployment token trong repo.

Thiết kế và nội dung: đọc `00_NORTH_STAR.md` đến `07_MASTER_PROMPT_V2.md` theo thứ tự. Nguồn dữ kiện, giới hạn diễn giải và quyền sử dụng tài sản được ghi ở `.studio/ASSET-REGISTRY.md` và `.studio/qa/refinement/REVIEW.md`. Ảnh QA cục bộ không được đưa lên GitHub để repo gọn; mã nguồn và tài sản chạy web vẫn được commit.
