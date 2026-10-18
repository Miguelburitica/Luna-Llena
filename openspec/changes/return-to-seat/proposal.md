## Why

In playtests, a player who pressed the phone's back button mid-game could not get back in. Their seat and session
token were still kept on the device and on the server, but the join page only offers a fresh join. A running game
rejects a fresh join with "This village is mid-game", and the home page doesn't know about the saved seat either.

## What Changes

- **Home page:** when the device holds a seat, it shows a "Return to your seat" action naming the room code.
- **Join page:** when the code being joined matches the saved seat, it offers "Return to my seat" instead of the name
  form and the "mid-game" notice.
- **Returning:** choosing it resumes the seat and lands the member in the lobby, or in the game when one is running.
- **Stale seat:** if the seat is gone (kicked, room closed or server restarted), the member is told the seat is gone,
  the saved seat is forgotten and the normal join form comes back.

## Capabilities

### New Capabilities

### Modified Capabilities
- `room-lobby`: adds the return-to-seat offer on the home and join pages on top of session resume.

## Impact

- Server: none. `room:resume` already restores any seat in any room status.
- Contracts: none.
- Web, `features/room`:
  - `application/useRoomStore.ts`: exposes the saved seat and a `returnToSeat` action;
  - `infrastructure/views/HomeView.vue` and `JoinView.vue`: the return offer;
  - `infrastructure/i18n/roomMessages.ts`: en and es copy.

## Non-goals

- Reclaiming a seat from a different device or browser that never held the token, for example after opening the link
  in another app's in-app browser.
- Changing what the browser's back button does inside the game.
- Joining a running game as a new player.
