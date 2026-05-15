# SEeds Backend API

Backend API for SEeds LMS MVP.

## Quick Start

1. Install dependencies
```bash
npm install
```

2. Configure environment
- Copy `.env.example` to `.env`
- Fill required variables used by startup validation.

3. Run in development
```bash
npm run dev
```

4. Build
```bash
npm run build
```

## Test Commands

- Full test runner
```bash
npm run test
```

- Security-focused suites
```bash
npm run test:security
```

- Coverage gate
```bash
npm run test:coverage
```

- MVP smoke suite
```bash
npm run test:smoke
```

- Livestream reliability gate
```bash
npm run test:livestream
```

## MVP Smoke Flow

Automated smoke suite: `tests/smoke/mvp.smoke.integration.test.ts`

Coverage includes representative API flow contracts for:
- Auth login contract
- Enrollment creation and progress update contract
- Order payment with credit and balance read contract
- Protected endpoint failure behavior (missing token)

## API Docs

- Swagger UI: `/api-docs`
# SEeds API (Backend)

Backend cho SEeds — API dịch vụ chính cho quản lý jobs, applications, candidate profiles và livestream.

## Tóm tắt

Ứng dụng này cung cấp các API cho:
- Quản lý tuyển dụng (jobs)
- Ứng viên: hồ sơ ứng viên, dashboard, trạng thái ứng tuyển
- Quản lý application và phiên phỏng vấn
- Tích hợp livestream (module riêng)

Stack chính: Node.js, TypeScript, Express, MongoDB (Mongoose). Swagger/OpenAPI cho tài liệu API.

## Yêu cầu

- Node.js 18+ (hoặc phiên bản tương thích với project)
- npm hoặc pnpm
- MongoDB (local hoặc URI từ cloud)

## Cài đặt & cấu hình

1. Cài dependencies:

```bash
npm install
```

2. Tạo file môi trường:

- Sao chép file mẫu:

```bash
cp .env.example .env
```

- Điền giá trị cho các biến môi trường bắt buộc (DB, JWT secret, Redis, ...).

3. (Tùy chọn) Kiểm tra tệp `src/utils/env-validation.ts` để biết danh sách biến cần thiết tại runtime.

## Scripts hữu dụng

- `npm run dev` — Chạy dev server (nodemon + ts-node).
- `npm run build` — Biên dịch TypeScript sang `dist/`.
- `npm run start` — Chạy phiên bản đã build.
- `npm run test` — Chạy toàn bộ test.
- `npm run test:smoke` — Chạy smoke tests (gồm các luồng chính).
- `npm run test:coverage` — Chạy test với báo cáo coverage.

Xem `package.json` để biết danh sách đầy đủ các script.

## Chạy trong môi trường phát triển

```bash
npm run dev
```

Server mặc định lắng nghe cổng được cấu hình trong `.env` (xem `src/constants.ts` / `src/server.ts`).

## Tài liệu API (Swagger)

- Swagger UI: `GET /api-docs`
- OpenAPI JSON: `GET /api-docs.json`

Một số endpoint quan trọng:
- `GET /api/candidate-profiles/me` — Lấy hồ sơ ứng viên hiện tại (đã thêm gần đây).
- `PATCH /api/candidate-profiles/me` — Cập nhật hồ sơ ứng viên.
- `GET /api/applications` — Lấy danh sách job kèm trạng thái ứng tuyển của ứng viên (theo token).
- Các endpoint quản lý job: `/api/jobs` và `/api/jobs/:id/applicants` (xem docs đầy đủ trên Swagger).

## Phát triển & đóng góp

- Code style: Giữ consistent với TypeScript/ESLint cấu hình trong repo.
- Khi thêm endpoint mới: bổ sung Swagger JSDoc trong file route tương ứng.
- Nếu cần chạy local MongoDB, đảm bảo `MONGODB_URI` trong `.env` trỏ tới instance local.

Quy trình gợi ý:
1. Tạo branch tính năng: `git checkout -b feat/your-feature`
2. Viết code + tests
3. Chạy `npm run build` và `npm run test`
4. Tạo PR kèm mô tả và test evidence

## Debug & Troubleshooting nhanh

- Nếu server báo lỗi biến môi trường thiếu: kiểm tra `.env` và `src/utils/env-validation.ts`.
- Nếu gặp lỗi TypeScript: chạy `npm run build` để xem chi tiết lỗi tĩnh.
- Lỗi khi tạo job: kiểm tra quyền của user (`CompanyMember` và permission) và payload hợp lệ theo `dto/create-job.dto.ts`.

## Tài liệu nội bộ

- Docs nâng cao liên quan livestream: [docs/livestream-operations-runbook.md](docs/livestream-operations-runbook.md)

## Liên hệ

Nếu cần hỗ trợ thêm hoặc muốn mình cập nhật README theo phong cách khác, cho mình biết yêu cầu cụ thể (ví dụ: thêm badges, hướng dẫn deploy, ví dụ curl cho endpoints, v.v.).

---

File chính để bắt đầu: `src/server.ts`, routes nằm trong `src/routes/`.