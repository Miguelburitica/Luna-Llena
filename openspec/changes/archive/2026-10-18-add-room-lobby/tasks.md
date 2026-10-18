## 1. Foundation

- [x] 1.1 Create the pnpm workspace (apps/server, apps/web, packages/contracts, tools/eslint-rules) and verify `pnpm install` succeeds
- [x] 1.2 Add the `luna/no-comments` ESLint rule, the style comment check and the layer boundary restrictions; verify `pnpm lint` fails on a sample comment and on a domain file importing infrastructure
- [x] 1.3 Import the design system stylesheet and illustrations from design/canvas into apps/web/src/shared/infrastructure/ui and verify no `/_blob/` URL or comment remains

## 2. Contracts

- [x] 2.1 Add room vocabulary (role, avatar, theme ids, timer options, error codes, limits), DTOs and socket event maps in packages/contracts and verify `pnpm --filter @luna/contracts typecheck`

## 3. Server domain

- [x] 3.1 Add shared `Result` and the `RoomCode`, `DisplayName`, `RoomSettings` value objects with tests for the code alphabet, name rules and every settings scenario
- [x] 3.2 Add the `Room` aggregate with `Member` and `StartReadiness`, with tests for join, name-taken suggestions, room-full, avatars, readiness, presence, leave, kick, narrator leave and every start-conditions scenario

## 4. Server application

- [x] 4.1 Add the ports and the use cases (create, look up, join, resume, choose avatar, set ready, update settings, kick, leave, mark disconnected, start) with tests against the in-memory repository and a recording publisher, covering not-narrator, session-invalid and game-already-started

## 5. Server infrastructure

- [x] 5.1 Add `InMemoryRoomRepository`, `RandomRoomCodeGenerator`, `SocketRoomPublisher`, `registerRoomHandlers` and the composition root, and verify the socket integration test drives create → join → ready → start → snapshot broadcast and kick → `room:kicked`

## 6. Web domain and application

- [x] 6.1 Add room code normalization, member ordering, avatar availability and invite link functions with unit tests
- [x] 6.2 Add the `RoomGateway` and `SessionStore` ports and `useRoomStore` with tests for create, join (name-taken error kept for the view), resume from the stored session and snapshot updates

## 7. Web infrastructure

- [x] 7.1 Add the typed socket client, `SocketRoomGateway`, `LocalSessionStore`, i18n (en, es) and the shared UI components (icon, avatar, toggle, segmented, counter)
- [x] 7.2 Add `HomeView`, `JoinView` (invite link prefill, room found card, name-taken chips), `LobbyView` with `PlayerLobby` and `NarratorLobby`, and `RoomSetupView` (create and edit) following the canvas screens, with component tests for name-taken and the start checklist

## 8. Verification

- [x] 8.1 Run `pnpm check` (lint, typecheck, tests) green
- [x] 8.2 Run server and web together, play through create → three joins in separate tabs → ready → kick → reload resume → start, and confirm the live updates
