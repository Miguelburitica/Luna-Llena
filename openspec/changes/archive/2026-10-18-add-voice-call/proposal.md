## Why

Luna Llena relies on an external voice call (Discord, Google Meet, Zoom, WhatsApp, Jitsi) for table talk, but today
every group has to share that link somewhere else. Putting the call one tap away inside the game gets everyone talking
faster, and nobody gets lost between apps.

## What Changes

- A room can have one voice call link.
  - The narrator can add it when creating the room, or change or remove it later, even mid-game.
  - Only `https://` links are accepted.
  - A "Create a free call" button fills in a Jitsi room named after the room code, which needs no account.
- "Join the call" appears on four screens: the Join screen's "Room found" card, the player lobby, the game table and
  the narrator dashboard.
  - The button names the provider it recognises (Discord, Google Meet, Zoom, WhatsApp, Jitsi).
  - It opens the call in a new tab. The call is never embedded.
- At nightfall every player sees a short reminder: "Night falls — mics off". It is a nudge only; the game does not
  control microphones.

## Capabilities

### New Capabilities
- `voice-call`: the room's voice call link, who sets it, how it is validated and shown, and the night reminder.

### Modified Capabilities

## Impact

- Contracts:
  - `voiceCallUrl` on `RoomSnapshot`, `RoomSummary` and `CreateRoomInput`.
  - A `room:setVoiceCall` event.
  - A `voice-call-invalid` error.
  - A `ROOM_LIMITS.maxVoiceCallUrlLength` limit.
- Server: a room `VoiceCallUrl` value object, plus `Room.setVoiceCall` and a `SetVoiceCall` use case.
- Web:
  - A shared voice-call helper (provider detection and the Jitsi link) and a shared `JoinCallButton`.
  - A voice call field in setup and a voice call panel in the narrator lobby and dashboard.
  - The night reminder on the game table.

## Non-goals

- Embedding the call, creating calls through provider APIs, or controlling microphones.
- Per-team calls (a separate wolves call).
- Brand logos. Providers are named in text with generic icons.
