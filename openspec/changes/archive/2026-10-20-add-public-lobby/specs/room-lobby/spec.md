## MODIFIED Requirements

### Requirement: Narrator creates a room
The system SHALL let anyone create a room by giving a room name, their own display name and, optionally, a visibility
(see `public-games`). The creator becomes the room's narrator. The system SHALL assign the room a unique code of 6
characters drawn from uppercase letters and digits, excluding the ambiguous characters 0, O, 1 and I. The creator SHALL
receive a secret session token that identifies their seat. The web app's setup screen SHALL ask "Who can find this
room?" with the choices Private (default, "Only people with the code") and Public ("Listed in Find a game").

#### Scenario: Room created with defaults
- **WHEN** Nico creates a room named "Los Primos · Viernes" without custom settings
- **THEN** the room exists with a 6-character code, Nico is its only member and is marked as narrator
- **AND** the room is private
- **AND** the settings are the defaults: theme classic, night 60s, day 180s, vote 60s, ghost powers on, last words on, reveal role on death on, anonymous votes off, and the default deck of 2 Werewolf, Seer, Doctor, Witch, Hunter, Fool and Drunk

#### Scenario: Room name is required
- **WHEN** a room is created with a blank room name
- **THEN** the system rejects it with error `room-name-invalid`

#### Scenario: Choosing public in setup
- **WHEN** Nico picks Public on the setup screen and creates the room
- **THEN** the room is public and the narrator lobby shows a "Public" badge next to the code

### Requirement: Leaving and kicking
A player SHALL be able to leave the room while it is in the lobby, which frees their seat, name and avatar. Once the
game started, leaving SHALL be rejected with error `game-already-started` and the seat stays (a player who closes the app
is shown as reconnecting). The narrator SHALL be able to kick any human player at any time:
- **In the lobby,** the kicked player is removed.
- **During a game,** a bot takes over the seat instead:
  - it keeps the same seat, role, life and the match history the seat could see;
  - it gets a free name from the room's bot cast and the narrator's chosen bot language;
  - it plays on like any bot, and does not count against the bot limit;
  - every member is told "Tato was kicked. Aureliano (bot) takes the seat."

In both cases the kicked player is told they were kicked and their token stops working. In a private room they MAY join
again as a new player. In a public room the device they joined from SHALL be barred from joining that room again, with
error `kicked`, and the kick gives them a strike (see `moderation`). Kicking a bot mid-game SHALL be rejected with
`not-a-player`; the narrator mutes it instead. If the narrator leaves, the room SHALL close and every member SHALL be
told.

#### Scenario: Player leaves
- **WHEN** Caro leaves the room
- **THEN** Caro disappears from the list and the name "Caro" is free again

#### Scenario: Narrator kicks a player
- **WHEN** the narrator kicks Tato
- **THEN** Tato is removed from the list for everyone and Tato is told they were kicked

#### Scenario: Kicked from a private room
- **WHEN** the narrator of a private room kicks Tato and Tato joins again with the code
- **THEN** Tato joins as a new player

#### Scenario: Kicked from a public room
- **WHEN** the narrator of a public room kicks Tato and Tato tries to join it again from the same device
- **THEN** the system rejects it with error `kicked`

#### Scenario: Kicked mid-game
- **WHEN** the narrator kicks Tato, a living Werewolf, during the day
- **THEN** Tato is told they were kicked, Tato's seat becomes a bot with a cast name that is still a living Werewolf in
  the same pack, and every member is told the bot took the seat

#### Scenario: The new bot plays on
- **WHEN** a bot took over Tato's seat and night falls
- **THEN** the bot acts at night like any bot with that role

#### Scenario: Kicking a bot mid-game
- **WHEN** the narrator kicks a bot during a game
- **THEN** the system rejects it with error `not-a-player`

#### Scenario: Narrator leaves
- **WHEN** the narrator leaves
- **THEN** every remaining member is told the room closed and the code no longer finds a room

#### Scenario: Leaving mid-game
- **WHEN** Caro tries to leave during a game
- **THEN** the system rejects it with error `game-already-started` and Caro keeps the seat

## ADDED Requirements

### Requirement: Clean names
Before checking length and uniqueness, the system SHALL clean display names and room names: apply Unicode
compatibility normalization, remove control characters, zero-width characters and text-direction overrides, and
collapse runs of whitespace into one space. A name that is empty after cleaning SHALL be rejected as before. The room
name of a public room SHALL NOT contain a link (`http://`, `https://` or `www.`), and SHALL be rejected with
`room-name-invalid` when it does.

#### Scenario: Invisible characters
- **WHEN** someone joins with the name "Ca​ro" (with a zero-width space)
- **THEN** the member is named "Caro" and the name counts as taken if a "Caro" is already seated

#### Scenario: Only invisible characters
- **WHEN** someone joins with a name made only of zero-width spaces
- **THEN** the system rejects it with error `name-invalid`

#### Scenario: Link in a public room name
- **WHEN** a public room is created with the name "Free coins at www.spam.example"
- **THEN** the system rejects it with error `room-name-invalid`

#### Scenario: Link in a private room name
- **WHEN** a private room is created with the name "Notas en www.example.com"
- **THEN** the room is created

### Requirement: Muting players
The narrator SHALL be able to mute and unmute any player, human or bot, in the lobby or during the game. Every member
SHALL see who is muted. A muted player cannot write in any chat channel (see `chat`). Muting the narrator or an unknown
member SHALL be rejected with `member-not-found`; a player trying to mute SHALL get `not-narrator`. The narrator
dashboard SHALL show a mute toggle on each player row, and a muted player SHALL show a muted icon.

#### Scenario: Narrator mutes a player
- **WHEN** the narrator mutes Tato during the day
- **THEN** every member sees Tato as muted and Tato's next message is rejected

#### Scenario: Unmute
- **WHEN** the narrator unmutes Tato
- **THEN** Tato can write again

#### Scenario: Player tries to mute
- **WHEN** Caro, a player, tries to mute Tato
- **THEN** the system rejects it with error `not-narrator`

### Requirement: Room cleanup
The system SHALL close abandoned rooms on its own, checking at least once a minute:
- a room whose narrator has been disconnected for 10 minutes;
- a room in the lobby that has had no change for 60 minutes;
- a room, in the lobby or in a game, where no human member has been connected for 5 minutes.

Closing works like the narrator leaving: every member still connected is told the room closed, the code stops finding
it, its match and chat are discarded, and it leaves the public list. A closed public room no longer counts toward its
creator's public room cap.

#### Scenario: Narrator never comes back
- **WHEN** the narrator's connection drops and 10 minutes pass without them resuming
- **THEN** the room closes and its members are told

#### Scenario: Narrator back in time
- **WHEN** the narrator's connection drops and they resume after 4 minutes
- **THEN** the room stays open

#### Scenario: Idle lobby
- **WHEN** a lobby has no joins, readiness, settings or other changes for 60 minutes
- **THEN** the room closes

#### Scenario: Only bots left
- **WHEN** every human, the narrator included, has been disconnected for 5 minutes in a game with bots
- **THEN** the room closes and the bots stop

#### Scenario: Cleanup frees the cap
- **WHEN** one of Nico's 2 public rooms is closed by cleanup
- **THEN** Nico can create another public room
