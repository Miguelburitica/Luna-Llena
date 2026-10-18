## Context

The repository starts empty apart from the design canvas (`design/canvas`) and the brief (`design/ui-brief.md`).
This change lays the foundation and the first feature, and its code is the reference every later change copies.
The conventions themselves live in `openspec/config.yaml`.

## Goals / Non-Goals

**Goals:**
- One feature slice that shows every layer, port and test style, on server and web.
- The live lobby, built on an authoritative server that pushes snapshots.
- Design-system classes reused straight from the canvas.

**Non-Goals:**
- Role rules, the balance meter and suggested decks. The deck is plain counts for now.
- Horizontal scaling. Rooms live in one process's memory.

## Decisions

### Shared kernel in `packages/contracts`
The package holds vocabulary and wire types only: `ROLE_IDS`, `AVATAR_IDS`, `THEME_IDS`, the allowed timer values,
`ROOM_ERROR_CODES`, the DTOs (`RoomSnapshot`, `RoomSummary`, `RoomSession`, `RoomSettingsInput`) and the typed Socket.io
event maps (`ClientToServerEvents`, `ServerToClientEvents`). Both apps and every layer may import it. It contains no
behaviour, so no rule ends up duplicated between client and server.
*Alternative:* let the web import server domain code. Rejected because it couples the bundle to server internals.

### Server feature layout (`apps/server/src/features/room`)
- `domain/`
  - `Room`: the aggregate; mutable, with intention-revealing methods that return `Result`.
  - `Member`: an entity.
  - Value objects `RoomCode`, `DisplayName`, `RoomSettings`.
  - `StartReadiness`, a pure evaluation of the start conditions.
  - `alternativeNames`, the name suggestions.
  - `RoomError`.
- `application/`
  - One use case class per command: `CreateRoom`, `LookUpRoom`, `JoinRoom`, `ResumeSession`, `ChooseAvatar`,
    `SetReady`, `UpdateSettings`, `KickPlayer`, `LeaveRoom`, `MarkDisconnected`, `StartGame`.
  - Ports: `RoomRepository`, `RoomCodeGenerator`, `RoomPublisher`, plus `IdGenerator` from shared.
  - `toRoomSnapshot`: the only mapper.
- `infrastructure/`
  - `InMemoryRoomRepository`, `RandomRoomCodeGenerator`, `SocketRoomPublisher`.
  - `registerRoomHandlers`: maps socket events to use cases.

Use cases receive an `Actor` (`{ code, memberId }`) resolved by the infrastructure from the socket's stored session, so
the domain never deals with sockets. Each mutating use case loads the room, calls one aggregate method, saves, and calls
`publisher.publish(room)`.

### Errors as values
`Result<T, E>` lives in `@luna/contracts` (`result.ts`) with `ok`, `err` and `done`, because acknowledgements carry it
over the wire and both apps need the same shape. Domain errors are
`{ code: RoomErrorCode, ...details }`. Socket acknowledgements carry `Result<T, RoomErrorDto>` unchanged, so the web
side can switch on `code` and show translated copy.

### Live state by snapshot broadcast
After every mutation the publisher emits `room:snapshot` with the full `RoomSnapshot` to the Socket.io room
`room:<CODE>`. Snapshots carry no tokens and nothing secret, so one broadcast serves every member. `startReadiness` is
computed on the server and sent inside the snapshot. The checklist UI only renders it, which keeps the rule in one place.
Kicks and closures use targeted events: `room:kicked` to the kicked socket, `room:closed` to the room.
*Alternative:* event deltas. Rejected for the MVP because full snapshots are small and remove ordering bugs.

### Socket events
Client to server, each with an acknowledgement callback carrying a `Result`:
- `room:create {roomName, narratorName, settings?}` returns `RoomSession`
- `room:lookUp {code}` returns `RoomSummary`
- `room:join {code, name}` returns `RoomSession`
- `room:resume {code, token}` returns `RoomSession`
- `room:chooseAvatar {avatar|null}`, `room:setReady {ready}`, `room:updateSettings {settings}`, `room:kick {memberId}`,
  `room:leave`, `room:start`: each returns void

Server to client: `room:snapshot`, `room:kicked`, `room:closed`.
A `RoomSession` is `{ code, memberId, token, snapshot }`.

### Web feature layout (`apps/web/src/features/room`)
- `domain/`: pure view rules.
  - `normalizeRoomCode` and `isCompleteRoomCode`.
  - `membersInLobby` (narrator first, then join order).
  - `avatarAvailability`.
  - `inviteLinkFor`.
- `application/`
  - The `RoomGateway` port and the `SessionStore` port.
  - `useRoomStore`, a Pinia setup store. It gets its ports through `inject`, holds `session`, `snapshot` and
    `lastError`, and exposes one action per command.
- `infrastructure/`
  - `SocketRoomGateway`, which uses the shared typed socket client, and `LocalSessionStore`.
  - Views: `HomeView`, `JoinView`, `LobbyView`, which renders `PlayerLobby` or `NarratorLobby` depending on the role,
    and `RoomSetupView`, used both to create a room and to edit its settings.
  - Feature components.
  - `i18n` messages in en and es.

The composition root (`src/app/main.ts`) provides the adapters with `app.provide(ROOM_GATEWAY, ...)`. Store tests
provide fakes, and component tests mount views with a test Pinia and fakes.

### Design system
The canvas stylesheet is imported once in `src/shared/infrastructure/ui/styles/design-system.css`, with illustration
URLs pointing at local SVGs in `ui/assets/illustrations`. One rule changed: `.phone` is now fluid (full width, at most
480px, min-height 100dvh) instead of the 390×844 mockup frame.

Views copy markup and classes from the canvas files:
- `Home.dc.html`, `Join.dc.html`, `LobbyPlayer.dc.html` and `LobbyEdge.dc.html` for players.
- `NarratorSetup.dc.html` and `NarratorLobby.dc.html` for the narrator.

`ROLE_TEAMS`, `ROOM_CODE_ALPHABET` and `DEFAULT_ROOM_SETTINGS` also live in contracts so neither app restates them.
Small reusable pieces live in `src/shared/infrastructure/ui/components`: `LunaIcon`, `LunaAvatar`, `LunaToggle`,
`LunaSegmented`, `LunaCounter`. The narrator setup gains a "Your name" field next to the room name, because the canvas
has no field for the narrator's own name.

### Session persistence
`LocalSessionStore` keeps `{ code, memberId, token }` in sessionStorage (this tab) and in localStorage (this device),
inside try/catch. Loading prefers the tab copy, so a narrator and a player testing in two tabs of one browser each
reload into their own seat; the device copy lets a reopened tab find its way back. `LobbyView` resumes on mount
when the store has no live session, and when the socket reconnects. A `session-invalid` answer clears the stored
session and goes back to Home.

### Room codes
Codes use the 32-character alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (it drops 0, O, 1 and I). The generator draws
6 characters with `crypto.getRandomValues` and retries if the code is already taken. Tests inject a deterministic
generator.

### Testing
- **Domain tests** check the aggregate behaviour for each spec scenario.
- **Application tests** run the use cases against `InMemoryRoomRepository` and a recording publisher.
- **Integration test** (`registerRoomHandlers.test.ts`) starts a real Socket.io server on an ephemeral port and
  drives two or three clients through create, join, ready and start.
- **Web tests** cover the domain functions, the store with a fake gateway, and component tests for `JoinView` (name
  taken) and `NarratorLobby` (checklist, start disabled).

## Risks / Trade-offs

- [In-memory rooms disappear on restart] → acceptable for the MVP. The `RoomRepository` port allows a persistent
  adapter later.
- [Full snapshots grow with chat later] → chat gets its own events and is not part of the lobby snapshot.
- [Token in localStorage can be read by scripts on the page] → the token only guards a seat in a party game, there
  is no account behind it, and the app loads no third-party scripts.
