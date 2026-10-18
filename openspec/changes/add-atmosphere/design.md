## Context

The contracts are written and frozen:
- `packages/contracts/src/match/cues.ts`: `SOUND_CUES`, `SCREEN_EFFECTS`, `CueInput` and `CueEffect`;
- the `cue-invalid` error;
- client `match:cue` (`CueInput`), acknowledged with void;
- server `match:cued` (`CueEffect`), sent to every member.

The canvas `Settings` and `Motion` boards describe the settings screen and the motion language.

## Goals / Non-Goals

**Goals:**
- Atmosphere is almost entirely a client feature. The server only relays the narrator's cues.
- Sound is synthesized with the Web Audio API, so there are no assets.
- Everything sits behind ports so it is testable in jsdom.

**Non-Goals:** see proposal.md, Non-goals.

## Decisions

### Server: relay narrator cues
`Match.validateCue(actorId, input: unknown)` is a pure check:
- the narrator only, otherwise `not-narrator`;
- `match-over` after the outcome;
- the input must be `{ kind: 'sound', sound ∈ SOUND_CUES }` or `{ kind: 'effect', effect ∈ SCREEN_EFFECTS }`, otherwise
  `cue-invalid`.

It changes no state.

The use case `PlayCue`:
1. finds the actor's match;
2. validates the cue;
3. builds a `CueEffect` with an `IdGenerator` id and `Clock` time;
4. calls a new `MatchPublisher.cue(code, memberIds, effect)`, which sends it to the narrator and every seat.

There is no save and no view publish. `SocketMatchPublisher.cue` emits `match:cued` to each `memberChannel`.
`registerMatchHandlers` handles `match:cue` with `answer`.

### Web: a new `atmosphere` feature
**`domain/`** holds pure functions:
- `ambientFor(phase)` returns the ambient id per the spec table, or `none` after the outcome.
- `stingsBetween(previous, next)`:
  - it compares two consecutive `MatchView`s and returns the sting ids per the spec table;
  - it fires on a change of phase or round, a new `dawn` report, a new `verdict` (`executedId`, `tie`, `foolWins`) and
    a new outcome with a solo winner;
  - it never fires for the first view after mount, which is the reload rule.
- `effectiveVolume(settings, channel)` returns master × channel volume, in 0..1.
- `soundSettingsDefaults(prefersReducedMotion)`.

**`application/`** holds the ports and the store:
- `SoundEngine` port: `unlock()`, `setAmbient(id, volume)`, `play(sound, volume)`, `stopAll()`.
- `AtmosphereSettingsStore` port: `load` and `save`, on the device storage area.
- `CueGateway` port: `cue(input)`, `onCue(listener)`.
- `useAtmosphereStore`:
  - its state is `settings`, `soundOn`, `unlocked`, `activeEffect`;
  - it watches `useMatchStore().view`, calls `stingsBetween` and `ambientFor`, and drives the engine;
  - it handles cues: sounds go to the engine, effects set `activeEffect` for the overlay;
  - it applies the `reduced` class on `document.documentElement` through an injected `MotionPreference` port, so
    `.reduced` from `design-system.css` works app-wide.

**`infrastructure/`**:
- `WebAudioSoundEngine` builds synth recipes on an `AudioContext` created on `unlock()` and gain-staged through
  master/music/effects gains:
  - **night:** filtered noise wind plus a chirp loop for crickets;
  - **dawn:** a slow-attack sine pad;
  - **day:** a triangle pad with soft chime notes;
  - **vote:** a heartbeat from two low thumps every ~900ms;
  - **execution:** a low detuned saw drone, lowpassed;
  - **howl:** a sine glide 300→600→450 Hz with vibrato;
  - **thunder:** a lowpassed noise burst with a long decay;
  - **bell:** inharmonic sine partials with exponential decay;
  - **suspense:** a rising filtered drone over 3 s;
  - **scream:** a fast saw glide up with formant bandpass, kept short and not harsh;
  - **rooster:** three quick square chirps;
  - **drumroll:** rapid noise ticks for 1.8 s with a final hit;
  - **trombone:** four descending saw notes with a lowpass "wah".

  Peaks stay soft: every sting goes through a limiter (`DynamicsCompressorNode`). The ambient crossfade is 1.5 s.
- `LocalAtmosphereSettingsStore` (try/catch storage) and `DocumentMotionPreference`.
- `SocketCueGateway` and `installAtmosphere(app, socket)`.
- Components:
  - `SoundToggle`, an icon button in the game banner for players and in the dashboard bar for the narrator, showing
    "Tap for sound" while locked;
  - `ScreenEffects`, a fixed overlay:
    - lightning: one white flash of about 250 ms;
    - fog: a drifting fog layer for about 6 s;
    - shake: the `.a-shake` class on the game root for about 600 ms;
    - with reduced motion: a short fade instead;
  - `NarratorSoundboard`, the canvas `NarratorDashboard` soundboard tiles (`.tile`, with `.is-playing` while active),
    the effect buttons, and a master volume slider;
  - `SettingsOverlay` (canvas `Settings`) with sliders, the reduced-motion toggle, the language switch, How to play and
    Leave. It opens from a settings button on Home, the player table and the dashboard.
- i18n in en and es.

### Testing
- **Domain:** the ambient table, every sting rule including "Reload does not replay" (no first-view stings), and the
  volume math.
- **Store:** a fake `SoundEngine` records calls; a fake `CueGateway` and fake match views drive it.
- **Components:** the toggle states, the overlay classes for each effect and for reduced motion, the soundboard sending
  cues, and the settings persisting.
- The `WebAudioSoundEngine` is not unit tested against real audio. A smoke test runs each recipe against a minimal
  fake `AudioContext` and checks that nodes are created and that `play` never throws.

## Risks / Trade-offs

- [Synth sounds can feel cheap] → short, soft and well-enveloped stings. The comedy tone forgives a lot.
- [Autoplay rules] → audio is only created after the toggle tap.
- [Loud surprises] → default volumes are master 80%, music 55% and effects 100%, all behind a compressor.
