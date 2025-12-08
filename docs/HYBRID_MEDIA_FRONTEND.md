# Hướng dẫn Frontend: Hybrid P2P & Ephemeral Media Buffer

Tài liệu này mô tả **hợp đồng giữa frontend (Flutter)** và **backend NestJS** cho phần media theo kiến trúc Hybrid P2P + R2 buffer trong `HYBRID_MEDIA_ARCHITECTURE.md`.

Mục tiêu:

- Ưu tiên **P2P** khi có thể, chỉ dùng **R2 như bộ đệm tạm**.
- Media cuối cùng luôn được cache **local trên thiết bị**.
- Tự động **giải phóng R2 sớm** bằng cách gửi ACK lên backend.

---

## 1. Các khái niệm quan trọng

- **P2P media**: Truyền file trực tiếp qua WebRTC DataChannel giữa 2 client.
- **Cloud buffer (R2)**: Lưu tạm file khi P2P không khả dụng / thất bại.
- **Media metadata (server)**: Backend **không** lưu binary, chỉ lưu:
  - `id`, `uploaderId`, `conversationId`, `messageId`
  - `url`, `mimeType`, `size`, `contentId` (hash)
  - `storageProvider` (`'r2'` hoặc `'none'`), `status`
  - `expiresAt`, `lastAccessAt`, `objectKey`

> Quan trọng: **Client không bao giờ phụ thuộc vĩnh viễn vào R2**. Khi đã tải về và lưu local thành công, hãy gửi ACK để backend xóa file khỏi R2.

---

## 2. Tổng quan luồng media cho frontend

### 2.1. Gửi media (Sender)

1. **Quyết định P2P hay Cloud**
   - Kiểm tra trạng thái người nhận (qua realtime / signaling):
     - `isOnline`
     - `supportsP2P` (có WebRTC + data channel hoạt động không)
   - Nếu `isOnline && supportsP2P == true` → **thử P2P trước**.
   - Ngược lại → **fallback sang Cloud (R2)** bằng cách presign rồi upload.

2. **Trường hợp P2P thành công**
   - Gửi trực tiếp file qua WebRTC DataChannel.
   - Receiver lưu file local.
   - Sender gửi message metadata **không cần R2 URL** (có thể chỉ gửi `contentId`, kích thước, loại, v.v.).
   - Server ghi nhận trạng thái `COMPLETED_LOCAL` (không chiếm R2).

3. **Trường hợp P2P thất bại / không khả dụng**
   - Gọi REST để xin presigned URL:

     ```http
     POST /api/media/presign?fileName=<name>&mime=<mime>&contentLength=<bytes>
     Authorization: Bearer <accessToken>
     ```

     Response (JSON):

     ```json
     {
       "uploadUrl": "https://...",   // URL để upload binary
       "downloadUrl": "https://...", // URL public/CDN để tải (receiver dùng)
       "expiresIn": 300               // giây
     }
     ```

   - Upload file lên `uploadUrl` (HTTP PUT / POST tùy driver, hiện tại là S3-compatible PUT).
   - Sau khi upload OK, gửi **message REST** kèm thông tin media:

     ```http
     POST /api/conversations/{conversationId}/messages
     Authorization: Bearer <accessToken>
     Content-Type: application/json

     {
       "contentType": "image",      // hoặc video/file/voice
       "mediaUrl": "<downloadUrl>",
       "mediaMimeType": "image/png",
       "mediaSize": 123456,
       "contentId": "<hash-content-tùy-client>"
     }
     ```

   - Backend tạo `Message` + `Media` row, set:
     - `storageProvider = 'r2'`
     - `status = 'cloud_stored'`
     - `expiresAt` theo TTL

### 2.2. Nhận media (Receiver)

Khi có message mới (qua REST list hoặc realtime event):

1. Nếu message **chứa media** (`contentType != 'text'` và có `mediaUrl`):
   - Kiểm tra **local cache** theo `contentId` (nếu có):
     - Nếu đã có file local → **dùng luôn**, KHÔNG tải lại.
     - Nếu chưa có → chuyển sang bước 2.

2. **Tải từ R2 (fallback)**
   - Dùng `mediaUrl` (thường là HTTPS public) để tải về bằng HTTP client (`dio`, v.v.).
   - Lưu file vào **Application Document Directory**.
   - Cập nhật local DB mapping: `{ contentId → localPath }` (nếu có `contentId`).

3. **Gửi ACK sau khi lưu local thành công**
   - Gọi REST:

     ```http
     POST /api/media/{mediaId}/accessed
     Authorization: Bearer <accessToken>
     ```

     - `mediaId` là ID của record `Media` tương ứng (backend có thể trả sẵn trong payload message ở bước sau; nếu chưa có, tạm thời lookup bằng thêm API phụ hoặc chờ backend mở rộng).
     - Backend sẽ:
       - Xóa object tương ứng trên R2 (best-effort).
       - Cập nhật metadata:
         - `status = 'cloud_deleted'`
         - `storageProvider = 'none'`
         - `size = 0`
         - `lastAccessAt = now()`

> Nguyên tắc: **Chỉ gửi ACK khi file đã được ghi thành công xuống disk**. Nếu app crash giữa chừng, lần sau login lại có thể tải lại từ R2 (miễn chưa hết TTL / chưa bị eviction).

---

## 3. Hợp đồng API quan trọng cho frontend

### 3.1. Presign upload

**Endpoint:** `POST /api/media/presign`

- **Auth:** JWT Bearer.
- **Query params:**
  - `fileName`: Tên file gốc (dùng build object key).
  - `mime`: MIME type.
  - `contentLength`: Kích thước file (bytes).

- **Response:**

  ```json
  {
    "uploadUrl": "https://...",
    "downloadUrl": "https://...", // receiver dùng URL này
    "expiresIn": 300
  }
  ```

**Frontend cần:**

1. Luôn gửi `contentLength` chính xác để backend check quota đúng.
2. Upload **đúng HTTP method** và header mà SDK yêu cầu (hiện là S3 PUT với `Content-Type`, `Content-Length`).
3. Chỉ sau khi upload thành công mới gửi message metadata.

### 3.2. Gửi message media

**Endpoint:** `POST /api/conversations/{conversationId}/messages`

- **Body (ví dụ image):**

  ```json
  {
    "contentType": "image",
    "mediaUrl": "<downloadUrl-từ-presign>",
    "mediaMimeType": "image/png",
    "mediaSize": 123456,
    "contentId": "<hash-tùy-client>"
  }
  ```

> `contentId` là optional nhưng **rất nên dùng** để map với local cache.

### 3.3. ACK media đã tải xong

**Endpoint:** `POST /api/media/{id}/accessed`

- **Path param:** `id` – `UUID v4` của `Media`.
- **Auth:** JWT Bearer.
- **Response:**

  ```json
  { "status": "ok" }
  ```

- Behavior backend:
  - Chỉ cho phép:
    - Uploader (`uploaderId`), hoặc
    - User là participant trong `conversation` của media.
  - Nếu không đủ quyền → `403 Forbidden`.
  - Nếu hợp lệ:
    - Cập nhật `lastAccessAt`.
    - Nếu `storageProvider === 'r2'`:
      - Xóa object trên R2 (best-effort).
      - Set `status = 'cloud_deleted'`, `storageProvider = 'none'`, `size = 0`.

**Lưu ý cho frontend:**

- ACK có thể được gọi nhiều lần → backend xử lý idempotent phía DB.
- Nếu nhận `403` → client **không nên** retry, mà xem đó là lỗi quyền.
- Nếu nhận `404` (tương lai có thể bật) → hiểu rằng media đã bị dọn, có thể bỏ qua.

---

## 4. Local caching & quản lý storage trên client

### 4.1. Nguyên tắc chung

- **Không tải lại** media đã có local.
- Tối ưu IO và UX:
  - Luôn ưu tiên play/view từ file local trước.
  - Chỉ fallback sang R2 khi **không có** hoặc file local hỏng.

### 4.2. Gợi ý triển khai (Flutter)

- Sử dụng 1 local DB (vd: **sqflite**, **drift**) để lưu mapping:

  ```text
  media_cache(
    content_id TEXT PRIMARY KEY,
    local_path TEXT NOT NULL,
    mime_type TEXT,
    size_bytes INTEGER,
    last_used_at INTEGER (timestamp)
  )
  ```

- Khi nhận message có `contentId`:
  1. Lookup trong `media_cache`.
  2. Nếu có, kiểm tra file tồn tại trên disk.
     - Nếu có → dùng.
     - Nếu không → xóa entry, tải lại từ `mediaUrl`.

- Sau mỗi lần xem/lần play:
  - Cập nhật `last_used_at` để ưu tiên LRU khi cần tự dọn local cache.

> Local eviction policy (xóa cache local) hoàn toàn do app quyết định (vd giới hạn 2–5 GB, dùng LRU).

---

## 5. P2P vs Cloud: khi nào dùng cái nào?

### 5.1. Đề xuất logic phía frontend

1. **Trước khi gửi file**:
   - Hỏi backend / signaling xem peer:
     - Có online không.
     - Có hỗ trợ WebRTC không.

2. **Nếu P2P có thể**:
   - Thử gửi via WebRTC DataChannel.
   - Nếu thành công → **KHÔNG cần upload R2**.
   - Chỉ gửi metadata message (không `mediaUrl`, hoặc có 1 placeholder optional).

3. **Nếu P2P thất bại / timeout**:
   - Gọi `/media/presign` để xin URL.
   - Upload R2 + gửi message như mục 3.2.

> Frontend không cần biết chi tiết quota; nếu bị từ chối presign (507/5xx) thì UI hiển thị: _"media storage đang quá tải, thử lại sau hoặc gửi khi người nhận online"_.

---

## 6. Xử lý lỗi & retry

### 6.1. Upload lên R2 thất bại

- Retry với **exponential backoff**, số lần giới hạn (vd 3 lần).
- Nếu vẫn fail:
  - Cho phép user:
    - Huỷ gửi media.
    - Hoặc thử lại sau.

### 6.2. Download từ R2 thất bại

- Tương tự: retry 2–3 lần với backoff.
- Nếu hết TTL / backend đã evict object:
  - Có thể nhận 404 từ CDN.
  - UI hiển thị: _"Media đã hết hạn trên server"_.

### 6.3. ACK thất bại

- Nếu network lỗi tạm thời:
  - Ghi hàng đợi local (queue) các `mediaId` đã tải xong nhưng chưa ACK.
  - Gửi lại ACK khi có mạng.
- Nếu bị `403` → xóa entry khỏi queue, log để debug (không retry).

---

## 7. Checklist cho team Flutter

1. **Networking:**
   - REST client (dio/http) cho:
     - `/api/media/presign`
     - `/api/conversations/{id}/messages`
     - `/api/media/{id}/accessed`
   - WebSocket / signaling cho P2P.

2. **P2P:**
   - Tích hợp `flutter_webrtc` (hoặc tương đương) cho DataChannel.
   - Tối thiểu: gửi file dạng chunk qua DataChannel.

3. **Local storage:**
   - Module lưu file media vào Application Document Directory.
   - Local DB mapping `contentId → localPath`.

4. **Media player:**
   - LUÔN ưu tiên path local nếu có.

5. **ACK logic:**
   - Sau khi tải từ R2 + lưu local thành công → gọi `POST /api/media/{id}/accessed`.
   - Có cơ chế retry/background queue cho ACK.

6. **Error UX:**
   - Thông báo friendly khi:
     - Upload thất bại.
     - Download thất bại / media đã hết hạn.
     - Bị quota từ chối (presign trả lỗi).

---

Tài liệu này chỉ mô tả **hợp đồng và kỳ vọng**; chi tiết implementation (Bloc, repository, use case) trên Flutter có thể tự do nhưng nên tuân thủ các nguyên tắc:

- Local-first.
- Ưu tiên P2P.
- R2 chỉ là buffer tạm + luôn ACK khi đã tải xong.
