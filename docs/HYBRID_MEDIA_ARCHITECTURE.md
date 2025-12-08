# Architecture Document: Hybrid P2P & Ephemeral Buffer System

## 1. Tổng quan Kiến trúc (Architectural Overview)

Hệ thống này là một kiến trúc **Hybrid (Lai)** kết hợp giữa **Peer-to-Peer (P2P)** và **Cloud Storage Buffer (Bộ đệm đám mây)** nhằm:

1. Tối ưu chi phí lưu trữ (giới hạn R2 < 10GB).
2. Giảm tải băng thông và CPU trên server.
3. Tăng tính riêng tư (media cư trú ở thiết bị người dùng).

Mục tiêu cốt lõi:

1. **Zero-Storage (Server-Side):**
   - Server **không** lưu binary media dài hạn.
   - Server chỉ giữ **metadata nhỏ** (IDs, hash, kích thước, trạng thái, object key) để điều phối.

2. **Ephemeral Buffer (R2-as-a-Buffer):**
   - Cloud Storage (Cloudflare R2) chỉ đóng vai trò **bộ đệm tạm thời** khi P2P không khả dụng.
   - Mọi object trên R2 đều có **vòng đời hữu hạn**, bị xóa **tự động** hoặc **chủ động**.

3. **Local-First (Client-Side):**
   - Dữ liệu media cuối cùng sẽ cư trú trên thiết bị của người dùng (Local Storage).
   - Mọi lần xem lại/ghi lại nên ưu tiên lấy từ local thay vì tải lại từ server.

4. **Quota-Aware (Không vượt quá 10GB R2):**
   - Kết hợp **Lifecycle Policy** của R2 + **quota & eviction logic trên backend** để đảm bảo tổng size media được quản lý chặt chẽ, **không vượt quá hard limit (ví dụ 10GB)**.

---

## 2. Các thực thể tham gia (Entities)

1. **Client A (Sender):** Thiết bị gửi media.
2. **Client B (Receiver):** Thiết bị nhận media.
3. **Signaling Server (Nest.js):**
   - Điều phối kết nối P2P (Signaling WebRTC).
   - Cấp phát Presigned URL cho R2.
   - Quản lý metadata & trạng thái media, thực thi quota & cleanup.
4. **Ephemeral Storage (Cloudflare R2):**
   - Kho lưu trữ tạm thời với **Lifecycle Policy** tự hủy.
   - Không phải nơi lưu trữ vĩnh viễn.

> **Nguyên tắc:** Server chỉ là **"control plane"** cho media, không là **"data plane"** dài hạn.

---

## 3. Luồng dữ liệu (Data Flow Logic)

Hệ thống hoạt động dựa trên logic quyết định (Decision Logic) sau, ưu tiên **P2P trước**, **Cloud fallback sau**, và luôn tôn trọng **quota R2**.

### Phase 1: Kiểm tra tính sẵn sàng (Presence & Capability Check)

Khi Client A bắt đầu gửi file:

1. Client A gửi yêu cầu kiểm tra trạng thái của Client B lên Server (qua WebSocket / REST):
   - `isOnline`
   - `supportsP2P` (client có WebRTC + data channel hoạt động không).
2. **Điều kiện:**
   - Nếu `Client B == Online` **và** `Socket Connected` **và** `supportsP2P == true`:
     - Chuyển sang **Phase 2 (P2P Attempt)**.
   - Ngược lại:
     - Chuyển sang **Phase 3 (Cloud Relay)** **nếu quota R2 còn đủ**.
     - Nếu quota R2 không đủ: **báo lỗi/quá tải media** cho client A (client tự quyết định retry sau hoặc báo UI).

### Phase 2: Nỗ lực P2P (P2P Attempt) – *Priority High*

Mục tiêu: Truyền file trực tiếp qua WebRTC Data Channel, **không đi qua server** (ngoại trừ signaling).

1. **Signaling:** Server chuyển tiếp các gói tin SDP Offer/Answer và ICE Candidates giữa A và B.
2. **Handshake:** A và B thiết lập kết nối WebRTC.
3. **Transfer:** Dữ liệu binary được stream trực tiếp từ A sang B.
4. **Completion:**
   - Nếu **Success**:
     - Client B lưu file vào Local Storage.
     - Server **chỉ cập nhật metadata** (ví dụ: `media_status = 'completed_local'`, `storage_provider = 'none'`).
     - **Kết thúc quy trình.** (Server không tốn tài nguyên lưu trữ/băng thông cho media).
   - Nếu **Failure** (NAT Traversal fail, timeout, connection lost, hoặc người nhận offline giữa chừng):
     - Server/Client tự động Fallback sang **Phase 3 (Cloud Relay)** **nếu quota R2 cho phép**.

> **Ghi chú:** P2P có thể được thử lại nhiều lần tùy UI, nhưng backend **không bị buộc phải giữ media** nếu P2P thành công.

### Phase 3: Cloud Relay (Cloud Buffer) – *Priority Low (Fallback)*

Mục tiêu: Sử dụng R2 làm bộ đệm trung gian khi P2P thất bại hoặc người nhận Offline, **vẫn bảo vệ quota cho server**.

1. **Quota & Presign (Backend Protection):**
   - Client A yêu cầu **Presigned URL** từ Server.
   - Backend kiểm tra:
     - Tổng size media hiện tại trên R2 (theo DB) + `media_size` sắp upload.
     - Nếu vượt **soft limit** (ví dụ 9GB): backend kích hoạt **eviction (xóa media cũ)** trước khi cấp presign.
     - Nếu sau eviction, vẫn sẽ vượt **hard limit** (10GB): **từ chối cấp Presigned URL** và trả về lỗi quota (client có thể đợi hoặc thử P2P lại khi B online).

2. **Upload:**
   - Nếu quota cho phép:
     - Client A upload file lên Ephemeral Storage (R2) bằng Presigned URL.
     - Server lưu metadata tin nhắn với trạng thái `media_status = 'cloud_stored'` hoặc `pending_download`.
     - Metadata bao gồm: `object_key`, `size`, `mime_type`, `content_id` (hash), `expires_at`, v.v.

3. **Notification:**
   - Server gửi Push Notification / event realtime cho Client B để báo có media mới.

4. **Download & Ack:**
   - Khi Client B online, ứng dụng tự động/tùy user tải file từ R2 về Local Storage.
   - Sau khi tải thành công (Success Write to Disk), Client B gửi tín hiệu **ACK (Acknowledgement)** lên Server: `event: 'media:downloaded_ack'` hoặc REST `POST /media/{id}/accessed`.

5. **Immediate Cleanup (Dọn dẹp tức thì):**
   - Server nhận **ACK** và **xóa object tương ứng trên R2 ngay lập tức** (nếu `storage_provider = 'r2'`).
   - Server cập nhật metadata: `media_status = 'downloaded' | 'cloud_deleted'`, `last_access_at = now()`.
   - Nhờ vậy, dữ liệu trên R2 được giải phóng sớm, tránh tích tụ.

> **Nguyên tắc:** R2 chỉ giữ media **đủ lâu** để đảm bảo người nhận có thể tải, nhưng **không quá lâu** để gây áp lực lên quota.

---

## 4. Cơ chế an toàn (Safety Mechanisms)

Mục tiêu chính: **giảm tối đa rủi ro và chi phí phía server**, đảm bảo **R2 không bao giờ vượt giới hạn 10GB** trong điều kiện bình thường.

### A. Client-Side Resilience (Giảm tải cho server)

- **Local Caching:**
  - Client không bao giờ tải lại file đã tải.
  - File được lưu vĩnh viễn trong Application Document Directory và được quản lý đường dẫn bởi SQLite cục bộ hoặc storage riêng.
- **Retry Logic:**
  - Nếu quá trình tải từ R2 thất bại, Client tự động thử lại (Exponential Backoff) nhưng có giới hạn, tránh spam server.
- **P2P Reuse:**
  - Nếu có nhiều thiết bị cùng user, có thể ưu tiên P2P giữa các thiết bị của chính user đó trước khi fallback về R2 (giảm tải băng thông server/CDN).

### B. Server-Side Cleanup (Safety Net 1 – Ephemeral & TTL)

Ngay cả khi client **không gửi ACK**, server vẫn đảm bảo media không tồn tại vĩnh viễn:

- **R2 Lifecycle Policy (Hard Rule):**
  - Cấu hình trực tiếp trên Cloudflare R2 để tự động xóa mọi object có tuổi thọ **> X giờ (ví dụ 24h) hoặc X ngày (ví dụ 7 ngày)**.
  - Điều này đảm bảo R2 luôn tự làm sạch (Self-cleaning) **ngay cả khi ứng dụng hoặc client bị lỗi**.
- **Metadata TTL:**
  - Backend lưu `expires_at` cho mỗi `Media` và có thể chạy cron để xóa metadata cũ tương ứng với object đã bị R2 xóa, tránh phình DB.

### C. Backend Quota & Eviction (Safety Net 2 – Bảo vệ hard limit 10GB)

Đây là lớp bảo vệ bổ sung nhằm **loại bỏ bất lợi cho server** khi lượng media tăng đột biến:

1. **Soft Limit vs Hard Limit:**
   - **Soft limit** (ví dụ 9GB): khi tổng size media trong DB > soft limit, backend sẽ **chủ động dọn dẹp** media cũ ít dùng.
   - **Hard limit** (ví dụ 10GB): backend **không cấp Presigned URL mới** nếu upload mới chắc chắn vượt quá limit sau khi đã dọn dẹp.

2. **Chiến lược Eviction:**
   - Ưu tiên xóa theo thứ tự:
     1. Media đã hết hạn `expires_at`.
     2. Media có `media_status` đã download xong từ lâu (ít khả năng cần lại).
     3. Media có `last_access_at` cũ nhất (LRU – Least Recently Used).
   - Xóa bao gồm:
     - Gửi lệnh DeleteObject lên R2 với `object_key`.
     - Xóa row metadata trong DB tương ứng.

3. **Quota-aware Presign:**
   - Mọi request presign đều **đi qua check quota**.
   - Nếu sau khi clean-up, vẫn không đủ chỗ cho `media_size` mới:
     - Backend trả lỗi (ví dụ 507 / custom error code).
     - UI/frontend hiển thị thông báo "media storage đang quá tải, thử lại sau hoặc gửi khi người nhận online (P2P)".

Nhờ kết hợp **Lifecycle Policy R2 + backend quota & eviction**, server gần như không bao giờ gặp tình trạng vượt 10GB một cách không kiểm soát.

---

## 5. Tóm tắt trạng thái Media (Media State Machine)

Một Media item sẽ chuyển qua các trạng thái sau (tập trung vào **trách nhiệm server**):

1. `INIT` – Người gửi chọn file (chỉ ở client).
2. `TRANSFERRING_P2P` – Đang cố gắng gửi trực tiếp:
   - Nếu thành công → `COMPLETED_LOCAL` (client lưu file, server ghi nhận metadata tối thiểu, **không lưu R2**).
3. `UPLOADING_CLOUD` – P2P thất bại hoặc không khả dụng, đang đẩy lên R2:
   - Backend đã check quota và cho phép.
4. `CLOUD_STORED` – File nằm trên R2, chờ người nhận:
   - Backend lưu `object_key`, `size`, `expires_at`, `storage_provider = 'r2'`, `media_status = 'cloud_stored'`.
5. `DOWNLOADING` – Người nhận đang tải về:
   - Client B lấy từ R2, backend **không tham gia data path**, chỉ quản lý state.
6. `ACK_SENT` – Người nhận đã tải xong và báo server (`media:downloaded_ack`):
   - Server có thể xóa ngay object trên R2.
7. `CLOUD_DELETED` – Server đã xóa file trên R2:
   - `media_status` cập nhật, `storage_provider` có thể chuyển về `none`.
   - Metadata DB có thể giữ lại một thời gian ngắn cho audit hoặc xoá luôn trong cron.

> **Lưu ý:** Toàn bộ state machine chỉ mô tả **metadata & quyết định backend**. File binary thực tế: hoặc chỉ nằm trên thiết bị A/B, hoặc tạm thời trên R2.

---

## 6. Yêu cầu kỹ thuật cho AI / Backend (Implementation Hints)

### Backend (NestJS + Prisma + Cloudflare R2)

1. **Signaling & Realtime:**
   - Sử dụng WebSocket Gateway (Nest.js) cho signaling WebRTC:
     - Sự kiện: `media:request`, `media:offer`, `media:answer`, `media:candidate`, `media:downloaded_ack`.
   - Có thể reuse hạ tầng signaling của Calls (WebRTC) đã có.

2. **Presign & Storage Adapter:**
   - Sử dụng AWS SDK v3 (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`) cho thao tác với Cloudflare R2.
   - Trừu tượng hóa storage qua interface `MediaStorage` + các implementation:
     - `R2MediaStorage` (S3-compatible, driver = `s3`).
     - `LocalMediaStorage` (chỉ dùng dev / test).
   - Trước khi cấp presign:
     - Gọi hàm check quota + eviction như mô tả ở trên.

3. **Database (Prisma):**
   - Không lưu binary file, chỉ lưu metadata:
     - `id`, `uploader_id`, `conversation_id`, `message_id` (optional).
     - `object_key` (key thực trên R2).
     - `url` (nếu cần trả cho client).
     - `mime_type`, `size`, `content_id` (hash), `storage_provider`.
     - `media_status`, `expires_at`, `last_access_at`.
   - Cần index theo: `conversation_id`, `uploader_id`, `expires_at`, `last_access_at` để eviction nhanh.

4. **Cleanup Workers / Cron:**
   - Cron TTL: xóa metadata media đã hết hạn `expires_at`.
   - Cron quota (safety net): nếu tổng size > soft limit, thực hiện eviction theo chiến lược ở trên.

### Frontend (High-Level Requirements – để team Flutter thực hiện)

> Phần này chỉ mô tả expectation cho frontend, không ràng buộc cụ thể implementation.

- Hỗ trợ WebRTC Data Channel (ví dụ qua `flutter_webrtc`) cho P2P media.
- Sử dụng HTTP client (ví dụ `dio`) để upload/download với Presigned URL.
- Local caching / storage:
  - Lưu media vào thư mục app (Application Document Directory).
  - Quản lý mapping `{content_id → local_path}` bằng SQLite/local DB.
- Thực hiện các event/REST call:
  - Phase 1: kiểm tra online & capability.
  - SEND: request presign (khi cần), upload, gửi metadata message.
  - RECEIVE: tải từ R2, gửi ACK khi lưu local thành công.

---

## 7. Kết luận

Giải pháp Hybrid P2P & Ephemeral Buffer này:

- **Loại bỏ bất lợi cho server** bằng cách:
  - Không lưu binary media dài hạn trên backend.
  - Giới hạn chặt dung lượng R2 thông qua **Lifecycle Policy + quota & eviction logic**.
  - Ưu tiên P2P làm kênh truyền chính, chỉ dùng R2 khi thật sự cần.
- **Tối ưu trải nghiệm người dùng**:
  - Local-First: media được cache trên thiết bị, xem lại nhanh, không phụ thuộc mạng.
  - Tự động fallback: người dùng offline vẫn nhận được media khi lên mạng lại.
- **Dễ mở rộng & kiểm soát chi phí**:
  - Tất cả tài nguyên đắt đỏ (R2 storage, băng thông) đều có **hạn mức rõ ràng**.
  - Backend chỉ đóng vai trò điều phối và kiểm soát, không trở thành "file server" cổ điển.
