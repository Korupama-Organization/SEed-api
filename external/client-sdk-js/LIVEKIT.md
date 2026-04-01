# LiveKit Local Development Guide

Hướng dẫn khởi chạy LiveKit server và demo app trên máy local.

---

## Yêu cầu

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) đang chạy
- Node.js >= 18
- pnpm (`npm install -g pnpm`)

---

## Bước 1: Khởi động LiveKit Server (Docker)

```powershell
docker run --rm `
  -p 7880:7880 `
  -p 7881:7881 `
  -p 7882:7882/udp `
  -e LIVEKIT_KEYS="devkey: secret" `
  livekit/livekit-server `
  --dev
```

> Server sẽ chạy tại `ws://localhost:7880`  
> API Key: `devkey` | API Secret: `secret`

---

## Bước 2: Tạo Token

Chạy script tạo token (không cần cài thêm gì):

```powershell
node gen-token.mjs <room-name> <identity>

# Ví dụ:
node gen-token.mjs my-room user1
```

Copy **Token** được in ra màn hình.

---

## Bước 3: Khởi động Demo App

```powershell
pnpm install   # chỉ cần chạy lần đầu
pnpm dev
```

Mở trình duyệt tại: **http://localhost:8080/**

---

## Bước 4: Kết nối vào Room

Trong giao diện demo app:

| Trường | Giá trị |
|--------|---------|
| **LiveKit URL** | `ws://localhost:7880` |
| **Token** | *(paste token từ Bước 2)* |

Nhấn **Connect** → Camera/Mic sẽ tự kết nối vào room.

---

## Thông tin cấu hình local

| Thông số | Giá trị |
|----------|---------|
| WebSocket URL | `ws://localhost:7880` |
| API Key | `devkey` |
| API Secret | `secret` |
| Demo App | `http://localhost:8080` |

---

## Cấu hình `.env` cho backend (studuy-api)

Thêm vào file `.env` ở root project:

```env
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
LIVEKIT_TOKEN_TTL=1h
```

---

## Dừng server

Nhấn `Ctrl+C` trong terminal đang chạy Docker để tắt LiveKit server.

> **Lưu ý:** Docker dùng `--rm` nên container sẽ bị xóa tự động sau khi dừng. Chạy lại lệnh Docker ở Bước 1 để khởi động lại.
