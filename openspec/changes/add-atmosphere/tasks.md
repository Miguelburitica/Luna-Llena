## 1. Contracts

- [x] 1.1 Add the sound cues, screen effects, cue input and effect, `cue-invalid`, `match:cue` and `match:cued`; verify with `tsc` in packages/contracts

## 2. Server

- [ ] 2.1 Add `Match.validateCue`, the `PlayCue` use case, `MatchPublisher.cue`, the socket publisher and the `match:cue` handler; test "Thunder on cue" (every member receives it), "Lightning", "A player tries the soundboard", `cue-invalid` and `match-over`, including a socket integration test

## 3. Web

- [ ] 3.1 Add the atmosphere domain (`ambientFor`, `stingsBetween`, `effectiveVolume`, settings defaults) with tests for "Nightfall", every sting moment, "Reload does not replay" and the volume math
- [ ] 3.2 Add the ports, `useAtmosphereStore`, the local settings store, the motion preference and the cue gateway, with store tests ("First visit", "Turning it on", cues to the engine and overlay, settings persisted, reduced motion class)
- [ ] 3.3 Add `WebAudioSoundEngine` with all ambient and sting recipes and a smoke test against a fake `AudioContext`
- [ ] 3.4 Add `SoundToggle`, `ScreenEffects`, `NarratorSoundboard` and `SettingsOverlay` following the canvas, wire them into Home, `PlayerTable`, `GameView` and `NarratorDashboard`, and add `installAtmosphere`; add component tests for the toggle, each effect and "Calm screen", the soundboard cues, and "Quieter music" persisted

## 4. Verification

- [ ] 4.1 Run `pnpm check` green
- [ ] 4.2 In the browser: turn sound on, hear the night loop, advance phases for the crossfade and stings, press soundboard cues and effects from the narrator, and toggle reduced motion
