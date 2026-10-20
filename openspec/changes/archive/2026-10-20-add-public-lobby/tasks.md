## 1. Contracts

- [x] 1.1 Room vocabulary and views: `ROOM_VISIBILITIES`, `PUBLIC_ROOM_STATUSES`, `PUBLIC_LOBBY_LIMITS` (2 rooms per address, 3 reports, 50 listed, 500 ms throttle), `CreateRoomInput.visibility`, `RoomSnapshot.visibility`, `MemberView.muted`, `PublicRoomCard`, errors `public-room-limit`, `room-not-public` and `kicked`; verify with `pnpm typecheck`
- [x] 1.2 Lobby and mute events (`lobby:watch`, `lobby:unwatch`, `lobby:report`, `lobby:rooms`, `room:mute`) wired into `ClientToServerEvents`/`ServerToClientEvents`, plus `DEVICE_ID_LIMITS` for the handshake; verify with `pnpm typecheck`
- [x] 1.3 Chat limits: `maxMessageLength` 200, `countdownFrom` 160, `burstMessages` 5, `burstSeconds` 10, errors `chat-too-fast` and `chat-muted`; `BOT_LIMITS` gains `maxSpeechCallsPerRoom` 400, `maxSpeechCallsPerMinute` 12 and `answerCooldownSeconds` 20; verify with `pnpm typecheck`
- [x] 1.4 Moderation vocabulary: `REVIEW_LABELS`, `MODERATION_LIMITS` (strike thresholds, 24 h window and ban, review budget 30/min and 600/room, 3 s name and 4 s message timeouts, admin lockout), `ROOM_CLEANUP` (10 min, 60 min, 5 min, 60 s sweep), errors `message-blocked`, `name-blocked`, `room-name-blocked`, `banned` (with `until`), `admin-disabled` and `admin-denied`, the admin session HTTP shapes (`AdminSessionStatus`) and `ADMIN_SESSION` (cookie name, 8 h lifetime), events `chat:removed`, `room:seatTakenOver` and `admin:overview|ban|unban|closeRoom` with their views; verify with `pnpm typecheck`

## 2. Server domain

- [x] 2.1 `shared/domain/plainText.ts` (`cleanText`, `containsLink`) used by `DisplayName`, `RoomName` and `MessageText`; tests "Invisible characters", "Only invisible characters", "Link in a public room name", "Link in a private room name", "Hidden characters", "Too long", "Exactly at the limit"
- [x] 2.2 Room: visibility, `openedBy`, member device and `muted`, `mute`, device bar on public kicks, `report`/`isHidden`/`isListed`, and `domain/publicListing.ts` (card and order); tests "Private by default", "Unknown visibility", "Kicked from a private room", "Kicked from a public room", "Narrator mutes a player", "Unmute", "Player tries to mute", "Full room", "Joinable rooms first", "Reporting twice"
- [x] 2.3 Chat `ChatLog` flood window; tests "Spamming the village", "After a pause"
- [x] 2.4 Bots `SpeechAllowance` and `speechGuard`, with `botPrompt` quoting and guarded parsing; tests "Injection in the chat", "Model leaks its prompt", "Link in a model line", "Too many calls in a minute", "Room spend cap across replays", "Mention spam" (cooldown unit)

- [x] 2.5 Moderation domain: `wordList` normalization and matching, `ReviewBudget`, `StrikeLedger`, `BanList`; tests "Slur caught by the word list", "Third strike", "Shared network", "Ban expires", "Review budget spent"
- [x] 2.6 Room: `kick` in game turns the seat into a bot (`becomeBot`), and `abandonment(now)` with the away and changed times; tests "Kicked mid-game", "Kicking a bot mid-game", "Narrator never comes back", "Narrator back in time", "Idle lobby", "Only bots left"

## 3. Server application

- [x] 3.1 `CreateRoom` (visibility, public room cap) and `JoinRoom` (device) with a `ClientIdentity` argument, `RoomRepository.all`, `LobbyNotifier` in `RoomAccess`, and `ListPublicRooms`, `ReportRoom`, `MuteMember`, `IsMemberMuted`, all in `createRoomKit`; tests "Public room", "Third public room", "Private rooms are unlimited", "Closing frees a slot", "Watching the list", "Narrator away", "Three reports hide a room", "Reporting a private room", "Back to the lobby", "Room created with defaults"
- [x] 3.2 Chat `SendMessage` checks muted (through `ChatAudience.isMuted`) and the flood window; tests "Muted player writes"
- [x] 3.3 Bots: `clock` in `BotContext`, `mutedIds` in the roster, allowance in `speak` and `ObserveChatMessage`; tests "Muted bot", "Mention spam" (kit)

- [x] 3.4 Moderation use cases (`ReviewText`, `RecordStrike`, `CheckBan`, `RecordReport`, `SignInAdmin`, `SignOutAdmin`, `AdminSessionOf`, `ModerationOverview`, `BanClient`, `LiftBan`, `CloseRoomAsAdmin`) with a fake classifier kit; tests "Profane name", "Profane room name", "Private rooms are not reviewed", "Model down", "Operator lifts a ban", "Operator bans by hand", "Guessing the token", "Session ends", "No session", "Admin disabled"
- [x] 3.5 Room `ContentGate` port in `CreateRoom`, `JoinRoom` and `ReportRoom` (ban check, review, strikes), `closeRoom` extracted from `LeaveRoom`, and `SweepRooms`; `KickPlayer` hands the seat over through `GameStarter.handOver`; match `RepublishMatch`; tests "Hidden room strikes its host", "Banned reporter", "Cleanup frees the cap", "The new bot plays on" (bot kit with a real match), "Operator closes a room"
- [x] 3.6 Chat `ChatModeration` port: ban and word list checks, background review, `cleared` and `removed` on the publisher, `ChatLog.remove`; tests "Removed after review", "Injection kept from bots", "Clean message reaches bots", "Banned chat"

## 4. Server infrastructure

- [x] 4.1 `clientIdentity.ts` (address with optional `TRUST_PROXY`, device from the handshake), `InMemoryRoomRepository.all`, `ThrottledLobbyNotifier`, `lobby:*` and `room:mute` handlers, and wiring in `startServer`; socket integration tests "A player joins" (live list), "A room closes", "A game starts", "Public room joined by code"
- [x] 4.2 `OpenRouterContentClassifier` (stubbed fetch: policy prompt, quoted text, label parsing, timeout), `NoContentClassifier`, `InMemoryModeration`, `EnvironmentAdminSecret` (SHA-256 plus `timingSafeEqual`), `InMemoryAdminSessions`, `registerAdminHttpRoutes` (`POST`/`GET`/`DELETE /api/admin/session`, `Origin` check, 1 KB body cap, `HttpOnly; SameSite=Strict` cookie, `Secure` off localhost), the session cookie read in `clientIdentity`, `registerAdminHandlers` gated by the session, `IntervalRoomSweeper`, `BotAwareChatPublisher.cleared`, and env wiring for `OPENROUTER_MODERATION_MODEL`, `ADMIN_TOKEN` and `TRUST_PROXY` in `main.ts`; socket tests for `chat:removed` and `room:seatTakenOver`; HTTP and socket tests "Token never stays in the browser" (the cookie flags, and no token in the body), "Sign-in from another site", sign-in, then reconnect, then overview, then sign-out, then denied

## 5. Web domain

- [x] 5.1 `room/domain/publicGames.ts` (filters, status badge); `chat/domain/composer.ts` `charactersLeft`; tests "Filters off", "Near the limit", "Short drafts"

## 6. Web application

- [x] 6.1 `PublicGamesGateway` port, fake and `usePublicGamesStore`, plus `RoomGateway.mute` and the store's `mute`; tests for watching, live updates, reports and unwatching on leave
- [x] 6.2 A device id in `deviceStorage`, sent as socket `auth`; test that it is stable across loads

## 7. Web infrastructure

- [x] 7.1 Canvas `design/canvas/PublicGames.dc.html`, `SocketPublicGamesGateway`, `PublicGamesView` on `/games`, and "Find a game" on the home page; view tests "Opening the screen", "Joining from the list", "Nothing to join", report confirmation
- [x] 7.2 Visibility choice in `RoomSetupView` and the "Public" badge in `NarratorLobby`; test "Choosing public in setup"
- [x] 7.3 Composer countdown and the chat errors `chat-too-fast`/`chat-muted`; room failure messages for `public-room-limit`, `room-not-public` and `kicked` in en and es; component tests for the countdown and errors
- [x] 7.4 Mute toggle and muted icon in the `NarratorDashboard` rows; test that it calls mute and shows the icon

- [x] 7.5 Chat `chat:removed` handling ("Message removed"), the seat takeover toast, the kick button in the narrator dashboard, and failure messages for `name-blocked`, `room-name-blocked`, `banned` and `message-blocked`; component tests
- [x] 7.6 `features/admin`: `AdminGateway` (HTTP session plus socket commands, reconnecting the socket after sign-in), `useAdminStore` (no token kept), `AdminView` on `/admin` (token form cleared after submit, bans, strikes, reports, rooms, ban and unban forms, close room); view tests with a fake gateway

- [x] 7.7 Vite dev proxy adds `/api` to port 3001 next to `/socket.io`; check that `POST /api/admin/session` through `localhost:5173` sets the cookie

## 8. Verification

- [x] 8.1 Run `pnpm check` green
- [x] 8.2 In the browser at phone width: create a public room in one tab and watch it appear live in "Find a game" in another tab, join from the list, start a game with bots and see it greyed out, then mute a player from the dashboard and see the chat refuse them; check the 200 character countdown; kick a player mid-game and watch a bot take the seat; get a message removed by review with the real moderation model; check `/admin` reports a disabled screen without `ADMIN_TOKEN`
- [x] 8.4 Sign in at `/admin` in a browser against a server started with `ADMIN_TOKEN`, confirm the cookie is `HttpOnly` and no token is in storage, ban and unban, then sign out
- [x] 8.3 Archive the change and sync the specs
