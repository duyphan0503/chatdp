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