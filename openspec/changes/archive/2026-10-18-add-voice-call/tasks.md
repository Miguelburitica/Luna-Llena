## 1. Contracts

- [x] 1.1 Add `voiceCallUrl` to the snapshot, summary and create input, plus `room:setVoiceCall`, `voice-call-invalid` and the length limit; verify with `tsc` in packages/contracts

## 2. Server room feature

- [x] 2.1 Add the `VoiceCallUrl` value object; test "Not secure", "Not a link", "Hidden credentials", the length limit, trimming, and an empty value clearing the link
- [x] 2.2 Add the voice call to `Room.open` and `Room.setVoiceCall`, `CreateRoom`, the `SetVoiceCall` use case, the snapshot and summary mapping, and the `room:setVoiceCall` handler; test "Link at creation", "Changing the link mid-game", "Removing the link", "A player tries to change it", and that the link survives Play again

## 3. Web

- [x] 3.1 Add `src/shared/domain/voiceCall.ts` with tests ("Discord recognised", "Unknown provider", every host rule, "One-click call"), `JoinCallButton`, the `i-phone` icon, and the room gateway and store `setVoiceCall`
- [x] 3.2 Add the voice call field in setup (create mode), `VoiceCallPanel` in `NarratorLobby`, and the button in `JoinView`, `PlayerLobby`, `PlayerTable` and `NarratorDashboard`, plus `MicsOffReminder`; add component tests for "No link yet", "Nightfall reminder", "No call, no reminder", the panel's save, remove and free call, and the link opening in a new tab with `noopener`

## 4. Verification

- [x] 4.1 Run `pnpm check` green
- [x] 4.2 In the browser: create a room with a link, create a free call from the lobby, see "Join on Jitsi" on a player tab and the game table, change the link mid-game, and see the mics-off reminder at night
