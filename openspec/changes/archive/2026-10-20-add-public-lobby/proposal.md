## Why

Today the only way into a game is a code passed between friends, so a group that is one or two people short has no way
to find strangers to fill the table. A public lobby fixes that, but it also opens the game to people the host does not
know. Strangers can flood the chat, use rude names and room titles, and type messages that the bots feed to a paid
language model. So the lobby has to ship with limits, moderation and prompt hardening from the start.

## What Changes

- **Public or private rooms:** when creating a room, the host picks *Private* (default, works exactly as today, join
  by code) or *Public*. The choice is fixed for the life of the room.
- **Public games lobby:** a new screen, "Find a game", reached from the home page.
  - It lists public rooms live over Socket.io. Each card shows room name, narrator, players/capacity, bot count, deck
    size and phase (waiting / in progress / full).
  - Filters "Waiting to start" and "Free seats" are both on by default.
  - Tapping a joinable room opens the existing join screen with the code filled in.
  - Rooms in progress or full stay on the list, greyed out and not joinable, and only show when the filters are off.
  - A room drops off the list when it closes, when its narrator disconnects, or once enough people report it.
- **Chat cap:** a chat message holds at most 200 characters (was 280). The server enforces it and the composer shows a
  countdown near the limit. **BREAKING** for clients that send 201 to 280 character messages.
- **Chat flood limit:** a member may send at most 5 messages in any 10 seconds; extra messages are rejected with
  `chat-too-fast`.
- **Clean text:** names, room names and chat messages are stripped of control, zero-width and direction-override
  characters before they are stored. Public room names may not contain links.
- **Bot input hardening:**
  - Player text reaches the model only as quoted, length-capped data, behind a rule that it is never instructions.
  - The model's answer is capped at 200 characters and dropped (scripted line instead) when it holds a link or leaks
    the prompt.
  - A room makes at most 12 model calls per minute and 400 in its lifetime, across replays. The existing cap of 150
    per game stays.
  - A bot answers the same person at most once every 20 seconds.
- **Moderation:**
  - The narrator can mute and unmute any player, bot or human, at any time. A muted player's messages are rejected
    with `chat-muted`.
  - A player kicked from a public room cannot rejoin that room from the same device (`kicked`).
  - Anyone browsing can report a public room. Three reports from different networks hide it from the lobby.
  - One network address may hold at most 2 open public rooms at once (`public-room-limit`).
  - The narrator can kick a player mid-game. A bot takes over the seat with the same role, so the balance holds.
- **Content review (public rooms only):** names, room titles and human chat are checked by a Spanish and English word
  list, then labeled by a moderation model on OpenRouter (`ok`, `profanity`, `harassment`, `sexual`, `spam`,
  `injection`).
  - The default model is `openai/gpt-oss-safeguard-20b`, which is built to classify against a written policy. It can
    be changed with `OPENROUTER_MODERATION_MODEL`.
  - Chat is delivered at once and reviewed in the background. Flagged messages are removed for everyone, and messages
    labeled `injection` never reach the bots.
  - The review fails open to the word list alone, within its own per-room budget.
- **Strikes and global bans:** kicks from public rooms, rooms hidden by reports, flagged messages and blocked names
  give strikes. 3 strikes per device, or 6 per address, in 24 hours means a 24 hour ban from creating, joining and
  chatting in every room.
- **Operator screen:** with `ADMIN_TOKEN` set, a hidden `/admin` screen lists bans, strikes, reports and public rooms.
  The operator signs in once with the token. The server checks it against its own value and returns an 8 hour session
  in an `HttpOnly`, `SameSite=Strict` cookie, so the browser never keeps the token.
  From there the operator can ban, unban and close rooms.
- **Room cleanup:** rooms close on their own when the narrator has been gone for 10 minutes, when a lobby has had no
  change for 60 minutes, or when no human has been connected for 5 minutes.

## Capabilities

### New Capabilities
- `public-games`: room visibility, the public games list and its live updates, filters, joining from the list, what
  happens to rooms in progress or full, reports, and the cap on public rooms per address.
- `moderation`: content review with the word list and the moderation model, moderated chat, strikes, global bans and
  the operator screen.

### Modified Capabilities
- `room-lobby`: creating a room takes a visibility, names and room names are cleaned, the narrator can mute players,
  kicks work mid-game with a bot taking the seat, kicks from public rooms bar the device, and abandoned rooms close on
  their own.
- `chat`: the 200 character cap with a visible countdown, the flood limit, clean text and muted players.
- `bots`: a new requirement for guarded speech (quoted player text, output checks, per-minute and per-room call caps,
  answer cooldown).

## Impact

- **Contracts:** `ROOM_VISIBILITIES`, `CreateRoomInput.visibility`, `RoomSnapshot.visibility`, `MemberView.muted`,
  `PublicRoomCard`, `PUBLIC_LOBBY_LIMITS`, the `lobby:*` events and `room:mute`, error codes `public-room-limit`,
  `room-not-public`, `kicked`, `chat-too-fast`, `chat-muted`, `message-blocked`, `name-blocked`, `room-name-blocked`, `banned`, `admin-disabled` and
  `admin-denied`, `CHAT_LIMITS.maxMessageLength` 200 plus the flood limits, new `BOT_LIMITS` entries,
  `MODERATION_LIMITS`, `ROOM_CLEANUP`, `chat:removed`, `room:seatTakenOver` and the `admin:*` events.
- **Server:**
  - `features/room`: visibility, mute, device bans, reports, the public room cap, and the `ListPublicRooms`,
    `ReportRoom` and `MuteMember` use cases, plus a lobby publisher;
  - `features/chat`: the flood limit, clean text and the muted check through the audience port;
  - `features/bots`: a speech allowance and a speech guard, with small edits to `botPrompt.ts`, `botTurns.ts` and
    `ObserveChatMessage.ts`, which the `smarter-bots` change also touches;
  - a new `features/moderation` feature (word list, strike ledger, bans, review budget, the OpenRouter classifier and
    the admin use cases and handlers), reached from room and chat through ports they own;
  - `features/room` also gets the mid-game takeover (`KickPlayer`) and `SweepRooms`, run by a timer;
  - `features/match` gets a use case that republishes views so the new bot sees its seat;
  - `shared`: a clean-text helper, the client identity read from the socket handshake, and wiring in `startServer.ts`.
- **Web:**
  - `features/room`: the visibility choice in setup, a public badge in the lobby, the new `PublicGamesView` with its
    store and gateway, and a "Find a game" button on the home page;
  - `features/chat`: the composer countdown and the new error messages;
  - `features/match`: a mute toggle in the narrator dashboard;
  - `features/chat`: "Message removed" for removed messages and the moderation errors;
  - a new `features/admin` feature with the `/admin` screen;
  - the seat takeover notice and the kick button in the narrator dashboard;
  - `shared/infrastructure`: a device id sent in the socket handshake;
  - `vite.config.ts`: `/api` added to the dev proxy, because the admin cookie needs the web app and the server on one
    origin.
- **Environment:** `OPENROUTER_MODERATION_MODEL` (optional), `ADMIN_TOKEN` (optional) and `TRUST_PROXY` (optional).

## Non-goals

- Accounts or logins. Identity is a network address plus a device id kept in the browser, and both can be dodged by
  someone determined. Strikes and bans aim to stop casual and repeated abuse, not a determined attacker.
- Keeping bans, strikes or rooms across a server restart.
- Reviewing private rooms, which are played among friends.
- Appeals, or telling a banned person which message caused the ban.
- Matchmaking, search by name, or regions.
- Switching a room between public and private after it was created.
- A server-wide model spend cap across all rooms.
