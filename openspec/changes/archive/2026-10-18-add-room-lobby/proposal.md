## Why

Nothing in Luna Llena works until friends can gather in one place: a narrator opens a room, shares a link, and players
join, pick a look and get ready. The room lobby is also the first vertical slice through every layer, so it doubles as
the gold example that every later feature copies (contracts, server domain/application/infrastructure, web
domain/application/infrastructure, tests).

## What Changes

- Monorepo foundation: `apps/server` (Node + Socket.io), `apps/web` (Vue 3 SPA), `packages/contracts` (shared kernel),
  `tools/eslint-rules` (no-comments rule), lint layer boundaries, Vitest on every package, `pnpm check` gate.
- Design system imported from the Claude Design canvas (stylesheet, illustrations, fonts) into the web shared UI.
- A narrator can create a room with a name, theme, timers, house rules and a role deck, and receives a shareable code.
- Players can look up a room by code, join with a unique name, pick a unique avatar, toggle ready, leave, and resume
  their seat after a refresh or a dropped connection.
- The narrator can edit settings, kick players and start the game once the start conditions hold.
- Every member sees the lobby update live.
- Screens: Home, Join, Player lobby, Narrator setup, Narrator lobby, plus the lobby error states (name taken, room not
  found, room full, game already started, kicked, room closed).

## Capabilities

### New Capabilities
- `room-lobby`: creating, joining, resuming and leaving a room; avatars and readiness; narrator controls over
  settings, kicks and the start of the game; live lobby state and its error conditions.

### Modified Capabilities

## Impact

- New code: `packages/contracts/src/room`, `apps/server/src/features/room`, `apps/server/src/shared`,
  `apps/web/src/features/room`, `apps/web/src/shared`, `apps/web/src/app`.
- New socket events under the `room:` namespace.
- Dependencies: socket.io, socket.io-client, vue, vue-router, pinia, vue-i18n, vite, vitest, tsx, eslint.

## Non-goals

- Role catalog rules (per-role limits, suggested decks, balance meter math): the `roles` change.
- What happens after the game starts (dealing roles, phases): the `match` change. This change only flips the room to
  in-game and stops new joins.
- Persistence beyond process memory, accounts, spectators, idle-room cleanup.
