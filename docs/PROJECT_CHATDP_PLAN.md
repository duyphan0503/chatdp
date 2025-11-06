# Dự án: Ứng dụng Messaging (Flutter & Nest.js)

Đây là tài liệu README chính của dự án, mô tả tổng quan, kiến trúc kỹ thuật và lộ trình phát triển cho một ứng dụng nhắn tin, gọi thoại và video call.

## 1. Giới thiệu

Dự án này nhằm mục đích xây dựng một ứng dụng giao tiếp đa nền tảng (iOS, Android) bằng Flutter cho frontend và một hệ thống backend mạnh mẽ, tùy chỉnh bằng Nest.js. Ứng dụng sẽ hỗ trợ đầy đủ các tính năng từ nhắn tin 1-1, chat nhóm, đến gọi thoại và video call.

## 2. Ngăn xếp Công nghệ (Tech Stack)

Hệ thống được thiết kế để có khả năng mở rộng, kiểm soát cao và dễ bảo trì.

| Thành phần | Công nghệ | Chi tiết |
| :--- | :--- | :--- |
| **Frontend (Client)** | **Flutter** | Xây dựng giao diện đa nền tảng. |
| **Quản lý Trạng thái** | **Bloc / Cubit** | Quản lý trạng thái ứng dụng một cách nhất quán và có thể dự đoán được. |
| **Backend (Server)** | **Nest.js (TypeScript)** | Cung cấp RESTful API cho các tác vụ CRUD và logic nghiệp vụ. |
| **Cơ sở dữ liệu** | **PostgreSQL** | Lưu trữ dữ liệu quan hệ (người dùng, tin nhắn, hội thoại...). |
| **Giao tiếp Real-time** | **WebSocket** | Xử lý tin nhắn, trạng thái gõ, trạng thái online... (Tích hợp với Nest.js Gateway). |
| **Kiến trúc** | **Clean Architecture** | Áp dụng cho cả Frontend (Flutter) và Backend (Nest.js) để tách biệt logic. |
| **Voice/Video Call** | **WebRTC** (với SDK hỗ trợ) | Sử dụng SDK bên thứ ba (như **Agora, ZegoCloud**) cho phần xử lý media, nhưng backend của chúng ta (Nest.js) sẽ xử lý *signaling* (báo hiệu cuộc gọi). |

---

## 3. Kiến trúc Dự án (Clean Architecture)

Chúng ta sẽ áp dụng mô hình Clean Architecture cho cả client và server.

### 3.1. Frontend (Flutter)

Flutter sẽ được cấu trúc thành 3 lớp chính:

1.  **Presentation (Giao diện):**
    * **Widgets/Pages:** Các màn hình (UI).
    * **Bloc / Cubit:** Nắm giữ logic UI và quản lý trạng thái của màn hình. Chúng gọi các UseCases từ lớp Domain.

2.  **Domain (Nghiệp vụ):**
    * **Entities:** Các đối tượng nghiệp vụ cốt lõi (ví dụ: `User`, `Message`, `Conversation`).
    * **Repositories (Abstract):** Các định nghĩa (interface) về cách lấy dữ liệu (ví dụ: `AuthRepository`, `MessageRepository`).
    * **UseCases:** Nắm giữ logic nghiệp vụ cụ thể (ví dụ: `SendTextMessageUseCase`, `LoginUseCase`). Đây là cầu nối giữa Presentation và Data.

3.  **Data (Dữ liệu):**
    * **Models:** Các đối tượng DTO (Data Transfer Object) để parse JSON từ API.
    * **Repositories (Implementation):** Triển khai cụ thể của các Repository interface, gọi đến Data Sources.
    * **Data Sources (Remote/Local):**
        * **Remote:** Giao tiếp với RESTful API (sử dụng `http` hoặc `dio`) và WebSocket (sử dụng `web_socket_channel` hoặc `socket_io_client`).
        * **Local:** Lưu trữ dữ liệu cache, cài đặt (sử dụng `shared_preferences` hoặc `hive`).

### 3.2. Backend (Nest.js)

Nest.js đã có cấu trúc module mạnh mẽ, chúng ta sẽ tổ chức nó theo các nguyên tắc của Clean Architecture:

1.  **Controllers (API Layer):** Nhận request (REST) và gọi đến các Services.
2.  **Gateways (WebSocket Layer):** Xử lý các kết nối và sự kiện WebSocket.
3.  **Services (Business Logic Layer):** Tương đương với UseCases. Chứa logic nghiệp vụ chính, điều phối dữ liệu từ các Repositories.
4.  **Repositories (Data Access Layer):** Sử dụng TypeORM hoặc Prisma để tương tác với cơ sở dữ liệu PostgreSQL, trừu tượng hóa các truy vấn SQL.
5.  **Entities/DTOs:** Định nghĩa cấu trúc dữ liệu.

---

## 4. Cấu trúc Cơ sở dữ liệu (PostgreSQL - Sơ bộ)

Đây là một thiết kế sơ bộ cho các bảng chính:

* **`users`**:
    * `id` (UUID, PK)
    * `phone_number` (VARCHAR, UNIQUE)
    * `email` (VARCHAR, UNIQUE)
    * `password_hash` (VARCHAR)
    * `display_name` (VARCHAR)
    * `avatar_url` (VARCHAR)
    * `bio` (TEXT)
    * `created_at`, `updated_at`

* **`conversations`** (Lưu trữ các cuộc hội thoại 1-1 và nhóm):
    * `id` (UUID, PK)
    * `type` (ENUM: 'private', 'group')
    * `group_name` (VARCHAR, NULLABLE)
    * `group_avatar_url` (VARCHAR, NULLABLE)
    * `created_at`, `updated_at`

* **`participants`** (Bảng nối, ai thuộc về cuộc hội thoại nào):
    * `user_id` (FK to `users.id`)
    * `conversation_id` (FK to `conversations.id`)
    * `joined_at`
    * `role` (ENUM: 'admin', 'member') - (Cho chat nhóm)
    * PRIMARY KEY (`user_id`, `conversation_id`)

* **`messages`**:
    * `id` (UUID, PK)
    * `conversation_id` (FK to `conversations.id`)
    * `sender_id` (FK to `users.id`)
    * `content_type` (ENUM: 'text', 'image', 'video', 'file', 'voice')
    * `content` (TEXT)
    * `media_url` (VARCHAR, NULLABLE)
    * `created_at` (TIMESTAMP)

* **`message_status`** (Theo dõi trạng thái "đã xem" của từng người):
    * `message_id` (FK to `messages.id`)
    * `user_id` (FK to `users.id`)
    * `status` (ENUM: 'delivered', 'read')
    * `read_at` (TIMESTAMP)
    * PRIMARY KEY (`message_id`, `user_id`)

* **`friendships`** (Quản lý mối quan hệ):
    * `user_one_id` (FK to `users.id`)
    * `user_two_id` (FK to `users.id`)
    * `status` (ENUM: 'pending', 'accepted', 'blocked')
    * `action_user_id` (ID của người thực hiện hành động)

---

## 5. Định nghĩa API & WebSocket

### 5.1. RESTful API (Nest.js)

* `/auth/register` (POST)
* `/auth/login` (POST)
* `/auth/refresh-token` (POST)
* `/users/me` (GET) - Lấy hồ sơ cá nhân.
* `/users/profile/:id` (GET) - Lấy hồ sơ người khác.
* `/users/profile` (PUT) - Cập nhật hồ sơ.
* `/users/find` (GET) - Tìm kiếm người dùng.
* `/users/contacts/sync` (POST) - Đồng bộ danh bạ.
* `/friends/request` (POST) - Gửi yêu cầu kết bạn.
* `/friends/accept` (POST)
* `/friends/block` (POST)
* `/conversations` (GET) - Lấy danh sách hội thoại.
* `/conversations` (POST) - Tạo hội thoại mới (1-1 hoặc nhóm).
* `/conversations/:id/messages` (GET) - Lấy lịch sử tin nhắn (phân trang).
* `/media/upload` (POST) - Tải lên ảnh/video, trả về URL.

### 5.2. WebSocket Events (Nest.js Gateway)

WebSocket sẽ xử lý các hành động real-time.

**Client gửi lên (Emit):**

* `authenticate` (Gửi JWT token để xác thực WebSocket session).
* `message:send` (Gửi tin nhắn mới - text, media).
* `message:typing:start` (Bắt đầu gõ).
* `message:typing:stop` (Ngừng gõ).
* `message:read` (Báo đã đọc tin nhắn).
* `call:initiate` (Bắt đầu cuộc gọi - gửi thông tin *signaling* cho WebRTC).
* `call:accept` (Chấp nhận cuộc gọi).
* `call:reject` (Từ chối cuộc gọi).
* `call:ice_candidate` (Gửi ICE candidate cho WebRTC).

**Server gửi xuống (Listen):**

* `message:new` (Nhận tin nhắn mới).
* `message:typing:notify` (Thông báo có người đang gõ).
* `message:status:update` (Cập nhật trạng thái tin nhắn - đã nhận, đã đọc).
* `user:status:update` (Cập nhật trạng thái online/offline).
* `call:incoming` (Nhận cuộc gọi đến).
* `call:accepted` (Cuộc gọi được chấp nhận).
* `call:rejected` (Cuộc gọi bị từ chối).
* `call:ice_candidate` (Nhận ICE candidate từ đối phương).
* `exception` (Thông báo lỗi, ví dụ: không thể gửi tin).

---

## 6. Lộ trình Phát triển (Milestones)

Lộ trình này được điều chỉnh theo tech stack đã chọn.

### Giai đoạn 1: MVP Cốt lõi (Nhắn tin 1-1)

Mục tiêu: Người dùng có thể đăng ký, tìm bạn và nhắn tin văn bản 1-1 real-time.

* **Tính năng:**
    * Đăng ký/Đăng nhập (bằng Email/SĐT).
    * Tạo hồ sơ (Tên, Avatar).
    * Tìm kiếm người dùng.
    * Gửi/Chấp nhận kết bạn.
    * Giao diện chat 1-1 (chỉ tin nhắn văn bản).
    * Hiển thị trạng thái Online/Offline.
* **Công nghệ tập trung:**
    * **Flutter:** Cấu trúc Clean Architecture, UI cơ bản, **Bloc/Cubit** cho Auth & Chat, `http` (cho REST), `web_socket_channel` (cho WebSocket).
    * **Nest.js:** Module Auth (JWT), Module User, Module Conversation, WebSocket Gateway, TypeORM với PostgreSQL.

### Giai đoạn 2: Tích hợp Cuộc gọi (Voice & Video)

Mục tiêu: Người dùng có thể thực hiện cuộc gọi 1-1.

* **Tính năng:**
    * Thực hiện cuộc gọi thoại 1-1.
    * Thực hiện cuộc gọi video 1-1.
    * Màn hình cuộc gọi đến (Accept/Decline).
    * Tích hợp Push Notification (FCM/APNS) cho cuộc gọi đến.
* **Công nghệ tập trung:**
    * **Flutter:** Tích hợp SDK (Agora/ZegoCloud), xây dựng UI cuộc gọi, `flutter_bloc` để quản lý trạng thái cuộc gọi.
    * **Nest.js:** Xây dựng logic *signaling* qua WebSocket (truyền tải các sự kiện `call:initiate`, `call:accept`...), tích hợp dịch vụ Push Notification (FCM).

### Giai đoạn 3: Chat Nâng cao & Nhóm (Media & Groups)

Mục tiêu: Làm cho trải nghiệm chat phong phú hơn và hỗ trợ nhóm.

* **Tính năng:**
    * Gửi media (Ảnh, Video) trong chat 1-1.
    * Gửi tin nhắn thoại (Voice Messages).
    * Trạng thái tin nhắn (Đã gửi, Đã xem).
    * Tạo Chat Nhóm.
    * Gửi tin nhắn (Text, Media) trong nhóm.
* **Công nghệ tập trung:**
    * **Flutter:** `image_picker`, `audioplayers`, `file_picker`, cập nhật UI và Bloc để xử lý các loại tin nhắn khác nhau.
    * **Nest.js:** API tải lên media (ví dụ: dùng S3 hoặc lưu trữ local), cập nhật WebSocket logic để xử lý tin nhắn nhóm, mở rộng CSDL cho nhóm.

### Giai đoạn 4: Hoàn thiện & Tính năng "Phổ biến"

Mục tiêu: Đánh bóng ứng dụng và thêm các tính năng giữ chân người dùng.

* **Tính năng:**
    * Tính năng "Stories" (Đăng/Xem tin 24h).
    * Tương tác tin nhắn (Reactions, Reply, Thu hồi).
    * Lịch sử cuộc gọi.
    * Trang Cài đặt hoàn chỉnh.
    * Gửi Stickers, GIFs (Tích hợp GIPHY API).
* **Công nghệ tập trung:**
    * **Flutter:** UI/UX polish, tối ưu hiệu năng `ListView`, tích hợp API bên thứ ba.
    * **Nest.js:** Xây dựng các API mới cho Stories, Reactions, mở rộng CSDL.

### Giai đoạn 5: Mở rộng (Tương lai)
* Cuộc gọi video nhóm.
* Mã hóa đầu cuối (E2EE).

---

## Phụ lục: Phân rã Phase Backend chi tiết

Phần này cụ thể hoá lộ trình ở trên thành các phase triển khai nhỏ, dễ quản lý PR và CI. Các phase tuần tự hoặc có thể song song một phần, tuỳ ưu tiên.

1) Phase 1 — Security Baseline
- ConfigModule.forRoot({ isGlobal: true })
- ThrottlerModule.forRoot + global ThrottlerGuard
- ValidationPipe({ whitelist: true, transform: true }), Helmet, CORS allowlist qua env (CSV hoặc "*")
- Global prefix: /api; endpoint GET /api/healthz
- CI: lint, unit, e2e cơ bản; .env.example

2) Phase 2 — Schema & Persistence
- Postgres + Prisma init; DATABASE_URL; generate/migrate
- Bảng: users, conversations, participants, messages, message_status; indexes cơ bản
- Seed tối thiểu; repository/service base

Tiến độ: ĐÃ HOÀN THÀNH (baseline)
- Prisma schema + migration đã có, repositories + unit tests đã xanh.
- Docker compose Postgres dev: `pnpm --filter @chatdp/backend db:up`
- Prisma generate/migrate/seed:
  - `pnpm --filter @chatdp/backend prisma:generate`
  - `pnpm --filter @chatdp/backend prisma:migrate:dev`
  - `pnpm --filter @chatdp/backend prisma:seed`
- Env mẫu & chiến lược ENV 2-file:
  - Committed: `apps/backend/.env.example` (template, push lên git)
  - Local dev & test: `apps/backend/.env` (dùng chung cho development và test)
  - CI/Prod: thiết lập biến môi trường qua CI/hosting, KHÔNG commit file `.env`

3) Phase 3 — AuthN/Z (JWT + RBAC)
- Hash mật khẩu (argon2/bcrypt), JWT access + refresh (rotation, TTL)
- Guards: JwtAuthGuard, RolesGuard; rate limit riêng cho auth
- E2E: signup/login/refresh; bảo vệ route /me

4) Phase 4 — Messaging Core (REST)
- Conversations CRUD, join/list
- Messages create/list (pagination, desc by createdAt), read receipts
- DTO validation đầy đủ; chống N+1; OpenAPI mô tả endpoint

5) Phase 5 — Realtime/WebSocket
- WS Gateway (auth handshake bằng JWT)
- Sự kiện: message:new, message:read, typing, presence tối thiểu
- Rate limiting WS, chống spam, backpressure cơ bản; room theo conversationId

6) Phase 6 — Observability & Ops
- Logging có cấu trúc, correlationId
- Metrics Prometheus: HTTP, WS, DB latency/throughput
- /metrics, /healthz nâng cao (readiness/liveness)

7) Phase 7 — Hardening & Performance
- Request size limits, upload constraints
- Redis cache cho truy vấn nóng; tối ưu truy vấn + index
- Pen-test checklist, lỗi nhất quán không lộ nội bộ

8) Phase 8 — Calls Signaling (WebRTC)
- WebSocket events: call:initiate, call:accept, call:reject, call:ice_candidate
- JWT auth cho WS signaling; mapping theo userId/conversationId
- Push Notifications (FCM/APNS) cho cuộc gọi đến; trạng thái cuộc gọi cơ bản

9) Phase 9 — Media & Groups Enhancements
- Upload media (S3/MinIO presigned URLs); metadata DB
- Messages nâng cao: reactions, reply/quote, delete/recall
- Nhóm: vai trò admin/member, avatar/tên, quản trị cơ bản
- Seek pagination cho messages

10) Phase 10 — Search/Indexing (tuỳ nhu cầu)
- PostgreSQL Full-Text Search hoặc OpenSearch/Elasticsearch
- Index/search API đồng bộ AuthZ

Tùy chọn: Polyglot Persistence (MongoDB Read Model)
- Mục tiêu: tăng tốc độ đọc timeline tin nhắn dưới tải cao, giữ Postgres là source of truth
- Outbox Pattern trong Postgres cho sự kiện messages; projector/worker sync sang Mongo (idempotent, retry, dead-letter)
- Repository phân tách: Write (Postgres) / Read (Mongo)
- Index Mongo gợi ý: { conversation_id: 1, created_at: -1 }, { sender_id: 1, created_at: -1 }
- Observability: metrics độ trễ projector, backlog outbox; alert khi vượt ngưỡng
- Env: MONGODB_URI, MONGODB_DBNAME

---

## Phụ lục A: Chiến lược ENV (2-file)

Đơn giản hoá để phù hợp team 1-dev:
- Chỉ dùng 2 file cho backend
  - `.env.example`: file hướng dẫn (được commit)
  - `.env`: file local dùng cho cả development và test
- NestJS ConfigModule (EnvConfigModule) nạp theo thứ tự: `apps/backend/.env` → `.env`.
- Không sử dụng `.env.test`. Test runner cũng đọc `.env`.
- .gitignore đã chặn `.env` / `.env.*` toàn repo.

Khuyến nghị:
- Với CI/Prod: dùng biến môi trường runtime (secrets/vars), không đưa `.env` lên repo.
- Nếu cần khác biệt giữa dev/test, có thể override tạm thời bằng cách export env trước khi chạy lệnh (ví dụ: `JWT_SECRET=... pnpm test:backend`).

## Phụ lục B: Refresh Token Binding (UA/IP) & Proxy Awareness

Mục tiêu: Nâng cao bảo mật cho quá trình refresh token bằng cách ràng buộc (bind) refresh token với thiết bị/phiên bản client (User-Agent) và/hoặc địa chỉ IP nguồn. Đồng thời cấu hình server hoạt động đúng phía sau reverse proxy (Nginx/ALB/Cloudflare).

### Cách hoạt động
- Khi signup/login, server phát hành access token + refresh token, đồng thời lưu `userAgent` và `ip` (nếu có) kèm refresh token trong DB.
- Khi gọi `/auth/refresh`, nếu bật binding, server sẽ kiểm tra `User-Agent` và/hoặc `IP` từ request có khớp với giá trị đã lưu cùng refresh token hay không. Không khớp → 401.

### Biến môi trường
- `REFRESH_BIND_UA_IP` (mặc định: `true`): Bật binding cả UA và IP.
- `REFRESH_BIND_UA`, `REFRESH_BIND_IP`: Tuỳ chọn chi tiết. Nếu không đặt, hai biến này kế thừa giá trị từ `REFRESH_BIND_UA_IP`.
- `TRUST_PROXY` (mặc định: `false`): Khi `true`, Express sẽ tin cậy header `X-Forwarded-For` để xác định IP client thực (phải cấu hình proxy đúng chuẩn).

Ví dụ `.env` (backend):
```
# Binding
REFRESH_BIND_UA_IP=true
# REFRESH_BIND_UA=true
# REFRESH_BIND_IP=true

# Proxy
TRUST_PROXY=true  # BẬT trong môi trường có reverse proxy
```

### Khuyến nghị (phương án tối ưu)
- Giữ `REFRESH_BIND_UA_IP=true` trong production để tăng bảo mật; nếu có vấn đề IP thay đổi thường xuyên (mạng di động/NAT), có thể tách:
  - `REFRESH_BIND_UA=true` và `REFRESH_BIND_IP=false` để chỉ bind theo `User-Agent`.
- Trong môi trường production phía sau reverse proxy (Nginx/ALB/Cloudflare): BẬT `TRUST_PROXY=true` và cấu hình proxy truyền đúng IP client qua `X-Forwarded-For`.
- Trong môi trường local/dev không có proxy: ĐỂ `TRUST_PROXY=false`.

### Cấu hình Nginx mẫu
```
# Nginx ở trước ứng dụng NestJS
# Thiết lập IP thực từ mạng nội bộ/LB (chỉnh lại CIDR theo hạ tầng của bạn)
set_real_ip_from 10.0.0.0/8;
set_real_ip_from 172.16.0.0/12;
set_real_ip_from 192.168.0.0/16;
real_ip_header X-Forwarded-For;
real_ip_recursive on;

server {
  listen 80;
  server_name your.domain;

  location / {
    proxy_pass http://backend:3000; # container/service NestJS

    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

### Cloudflare (khuyến nghị cho bạn)
- BẬT `TRUST_PROXY=true` trong backend.
- Cloudflare sẽ gửi IP client thật qua `CF-Connecting-IP`; code đã ưu tiên đọc `cf-connecting-ip` và `true-client-ip`, sau đó mới `x-forwarded-for`.
- Bật “Authenticated Origin Pulls” nếu có thể, và giới hạn firewall/chỉ chấp nhận traffic từ dải IP Cloudflare đến origin.
- Tại Cloudflare:
  - SSL/TLS mode: Full (strict) nếu có chứng chỉ hợp lệ ở origin.
  - Transform Rules/Rulesets: không ghi đè `User-Agent`, bảo toàn header.
  - Ensure Brotli/Compression không ảnh hưởng header; HTTP/2/3 OK.
- Trên origin (Nginx nếu có): không cần sửa đặc biệt; chỉ cần pass-through, không ghi đè IP.

Lưu ý:
- Chỉ bật `TRUST_PROXY=true` khi bạn kiểm soát reverse proxy/CDN và đã cấu hình forwarding đúng. Nếu không, header `X-Forwarded-For` có thể bị giả mạo.
- OpenAPI đã mô tả rằng `/auth/refresh` có thể yêu cầu giữ nguyên `User-Agent` và IP theo cấu hình server.

### Ảnh hưởng phía Client
- Client cần giữ nguyên `User-Agent` giữa các lần gọi `refresh` (mặc định UA/IP đều được bind). Trên mobile, UA thường ổn định; trên web, tránh thay đổi UA tùy ý.
- Khi có proxy/CDN, bảo đảm chúng bảo tồn header `User-Agent` và truyền `X-Forwarded-For` đúng IP client.
