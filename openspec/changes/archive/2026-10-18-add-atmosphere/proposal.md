## Why

The game looks like a storybook but it is silent, and the narrator has no way to set the mood except their voice.
Sound and a few screen effects turn a round of clicks into a scary, silly campfire night:
- a phase you can hear;
- a toll for the dead;
- a drumroll before the verdict;
- the narrator's thunder at just the right moment.

## What Changes

- **Ambient loops:** each phase has a gentle ambient loop that crossfades when the phase changes:
  - night: wind and crickets;
  - dawn: a soft rising pad;
  - day: a light village pad;
  - vote: a heartbeat pulse;
  - execution: a low drone.
- **Automatic stings** play on game moments:
  - a howl at nightfall;
  - a bell at a dawn with deaths;
  - a rooster at a dawn with none;
  - a drumroll at the vote reveal;
  - a gasp at an execution;
  - a sad trombone for a tie or a Fool's win.
- **Narrator soundboard:** the narrator can play Howl, Thunder, Church bell, Suspense, Scream, Rooster, Drumroll and
  Sad trombone. They can also trigger Lightning, Fog and Shake on every screen.
- **Settings screen** (canvas `Settings`):
  - master volume;
  - music and ambience volume;
  - sound effects volume;
  - reduced motion;
  - language.

  These are remembered on the device. Reduced motion also calms flips, drops and flicker app-wide.
- **Sound on demand:** browsers only allow audio after a tap, so the game shows a sound toggle that unlocks audio.
  Sound stays off until the player turns it on.
- All sounds are synthesized in the browser, so there are no audio files and no licensing.

## Capabilities

### New Capabilities
- `atmosphere`: ambient loops, automatic stings, the narrator's soundboard and screen effects, the sound and motion
  settings, and audio unlocking.

### Modified Capabilities

## Impact

- Contracts:
  - `SOUND_CUES`, `SCREEN_EFFECTS`, `CueInput` and `CueEffect`;
  - the `cue-invalid` error;
  - the `match:cue` and `match:cued` events.
- Server: a narrator-only `PlayCue` use case in the match feature that relays cues to every member.
- Web: a new `atmosphere` feature (domain, application and infrastructure), a Settings overlay, the narrator soundboard
  in the dashboard, and screen-effect overlays on the game table.

## Non-goals

- Recorded audio, music tracks or voice lines.
- Per-player custom sounds, or sounds in the lobby.
- Haptics or vibration.
