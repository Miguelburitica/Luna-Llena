## Context

The web room store saves `{ code, memberId, token }` in session and local storage on every create, join or resume, and
clears it on leave, kick, room close or a rejected resume. `LobbyView` resumes through `useRoomEntry` and redirects to
the game when the room is in game. Only `HomeView` and `JoinView` ignore the saved seat. The server's `room:resume`
works in any room status, so no server or contract change is needed. Screens: `design/canvas/Home.dc.html` and
`design/canvas/Join.dc.html`; the offer reuses their `card`, `btn btn-primary btn-lg btn-block` and `sbadge` markup.

## Goals / Non-Goals

**Goals:**
- One store-level notion of "the saved seat" that both views read.
- Reuse the existing resume and lobby redirect path. Add no new navigation logic.

**Non-Goals:**
- New socket events or server state.

## Decisions

- **The store holds a reactive `savedSeat`.** It starts as `sessions.load()`, is set in `enter` and cleared in
  `forget`. A computed over `sessions.load()` would not react to `forget`. The views read `savedSeat?.code`.
- **`returnToSeat()` is `resume(savedSeat.code)`.** On success the view pushes `lobby`, and `LobbyView` already hands
  off to `game` when the room is in game. On `session-invalid` the store already forgets the seat, so the offer hides
  itself and `RoomFailureMessage` shows the existing `session-invalid` copy. On `unreachable` the seat is kept and the
  offer stays, so the member can retry.
- **Join page priority.** When `savedSeat.code` matches the complete entered code, the room card still shows. The
  closed-room notice, name field and suggestions are replaced by the return offer, and the footer button becomes
  "Return to my seat". Alternative considered: a banner above the form. Rejected because a mid-game room makes the form
  unusable anyway.
- **Home page placement.** The offer is the first button in `home-actions`, above Create and Join, with the room code in
  an `sbadge`.

## Risks / Trade-offs

- [The saved seat points to a room that ended long ago] → resuming fails with `session-invalid`, which clears it. The
  cost is one extra tap.
- [Two seats on one device, for example a narrator testing with a player tab] → the tab's own storage wins over the
  device's, as it does today in `LocalSessionStore.load`.
