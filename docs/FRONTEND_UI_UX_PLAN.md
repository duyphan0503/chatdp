# ChatDP Frontend Detailed Plan

This document outlines the detailed plan for the ChatDP Frontend application (Flutter). It aligns with the master project plan (`docs/PROJECT_CHATDP_PLAN.md`) and provides specific technical guidelines, architecture, and workflows for the frontend team.

---

## 1. Tech Stack & Libraries

*   **Framework**: Flutter (Stable channel).
*   **Language**: Dart.
*   **State Management**: `flutter_bloc` (Bloc pattern) & `cubit` (for simpler states).
*   **Dependency Injection**: `get_it` + `injectable`.
*   **Navigation**: `go_router` (Declarative routing).
*   **Networking**:
    *   REST: `dio` (with interceptors for Auth).
    *   WebSocket: `web_socket_channel` or `socket_io_client` (depending on backend implementation).
*   **Local Storage**: `shared_preferences` (simple flags), `hive` or `isar` (offline caching, optional Phase 1).
*   **Media**: `image_picker`, `file_picker`, `cached_network_image`.
*   **Realtime/Calls**: `flutter_webrtc` or SDK wrappers (Agora/Zego) - *Decision pending Phase 2*.
*   **UI Components**: Material 3 (default), using strict theming.

---

## 2. Git Branching Strategy & Workflow

We follow a simplified **Gitflow** or **Trunk-based** workflow suited for the monorepo structure.

### 2.1. Brach Naming Convention

*   **Main Branch**: `main` (Production-ready code).
*   **Development Branch**: `develop` (Integration branch, deployed to staging/dev).
*   **Feature Branches**: `feat/frontend/<feature-name>`
    *   Example: `feat/frontend/auth-screen`, `feat/frontend/chat-ui`.
*   **Bugfix Branches**: `fix/frontend/<issue-description>`
    *   Example: `fix/frontend/login-error-handling`.
*   **Refactor Branches**: `refactor/frontend/<scope>`
*   **Chore**: `chore/frontend/<scope>` (library updates, config).

### 2.2. Workflow Rules

1.  **Strict Branching**: ALWAYS create or checkout the relevant feature/fix branch *before* writing any code. Do not commit directly to `main` or `develop`.
2.  **Branch off** from `develop` for new features.
3.  **Pull Request (PR)** required to merge back to `develop`.
4.  **Naming**: Prefix commits with conventional commits style.
5.  **Review**: At least 1 approval required.
6.  **CI**: Frontend tests (unit/widget) must pass before merge.

### 2.3. Feature Branch Map (UI to Branch Name)

| ID | Screen / Feature Name | Branch Name Strategy | Note |
| :--- | :--- | :--- | :--- |
| **Auth** | | | |
| 1 | Splash / App Bootstrap | `feat/frontend/splash` | Initial setup & token check |
| 2 | Sign In | `feat/frontend/auth-login` | Login screen & logic |
| 3 | Sign Up | `feat/frontend/auth-register` | Registration screen |
| **Core** | | | |
| 4 | Main Shell / Tab Nav | `feat/frontend/main-shell` | Bottom navigation & structure |
| **Chat** | | | |
| 5 | Conversations List | `feat/frontend/chat-list` | History list & realtime updates |
| 6 | Conversation Detail | `feat/frontend/chat-detail` | Main chat view, sending msgs |
| 7 | New Conversation | `feat/frontend/chat-new` | Search user & start chat |
| 8 | Message Search | `feat/frontend/chat-search` | Global & local search |
| 9 | Media Viewer | `feat/frontend/media-viewer` | Fullscreen image/video view |
| **Calls** | | | |
| 10 | Call History | `feat/frontend/call-history` | Recent calls tab |
| 11 | Incoming Call | `feat/frontend/call-incoming` | Pickup/Reject screen |
| 12 | Outgoing Call | `feat/frontend/call-outgoing` | Ringing screen |
| 13 | In-Call Screen | `feat/frontend/call-active` | WebRTC view & controls |
| **Profile** | | | |
| 14 | My Profile | `feat/frontend/profile-view` | View details |
| 15 | Edit Profile | `feat/frontend/profile-edit` | Update form |
| **Settings** | | | |
| 16 | App Settings | `feat/frontend/settings-app` | Notifications, theme |
| 17 | Security Settings | `feat/frontend/settings-account` | Password, sessions |
| **Misc** | | | |
| 18 | Error / Maintenance | `feat/frontend/error-screen` | Generic error states |


---

## 3. Architecture: Clean Architecture

The app is divided into three main layers: **Presentation**, **Domain**, and **Data**.

### 3.1. Folder Structure (`apps/frontend/lib/`)

```
lib/
├── main.dart                  # App entry point
├── app.dart                   # MaterialApp config, Routing, Global Providers
├── core/                      # Global/Shared Core logic
│   ├── config/                # Env vars, Constants
│   ├── network/               # Dio setup, Interceptors, WebSocket client
│   ├── di/                    # Injection setup
│   ├── router/                # GoRouter configuration
│   ├── theme/                 # AppTheme, TextStyles, Colors
│   └── utils/                 # Extensions, Validators, Date formatters
├── features/                  # Feature-based modular structure
│   ├── auth/                  # Feature: Authentication
│   │   ├── data/
│   │   │   ├── datasources/   # RemoteDataSource (API calls)
│   │   │   ├── models/        # DTOs (fromJson/toJson)
│   │   │   └── repositories/  # Repository Implementation
│   │   ├── domain/
│   │   │   ├── entities/      # Core Busines Objects
│   │   │   ├── repositories/  # Repository Interfaces
│   │   │   └── usecases/      # LoginUseCase, RegisterUseCase
│   │   └── presentation/
│   │       ├── bloc/          # AuthBloc
│   │       ├── pages/         # LoginPage, RegisterPage
│   │       └── widgets/       # Local widgets
│   ├── chat/                  # Feature: Chat (List & Detail)
│   ├── contact/               # Feature: Contacts/Friends
│   ├── profile/               # Feature: User Profile
│   └── call/                  # Feature: Voice/Video Call
└── shared/                    # Shared Widgets & UI Components
    ├── widgets/               # Buttons, Inputs, Loaders, Avatars
    └── dialogs/               # Common dialogs
```

---

## 4. Development Phases (Frontend Focused)

### Phase 1: Foundation & Auth (MVP)
*   **Goal**: App Skeleton, Navigation, Authentication.
*   **Tasks**:
    *   [ ] Setup `core` (Dio, DI, Router, Theme).
    *   [ ] Implement **Sign In** UI & Integration (`/auth/login`).
    *   [ ] Implement **Sign Up** UI & Integration (`/auth/register`).
    *   [ ] Save & manage JWT tokens (Secure Storage).
    *   [ ] Splash Screen & Auto-login logic (Check valid token).

### Phase 2: Chat 1-1 Core
*   **Goal**: Users can see conversation list and send text messages.
*   **Tasks**:
    *   [ ] **Conversation List UI**: Fetch & display list from `/conversations`.
    *   [ ] **Chat Detail UI**: Message bubbles (Me vs Other), timestamps.
    *   [ ] **WebSocket Integration**:
        *   Handle `auth` handshake.
        *   Listen to `message:new`.
        *   Emit `conversation:join` / `conversation:leave`.
    *   [ ] **Send Message**: POST API or WS emit.
    *   [ ] Infinite Scroll (Pagination) for message history.

### Phase 3: Contacts & Groups
*   **Goal**: Find friends and create groups.
*   **Tasks**:
    *   [ ] **Contact Search UI**: Search users by email/phone.
    *   [ ] Add Friend / Request Friend flow.
    *   [ ] **Create Group UI**: Select multiple contacts -> Create.
    *   [ ] Group Chat details (Group Name, Avatar).

### Phase 4: Multimedia & Realtime Polish
*   **Goal**: Richer messaging experience.
*   **Tasks**:
    *   [ ] **Media Picker**: Pick Image/Video.
    *   [ ] Upload logic (Pre-signed URL or Direct Multipart).
    *   [ ] Media Viewer Screen (Hero animation).
    *   [ ] Typing Indicators (`typing` event).
    *   [ ] Read Receipts (`message:read` event).

### Phase 5: Voice/Video Calls
*   **Goal**: 1-1 Calls via WebRTC.
*   **Tasks**:
    *   [ ] **Call Screen UI**: Incoming, Outgoing, In-Call.
    *   [ ] **Signaling Integration**: Handle `call:initiate`, `accept`, `reject`.
    *   [ ] WebRTC Stream rendering (Local/Remote).
    *   [ ] Permission handling (Camera/Mic).

---

## 5. UI/UX Design System & Lottie Integration

To ensure a consistent, premium, and unified experience, we define the following Design System.

### 5.1. Color Palette (Theme: "Modern Deep Blue")
*   **Primary**: `#2962FF` (Deep Blue) - Used for primary buttons, active tabs, own message bubbles.
*   **Secondary**: `#00B0FF` (Light Blue) - Used for accents, floating action buttons, gradients.
*   **Background**:
    *   **Light Mode**: `#F5F7FA` (Very light grey/blue tint).
    *   **Dark Mode**: `#121212` (True Black) or `#1E1E1E` (Dark Grey Surface).
*   **Surface**: `#FFFFFF` (White) for cards, dialogs, bottom sheets.
*   **Error**: `#D32F2F` (Red) - Error texts, delete actions, missed calls.
*   **Success**: `#388E3C` (Green) - Online status, success toasts.
*   **Text**:
    *   **Primary**: `#212121` (Almost Black).
    *   **Secondary**: `#757575` (Grey) for timestamps, hints.

### 5.2. Typography
*   **Font Family**: `Inter` (Google Fonts) - Clean, modern, highly readable.
*   **Styles**:
    *   **Display Large** (32sp, Bold): Splash screen title, on-boarding headings.
    *   **Headline Medium** (24sp, SemiBold): AppBar titles, Section headers.
    *   **Body Large** (16sp, Regular): Main chat text, settings items.
    *   **Body Medium** (14sp, Regular): Secondary text, sub-titles.
    *   **Caption** (12sp, Medium): Timestamps, small badges.

### 5.3. Core UI Widgets (Components)
*   **Buttons**:
    *   **Primary**: Rounded corners (12px), Primary Color background, White text.
    *   **Secondary**: Transparent background, Primary Color border, Primary text.
    *   **Text Button**: No background, Primary text (for "Cancel" actions).
*   **Input Fields**:
    *   Filled style with rounded corners (12px).
    *   Light grey background (`#F0F0F0`) when inactive, White with Primary Border when focused.
    *   Error state: Red border + helper text.
*   **Chat Bubbles**:
    *   **Me**: Primary Color background, White text. Top-right, Bottom-right, Bottom-left rounded (16px), Top-left (4px).
    *   **Other**: White/Light Grey background, Black text. Top-left, Bottom-left, Bottom-right rounded (16px), Top-right (4px).
*   **Avatars**:
    *   CircleAvatar.
    *   Integration with `cached_network_image`.
    *   Fallback: Initials on colorful background gradient.

### 5.4. Lottie Animation Integration
We will use the `lottie` package to add delight and visual feedback.

*   **Locations**:
    1.  **Splash Screen**: Logo animation or "Chat" concept animation.
    2.  **Loading States**:
        *   Replace standard `CircularProgressIndicator` with a custom Lottie loader (e.g., pulsing dots or chat bubble morphing) for major screen loads.
    3.  **Empty States**:
        *   **No Conversations**: A friendly illustration (e.g., "Empty mailbox" or "Person waiting").
        *   **No Search Results**: "Magnifying glass" looking around.
    4.  **Success/Confirmation**:
        *   **Message Sent**: Subtle checkmark animation (optional).
        *   **Profile Saved**: Success confetti or checkmark.
    5.  **Voice Recording**: Pulse animation while recording audio.
    6.  **Backgrounds**:
        *   Subtle animated gradient shapes or "particles" on the Auth screens (Login/Signup) to make them feel alive (opacity 0.05-0.1).

*   **Asset Management**:
    *   Store JSON files in `assets/lottie/`.
    *   Preload common animations in `main.dart` to prevent lag.

---

## 6. Implementation Steps for Next Task

1.  **Repo Setup**: Ensure `apps/frontend` is clean and dependencies (`dio`, `flutter_bloc`, `go_router`) are installed.
2.  **Scaffold Core**: Create the folder structure defined in Section 3.1.
3.  **Branch**: Create `feat/frontend/init-structure`.

---

**(End of Plan)**
