# atmosphere Specification

## Purpose
Atmosphere is the sound and screen mood of a game: what each phase sounds like, the stings on dramatic moments, and
the narrator's tools to make everyone jump, all under each player's control.

## Requirements

### Requirement: Sound starts off and is unlocked by a tap
On each device, sound SHALL be off until the player turns it on with a sound toggle on the game screen. The toggle
SHALL also unlock audio in the browser. The choice SHALL be remembered on the device, but a remembered "on" still needs
a tap per visit where the browser requires one; until then the toggle shows "Tap for sound". Turning it off silences
everything at once.

#### Scenario: First visit
- **WHEN** Caro opens the game for the first time
- **THEN** no sound plays and the toggle offers to turn sound on

#### Scenario: Turning it on
- **WHEN** Caro taps the sound toggle
- **THEN** the ambient loop of the current phase starts

### Requirement: Ambient loop per phase
While sound is on, each phase SHALL have its own ambient loop:

| Phase | Loop |
|---|---|
| night | wind and crickets |
| dawn | soft rising pad |
| day | light village pad |
| vote | heartbeat pulse |
| execution | low drone |

When the phase changes, the loops SHALL crossfade over about 1.5 seconds. At the end of the game the loop SHALL fade
out.

#### Scenario: Nightfall
- **WHEN** the phase changes from execution to night with sound on
- **THEN** the drone crossfades into wind and crickets

### Requirement: Automatic stings
While sound is on, the game SHALL play a sting on these moments, for every member:

| Moment | Sting |
|---|---|
| Night begins | howl |
| Dawn with at least one death | church bell |
| Dawn with no deaths | rooster |
| The vote is revealed | drumroll |
| A player is executed | scream |
| The vote is a tie, or the Fool wins | sad trombone |

A sting SHALL play once per moment, not again after a reload or reconnect.

#### Scenario: A death at dawn
- **WHEN** dawn comes with one death and sound is on
- **THEN** a church bell plays once

#### Scenario: Reload does not replay
- **WHEN** Caro reloads during that dawn
- **THEN** the bell does not play again

### Requirement: Narrator soundboard and screen effects
The narrator SHALL be able to play any of the sound cues Howl, Thunder, Church bell, Suspense, Scream, Rooster,
Drumroll and Sad trombone, and any of the screen effects Lightning, Fog and Shake, for every member at once. Cues SHALL
work in any phase while the game runs. A cue from anyone else SHALL be rejected with `not-narrator`. An unknown cue
SHALL be rejected with `cue-invalid`. Screen effects SHALL play even when sound is off. Sound cues play only for members
with sound on.

#### Scenario: Thunder on cue
- **WHEN** the narrator presses Thunder during the day
- **THEN** every member with sound on hears thunder

#### Scenario: Lightning
- **WHEN** the narrator presses Lightning
- **THEN** every member's screen flashes white once

#### Scenario: A player tries the soundboard
- **WHEN** Caro sends a cue
- **THEN** the system rejects it with error `not-narrator`

### Requirement: Sound and motion settings
The web app SHALL offer a Settings screen (canvas `Settings`), reachable from the home screen and from the game, with:
- master volume;
- music and ambience volume;
- sound effects volume;
- reduced motion;
- language;
- How to play;
- Leave the village. During a game a player cannot leave, so this action becomes "Back home — your seat is kept": it
  only navigates home and the seat stays, shown as reconnecting. For the narrator it still leaves, which closes the
  room.

The settings SHALL be remembered on the device. Reduced motion SHALL apply app-wide, and SHALL default to the operating
system preference. It replaces flips, drops, flicker, shake, lightning and fog drifting with short fades.

#### Scenario: Quieter music
- **WHEN** Caro lowers music and ambience to 20%
- **THEN** the ambient loop plays at 20% of the master volume and stings stay at the effects volume

#### Scenario: Back home mid-game
- **WHEN** Caro, a player, opens Settings during a game and presses the leave action
- **THEN** Caro goes home, the seat is kept, and nothing is sent to leave the room

#### Scenario: Calm screen
- **WHEN** Caro turns reduced motion on and the narrator triggers Shake
- **THEN** Caro's screen does not shake and shows a short fade instead
