## Context

The call link belongs to the room, not to the game, so it survives Play again. The contracts are written and frozen:
- `RoomSnapshot.voiceCallUrl` and `RoomSummary.voiceCallUrl` (`string | null`).
- `CreateRoomInput.voiceCallUrl?`.
- The `room:setVoiceCall` event, taking `{ url: string | null }`.
- The `voice-call-invalid` error.
- `ROOM_LIMITS.maxVoiceCallUrlLength`, set to 300.

## Goals / Non-Goals

**Goals:** a small slice through the room feature on both sides, plus one shared UI piece used by room and match views.
**Non-Goals:** see proposal.md, Non-goals.

## Decisions

### Separate from settings
The link is a room property, not part of `RoomSettings`. Settings lock once the game starts, but the link must be
changeable mid-game. A separate `room:setVoiceCall` command keeps the settings rule untouched.
*Alternative:* allow a settings update during the game for one field. Rejected, because it splits the settings rule.

### Server (room feature)
- `domain/VoiceCallUrl.ts` is a value object with `parse(unknown)`:
  - `null`, `undefined` and an empty string mean no link;
  - any other value must be a string that, once trimmed, is no longer than the limit and parses with `new URL`;
  - the protocol must be `https:`, with a non-empty hostname and empty `username` and `password`;
  - it stores the parsed `href`;
  - anything else returns err `voice-call-invalid`.
- `Room.open` takes an optional voice call, and `Room.setVoiceCall(actorId, url)` is narrator only, in any status.
- `CreateRoom` parses `input.voiceCallUrl`.
- A new `SetVoiceCall` use case built on `changeRoomAs`.
- `toRoomSnapshot` and `toRoomSummary` map the field.
- `registerRoomHandlers` handles `room:setVoiceCall` through `asActor`.

### Web
- `src/shared/domain/voiceCall.ts` holds pure helpers (no framework imports), a new shared domain folder on the web:
  - `providerOf(url)` returns `'discord' | 'meet' | 'zoom' | 'whatsapp' | 'jitsi' | 'other'` from the hostname rules
    in the spec;
  - `freeCallFor(code)` returns `https://meet.jit.si/LunaLlena-<CODE>`.
- `src/shared/infrastructure/ui/components/JoinCallButton.vue`:
  - an `<a class="btn ..." target="_blank" rel="noopener noreferrer">`;
  - its label comes from shared i18n `voiceCall.join.<provider>`;
  - a `compact` variant for top bars;
  - a new `i-phone` mask icon in `design-system.css`, in the same data-URI stroke style as the other `.i-*` icons.
- Room feature:
  - `RoomGateway.setVoiceCall` and `useRoomStore.setVoiceCall`, with failures kept;
  - `CreateRoomInput` gets `voiceCallUrl` from a new "Voice call (optional)" field in `RoomSetupView`, create mode
    only, with a "Create a free call" button. The code is not known before creation, so the button there fills a
    placeholder that the server sees only after creation. The setup field therefore offers the free call only in the
    lobby panel; in create mode it is a plain optional field.
  - `VoiceCallPanel.vue` sits in the room's infrastructure components and is shown in `NarratorLobby`:
    - an input with Save and Remove;
    - a "Create a free call" button that fills `freeCallFor(code)`;
    - copy-link and `JoinCallButton`;
    - errors.
  - `JoinView` shows `JoinCallButton` in the "Room found" card when `summary.voiceCallUrl` is set.
  - `PlayerLobby` shows it in the header area.
- Match feature:
  - `PlayerTable` shows a compact `JoinCallButton` in the top bar.
  - `NarratorDashboard` shows the button plus a small edit affordance that calls the room store's `setVoiceCall`
    (cross-feature application use is allowed), or "Add a voice call" when empty.
  - `MicsOffReminder.vue` is shown when the phase is `night` and the room has a link. Dismissing it is remembered per
    tab and round in sessionStorage, using the key `luna-llena.mics.<CODE>.<round>`.
- All copy is in en and es.

## Risks / Trade-offs

- [A malicious link from a narrator] → only https links are accepted, they open with `noopener noreferrer`, they are
  never embedded, and the narrator is a friend of the group anyway.
- [Provider host lists change] → unknown hosts still work as "Join the call".
