## Context

This builds on the `match` feature after `add-voting`. See the specs `game-phases`, `night-actions` and `voting`. The
contracts are written and frozen:
- `packages/contracts/src/chat/vocabulary.ts`: `CHAT_CHANNELS`, `MESSAGE_KINDS`, `CHAT_LIMITS`, `CHAT_ERROR_CODES` and
  `chatError`.
- `packages/contracts/src/chat/views.ts`:
  - `ChatMessage`
  - `ChatAccess` (`read`, `write`, `lastWordsUntil`, `villagePaused`)
- `packages/contracts/src/chat/events.ts`:
  - `chat:send`, with `{ channel, text }`, acknowledged with `ChatMessage`
  - `chat:history`, acknowledged with `ChatMessage[]`
  - server push `chat:message`
- Every `MatchView` now carries `chat: ChatAccess` for its recipient.

## Goals / Non-Goals

**Goals:** a third server feature (`chat`) that depends on `match` only through a port, while match stays the single
source of truth for who may speak.
**Non-Goals:** see proposal.md, Non-goals.

## Decisions

### Match owns access; chat owns messages
- `features/match/domain/chatAccessOf.ts` is a pure function: `(match, memberId, now)` returns `ChatAccess`. It
  implements the read and write rules of the spec:
  - Phase rules and the game-over rule.
  - True role for wolves.
  - Dead players get ghosts.
  - Narrator: reads all channels and writes village.
  - Last words: a dead player with an open window gets `village` in `write`. While any window is open,
    `villagePaused` is true for living players and `village` is removed from their `write`.
- `Match` records the windows in `lastWords: Map<memberId, until>`:
  - `bury` opens a window for deaths at dawn, by execution or by the Hunter's shot, when the `lastWords` house rule
    is on. The narrator's `setAlive` opens none.
  - `bury`, `advance` and `avenge` receive `now`.
  - `closeLastWords(memberId)` closes a window.
  - An expired window counts as closed.
- The `lastWords` house rule travels like `anonymousVotes`: room `GameOpening` → `MatchOpening` → `Match`.
- `matchViews` fills `chat` with `chatAccessOf(match, recipientId, now)`.

### Port between the features
- The chat application defines `ChatAudience`:
  - `membersOf(code, now)` returns `Map<memberId, ChatAccess>`, or nothing when there is no match.
  - `lastWordsSpoken(code, memberId, now)` closes the window and republishes the match views.
- The match application implements both through two small use cases:
  - `DescribeChatAudience`
  - `CloseLastWords`, built on `changeMatchAs` semantics without the narrator check.
- The composition root (`startServer`) wires them.

### Chat server feature (`apps/server/src/features/chat`)
- `domain/`:
  - `ChatLog`, one per room: one list per channel, capped at `CHAT_LIMITS.historyPerChannel`.
  - `MessageText`, a value object that trims and validates `unknown` → `message-invalid`.
  - `canWrite(access, channel, phase-agnostic)`: deciding `chat-closed` against `chat-forbidden` uses the access plus
    a `closedReason`. To keep that decision in one place, `chatAccessOf` is extended with `closed: ChatChannel[]` in an
    internal (non-contract) result, `ChatPermissions`. The match adapter returns `ChatPermissions` and the contract's
    `ChatAccess` is a projection of it.
- `application/`:
  - Ports: `ChatLogRepository`, `ChatPublisher` (`deliver(message, recipientIds)`) and `ChatAudience`.
  - `SendMessage`:
    1. Validates the text.
    2. Resolves permissions.
    3. Picks the kind: `narrator` for the narrator; `last-words` when a dead author writes to the village; `player`
       otherwise.
    4. Appends the message.
    5. Delivers it to every member whose access lets them read the channel.
    6. When the kind is `last-words`, calls `lastWordsSpoken`.
  - `ChatHistory` returns the messages of the readable channels, merged and sorted by `sentAt`, then by id.
  - Both use `IdGenerator` and `Clock` from shared.
- `infrastructure/`:
  - `InMemoryChatLogRepository`
  - `SocketChatPublisher`, which emits `chat:message` to `memberChannel`
  - `registerChatHandlers`, built with `answer` and `withSession`

### Web chat feature (`apps/web/src/features/chat`)
- `domain/`:
  - `visibleTabs(access)`
  - `composerState(access, channel, phase)`: write, `night-closed`, `paused` or `read-only`, with the matching note
  - `unreadCounts(messages, lastSeen)`
  - `messageStyle(message, myId)`: `msg-own`, `msg-narr`, `msg-ghost`, `msg-wolf` or plain
  - `lastWordsSecondsLeft`
- `application/`:
  - A `ChatGateway` port and the `CHAT_GATEWAY` key.
  - `useChatStore`:
    - holds messages per channel, the active tab and the last-seen ids;
    - fetches the history when the game view loads and after a reconnect;
    - listens for `chat:message`;
    - `send(channel, text)` keeps failures.
  - It reads the access from `useMatchStore().view.chat`, which is allowed by the cross-feature rule.
- `infrastructure/`:
  - `SocketChatGateway` and `installChat`.
  - Components, with markup and classes from the canvas `DayChat`, `LastWords`, `Ghost` and `NarratorDashboard`:
    - `ChatBar` (`.chatbar`) and `ChatSheet` (`.sheet`, `.grabber`, `.tabs`, `.tab`, `.msgs`, `.msg`, `.bubble`,
      `.composer`, `.locked-note`).
    - `LastWordsSpotlight`, shown to everyone while a window is open and its message has arrived.
    - `LastWordsPrompt`, the dying player's composer with a countdown.
    - `NarratorChatMonitor`.
  - i18n in en and es.
  - Wiring: `PlayerTable` mounts `ChatBar` and `ChatSheet`; `NarratorDashboard` mounts `NarratorChatMonitor`.
  - Names and avatars come from the room snapshot.

## Risks / Trade-offs

- [The client clock and `lastWordsUntil` disagree] → use the same `serverNow` offset as the phase countdown, which is
  already in `useMatchStore`.
- [History grows] → capped at 200 per channel.
- [Players spam] → rate limiting is out of scope. The narrator controls the room by voice.
