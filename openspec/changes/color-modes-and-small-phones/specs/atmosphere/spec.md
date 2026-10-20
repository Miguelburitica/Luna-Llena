## MODIFIED Requirements

### Requirement: Sound and motion settings
The web app SHALL offer a Settings screen (canvas `Settings`), reachable from the home screen and from the game, with:
- master volume;
- music and ambience volume;
- sound effects volume;
- reduced motion;
- appearance (System, Light, Dark);
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

#### Scenario: Choosing the look
- **WHEN** Caro opens Settings from the home screen and picks Light under Appearance
- **THEN** the home screen behind the sheet switches to the light look right away
