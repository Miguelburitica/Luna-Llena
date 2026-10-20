## Context

Rooms live in memory in the server `room` feature, and are found only by code (`room:lookUp`, `room:join`). There are
no accounts. A socket is bound to a seat by `socket.data.session`. Chat (`features/chat`) is open only during a match
and asks the match for permissions through the `ChatAudience` port. Bots (`features/bots`) watch room snapshots, match
views and chat deliveries. They call the model through the `BotSpeech` port, capped at 150 calls per game
(`BotTable.speechCalls`, which resets on replay).

The `smarter-bots` change is being written in parallel and edits `botPrompt.ts`, `botTurns.ts`,
`ObserveChatMessage.ts`, `ChatBudget.ts` and `OpenRouterBotSpeech.ts`. This design keeps its bot logic in new files
(`SpeechAllowance.ts`, `speechGuard.ts`). In the files we share it only makes call-site edits, and its spec delta only
ADDs a requirement, so the two changes merge and archive cleanly.

## Goals / Non-Goals

**Goals:**
- The public list is a read model built from the room aggregate. It has no store of its own.
- Every abuse limit is a number in `@luna/contracts`, enforced on the server, and has a test.
- Private rooms behave exactly as today.

**Non-Goals:**
- Persistence and horizontal scaling. The throttled lobby broadcast, the strike ledger and the bans all assume one
  process holding them in memory.
- Real identity.

## Decisions

### Domain model (server `features/room/domain`)

```
Room
  visibility: 'private' | 'public'          fixed at open
  openedBy: ClientIdentity                  { address, device }, used for the public room cap
  reporters: Set<address>                   report(address) -> Result<void>; isHidden = size >= 3
  barredDevices: Set<device>                filled by kick() when public; join() -> err('kicked')
  isListed = public && narrator.connected && !isHidden
  mute(actorId, targetId, muted) -> Result<Member>   narrator only, any status, players only
Member
  muted: boolean
  identity.device: string
RoomName.create(raw, visibility)            rejects links when public
DisplayName / RoomName                      clean with cleanText before checks
publicRoomCardOf(room) / byListingOrder     pure, in domain/publicListing.ts
```

`cleanText` and `containsLink` live in `apps/server/src/shared/domain/plainText.ts`, because both `room` and `chat`
need them and neither may import the other. The existing `room/domain/text.ts` uses `cleanText` in place of its
whitespace rule.

### Client identity

`apps/server/src/shared/infrastructure/clientIdentity.ts` reads `{ address, device }` once per connection:
- `address` comes from `socket.handshake.address`.
- `device` comes from `socket.handshake.auth.device`, kept only when it is a string of 8 to 64 characters from
  `[A-Za-z0-9-]`, and otherwise replaced by `socket.id`.

The result is stored in `socket.data.client`. Use cases receive it as a plain `ClientIdentity` argument, so the domain
never sees a socket. On the web, `lunaSocket.ts` passes `auth: { device }`, a random id kept in `deviceStorage` under
`luna.device`.

- *Why address for the room cap and reports, device for kick bars:* friends on one Wi-Fi share an address, so barring
  by address would lock out a whole party. Reports and the room cap are the abuse vectors where clearing storage must
  not help, and there a shared address only makes the limits stricter.
- *Alternative:* sign the device id with a server secret. Rejected: without accounts it adds nothing against
  incognito tabs.

### Use cases (server `features/room/application`)

| Use case | Input | Notes |
|---|---|---|
| `CreateRoom` (changed) | `+visibility`, `ClientIdentity` | counts `rooms.all()` public rooms with the same `openedBy.address`, then `public-room-limit` |
| `JoinRoom` (changed) | `+ClientIdentity` | passes `device` into `MemberIdentity` |
| `ListPublicRooms` | none | `rooms.all()` → listed → cards → ordered → first 50 |
| `ReportRoom` | `{ code }`, `ClientIdentity` | `changeRoom` without an actor, then lobby refresh |
| `MuteMember` | actor, `{ memberId, muted }` | via `changeRoomAs` |
| `IsMemberMuted` | `code, memberId` | query for the chat audience port |

The `RoomRepository` port gains `all(): Promise<readonly Room[]>`, in insertion order, so "newer first" needs no clock.
A new port, `LobbyNotifier { changed(): void }`, joins `RoomAccess`. `saveAndPublish` calls it for public rooms, and so
do `LeaveRoom`'s close path and `ReportRoom`.

### Socket events (contracts)

| Event | Direction | Payload / ack |
|---|---|---|
| `lobby:watch` | client → server | `{}` → `Result<readonly PublicRoomCard[], RoomError>`; joins channel `lobby` |
| `lobby:unwatch` | client → server | `{}` → `Result<void, RoomError>` |
| `lobby:report` | client → server | `{ code }` → `Result<void, RoomError>` |
| `lobby:rooms` | server → client | `readonly PublicRoomCard[]`, the whole list |
| `room:mute` | client → server | `{ memberId, muted }` → `Result<void, RoomError>` |

The server always sends the whole list, at most 50 cards of about 150 bytes, rather than diffs. Diffs would need
versioning and replay on reconnect, and the list is small. `ThrottledLobbyNotifier` (room infrastructure) coalesces
`changed()` calls within 500 ms into one `ListPublicRooms` run and one broadcast to the `lobby` channel.

`PublicRoomCard = { code, name, narratorName, playerCount, capacity, botCount, deckSize, status: 'waiting' |
'in-progress' | 'full', joinable }`.

### Chat (server `features/chat`)

- `MessageText` uses `cleanText`, and `CHAT_LIMITS.maxMessageLength` becomes 200.
- `ChatLog` gains a flood window per member (`admit(memberId, now): boolean`, the last 5 send times). `SendMessage`
  checks, in order: audience, muted, text, channel, flood. Only accepted messages count against the window.
- The `ChatAudience` port gains `isMuted(code, memberId)`. `startServer` wires it to `IsMemberMuted` through a lazy
  reference, because chat is built before rooms.

### Bots (server `features/bots`)

- `domain/SpeechAllowance.ts` replaces `BotTable.speechCalls`. It holds `takeCall(now)` (per game ≤150, lifetime
  ≤400, ≤12 in a sliding 60 s window), `newGame()` (resets only the per-game count) and `mayAnswer(botId, askerId,
  now)` (a 20 s cooldown).
- `domain/speechGuard.ts` holds:
  - `UNTRUSTED_TEXT_RULE` (es and en), appended to the system prompt;
  - `quotedChatLine` (`JSON.stringify({ from, said })`, with `said` cut to 200);
  - `quotedText`;
  - `guardSpokenLine`, which caps at 200 and rejects links and self-reference.
- Edits to shared files:
  - `botPrompt.ts`: the system prompt adds the rule, chat lines are quoted, the answer intent quotes the question, and
    `parseSpokenLine` passes through `guardSpokenLine`;
  - `botTurns.speak`: uses `allowance.takeCall(clock.now())` and returns early when the bot is muted;
  - `ObserveChatMessage`: checks `mayAnswer`.
- `BotContext` gains a `clock`, and `BotRoster` gains `mutedIds` from `MemberView.muted`.

JSON quoting means a chat line cannot close its own quote or inject a newline that looks like a new section. Each
section is labeled and the rule names those labels.

### Web

- **`features/room/domain/publicGames.ts`:** `filterPublicRooms(cards, { waitingOnly, freeSeatsOnly })` and the
  status badge mapping.
- **`features/room/application`:**
  - `PublicGamesGateway` port with `watch`, `unwatch`, `report` and `onRooms`;
  - `usePublicGamesStore` (Pinia setup store) holding `rooms`, `filters`, `visibleRooms`, `reported`;
  - `RoomGateway.mute` and the store's `mute` action.
- **`features/room/infrastructure`:**
  - `SocketPublicGamesGateway`;
  - `views/PublicGamesView.vue` on route `/games` (`public-games`), which implements the new canvas
    `design/canvas/PublicGames.dc.html`;
  - "Find a game" on `HomeView` (`Home.dc.html`);
  - a `LunaSegmented` visibility row in `RoomSetupView` (`NarratorSetup.dc.html`);
  - a "Public" `sbadge` in `NarratorLobby` (`NarratorLobby.dc.html`).
- **Public games screen markup:** the screen reuses the join card markup (`card`, `art bg-night`, `av av-xs` faces,
  `sbadge`) and `chip` filters (`is-sel`). A report button sits in each card; a `modal` asks for confirmation before
  sending a report.
- **`features/chat`:** `domain/composer.ts` gains `charactersLeft(draft)`, which is `null` below 160.
  `ChatComposer.vue` shows a `count` element, styled `err` at 0. There are new i18n errors.
- **`features/match`:** each `NarratorDashboard` player row gets a mute `btn-icon` (`volume`/`volume-x`), reading
  `muted` from the room store snapshot and calling `useRoomStore().mute`. This is UI composition through another
  feature's application layer, as allowed.

### Moderation feature (server `features/moderation`)

```
domain/
  wordList.ts          normalizeForMatch(text) (lowercase, strip accents, undo 4→a 3→e 1→i 0→o $→s @→a, squeeze
                       repeats), blockedByWordList(text); es and en word lists as const arrays
  ReviewLabel          'ok' | 'profanity' | 'harassment' | 'sexual' | 'spam' | 'injection' (from contracts)
  ReviewBudget         per room: 30 per sliding 60 s, 600 lifetime; take(now)
  StrikeLedger         strikes per key ('device:x' | 'address:y') within 24 h; strike(client, reason, now)
                       -> new bans; threshold 3 device / 6 address
  BanList              bans by key with until; banOf(client, now); ban(key, until); lift(key)
application/
  ports: ContentClassifier { classify(text, kind): Promise<ReviewLabel | null> }, ModerationJournal (last 100
         strikes and reports for the operator), Clock
  ReviewText           (code, visibility, text, kind) -> 'blocked' | ReviewLabel   word list, then budgeted model
  RecordStrike, CheckBan, RecordReport
  admin/ SignInAdmin (token check + lockout -> new session id), SignOutAdmin, AdminSessionOf (session id -> live?),
         ModerationOverview, BanClient, LiftBan, CloseRoomAsAdmin (through a RoomCloser port wired to room's
         CloseRoom); ports AdminSessions (create, find, end, with expiry) and AdminSecret (matches(token))
infrastructure/
  OpenRouterContentClassifier   POST chat/completions, model OPENROUTER_MODERATION_MODEL ??
                                'openai/gpt-oss-safeguard-20b', reasoning effort low, max_tokens 300, 4 s timeout;
                                system = fixed policy; user = JSON.stringify({ kind, text }); answer parsed as
                                {"label": ...}, anything else -> null
  NoContentClassifier, InMemoryModeration (ledger, bans, journal), InMemoryAdminSessions,
  EnvironmentAdminSecret, registerAdminHttpRoutes, registerAdminHandlers
```

- *Model choice:* `typesafe/jev-router` routes each request to whichever model it judges best, and is priced per
  request with dynamic pricing. That is useful for open-ended prompts, but a per-message gate needs a fixed policy,
  steady latency and predictable cost. `openai/gpt-oss-safeguard-20b` is built for exactly that: it reads a written
  policy and returns a label. It costs about $0.075 per million input tokens. Llama Guard and Nemotron Safety have
  fixed taxonomies with no prompt-injection class, so they were rejected. The model is one environment variable away
  if the router does better in playtests.
- `room` and `chat` reach moderation through ports they own, wired in `startServer`:
  - room's `ContentGate { reviewName, reviewRoomName, strike, banOf }`;
  - chat's `ChatModeration { banOf, reviewMessage, strike }`.
  Neither imports the moderation feature.

### Admin sessions

The raw `ADMIN_TOKEN` is used once, at sign-in, and never stored in the browser.

1. **Sign in.** `AdminView` sends `POST /api/admin/session` with body `{ token }`, via `fetch`, same origin,
   `credentials: 'same-origin'`.
   - `registerAdminHttpRoutes` adds the handler to the existing `httpServer` (plain `node:http`, no framework). It
     only accepts JSON bodies up to 1 KB.
   - It rejects any request whose `Origin` header is not the configured `webOrigin`.
   - It runs `SignInAdmin` with the client address. Lockout uses `MODERATION_LIMITS.admin`: 5 failures per address in
     10 min, then a 10 min lock.
2. **Check the token.** `EnvironmentAdminSecret` keeps only `sha256(ADMIN_TOKEN)` in memory. `matches(token)` compares
   `sha256(token)` with it using `crypto.timingSafeEqual`, so length differences leak nothing.
3. **Start the session.** On success `InMemoryAdminSessions` creates `randomBytes(32).toString('base64url')` with
   `expiresAt = now + 8 h`, and the response sets
   `Set-Cookie: luna_admin=<id>; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`, adding `; Secure` unless
   `webOrigin` is `http://localhost…`. The body is `{ ok: true, expiresAt }`; it never echoes the token or the id.
4. **Authorize the socket.** The browser holds only the cookie, and a page script cannot read it. After sign-in the
   web app reconnects its socket (`socket.disconnect().connect()`) so the new handshake carries the cookie.
   - On connection, `clientIdentity.ts` also parses `socket.handshake.headers.cookie` for `luna_admin` and stores the
     session id in `socket.data.adminSession`.
   - Each `admin:*` handler runs `AdminSessionOf` first. A missing or expired session answers `admin-denied`, and
     the store returns to the sign-in form.
5. **Sign out.** `DELETE /api/admin/session` (same `Origin` check) runs `SignOutAdmin`, ends the session server-side
   and clears the cookie with `Max-Age=0`. Sessions also vanish on restart.

- `GET /api/admin/session` answers `{ signedIn, expiresAt }`, so the screen knows on load whether to show the
  sign-in form without the browser ever reading the cookie.
- *Why one HTTP endpoint and not a socket event:* a socket message cannot set an `HttpOnly` cookie. The socket keeps
  carrying every admin command once authorized.
- *Same origin is required.* In dev, Vite already proxies `/socket.io` to port 3001, and `/api` is added to the same
  proxy. In production the web app and the server must sit behind one origin (one domain or a reverse proxy), which
  `README`/deploy notes call out. The CORS setting of the socket server is unchanged.
- *CSRF:* sign-in needs the token itself. Sign-out and every socket command rely on `SameSite=Strict` plus the
  `Origin` check, so another site can neither ride the cookie nor start a session.
- *Alternative:* a signed JWT in the cookie. Rejected: stateless tokens cannot be revoked on sign-out without a deny
  list, and the server already holds everything in memory.

### Moderated chat flow

`SendMessage` in a public room checks, in order: ban, mute, text, word list, channel, flood. It then appends and
delivers to every reader, and returns the ack. Review then runs in the background:
- `ok`, or no verdict: `publisher.cleared(message, recipients)`, which is where `BotAwareChatPublisher` now hands the
  message to the bots.
- `injection`: no `cleared`, plus a strike.
- Any other label: `ChatLog.remove(id)`, `publisher.removed(code, id, recipients)` (event `chat:removed`) and a strike.

In private rooms `cleared` follows `deliver` at once, so bots behave as today. `ChatPublisher` gains `cleared` and
`removed`, and `BotAwareChatPublisher.deliver` stops feeding the bots.

### Mid-game kick and seat takeover

`Room.kick` in game turns the target `Member` into a bot in place (`member.becomeBot(name, profile, newToken)`), so
the member id, and with it the match seat, stays the same. The name is the next free name from the room's bot cast; a
cast is picked if the room has none yet. The personality is random, the difficulty normal. Bots are always ready and
connected.
- `KickPlayer` publishes the snapshot, then:
  - notifies the kicked sockets (`room:kicked`) and the room (`room:seatTakenOver { formerName, botName }`);
  - calls the `GameStarter` port's new `handOver(code)`.
- `handOver` is wired to a new match use case, `RepublishMatch`, which publishes the current views. The bot table,
  already synced from the snapshot, receives its first view and plans the phase.
- The bot starts with an empty chat memory. Suspicion builds from the view's votes and deaths.

### Room cleanup

- `Room` tracks two times: `narratorAwaySince` (set by `disconnect`, cleared by `resume`) and `lastChangedAt` (set by
  `saveAndPublish` from a `Clock` added to `RoomAccess`).
- `Room.abandonment(now)` returns `'narrator-gone' | 'idle-lobby' | 'no-humans' | null`. The thresholds come from
  `ROOM_CLEANUP` in contracts. "No humans" uses `humansAwaySince`, kept like `narratorAwaySince` whenever the last
  connected human drops.
- `SweepRooms.execute()` iterates `rooms.all()` and closes each abandoned room through the same path as the narrator
  leaving. That path is pulled out of `LeaveRoom` into `closeRoom(access, room)`, which also discards the match and
  chat through `GameStarter.discard` and calls the lobby notifier.
- `IntervalRoomSweeper` in room infrastructure runs it every 60 s. It is started in `startServer` and stopped in
  `close()`.

### Web additions

- **`features/chat`:** handle `chat:removed` with `messageLog.remove(id)`; the bubble shows "Message removed" for an
  id removed while it was on screen. New errors: `message-blocked`, `banned`.
- **`features/room`:** handle `room:seatTakenOver` by showing a `toast`; add failure messages for `name-blocked`,
  `room-name-blocked` and `banned` (with the end time).
- **`features/match`:** each `NarratorDashboard` player row gets a kick `btn-icon` (`user-x`) with the same confirm
  `modal` as the lobby.
- **`features/admin`:** a new web feature.
  - `AdminGateway` port, adapted by `HttpSocketAdminGateway`: `fetch` for session sign-in, sign-out and status,
    and the socket for commands. `useAdminStore` holds only `signedIn` and `expiresAt`; the token lives in the form
    field until it is sent, then the field is cleared.
  - `AdminView` on `/admin` uses the desk layout of `NarratorDashboard.dc.html`: `panel` sections for bans, strikes,
    reports and rooms, `prow` rows, a ban form (`seg` for device/address, `counter` for hours) and `btn-danger`
    actions.
  - No canvas screen exists for it; it reuses the dashboard's panels as is.

## Risks / Trade-offs

- [Behind a reverse proxy every client shares one address] → Read `x-forwarded-for` only when the `TRUST_PROXY=1`
  environment variable is set. The default is off, so the header cannot be spoofed.
- [Rooms whose narrator never returns pile up and still count toward the cap] → The cap is 2 per address, and the
  narrator can return to their seat from the home page to close a room. Real expiry is a non-goal for now.
- [Broadcasting the whole list to every watcher on each change] → The throttle allows at most 2 broadcasts a second
  of at most 50 cards. Revisit with diffs if the lobby grows past a few hundred watchers.
- [Shared bot files with `smarter-bots`] → Edits are a few lines at call sites. Whichever change lands second rebases
  on those lines only.
- [The review model is down or slow] → It fails open to the word list, and chat is never blocked waiting on it. A
  flagged message may be readable for a second or two before it is removed.
- [False positives on Spanish slang, such as "marica" between friends] → Review runs in public rooms only, the policy
  says that friendly banter is `ok`, and one strike alone bans nobody.
- [Bans and strikes vanish on restart] → Accepted for now (see non-goals). The ledger sits behind a port, so a
  persistent store can replace it.
- [The operator screen shows IP addresses] → It is reachable only through an `HttpOnly` admin session started with
  `ADMIN_TOKEN`. The token is never kept in the browser or put in a URL. Strike excerpts are capped at 200 characters and dropped after 100 entries.
- [A taken-over seat changes name mid-game, which can confuse vote history] → The notice names both the old and the
  new name, and the narrator dashboard row shows the new bot tag at once.
- [The 280 → 200 cap rejects long messages from an old client] → The client ships with the server in one bundle.
  Nothing to migrate.

- [Production deploy on two origins breaks the admin cookie] → Same origin is a documented deploy requirement. Without
  it, sign-in is rejected by the `Origin` check instead of half-working.

## Migration Plan

No data to migrate: rooms are in memory. Deploy server and web together. Rollback is a redeploy of the previous
version.
