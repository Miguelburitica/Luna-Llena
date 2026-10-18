# room-lobby Specification

## Purpose
The room lobby is where a game is assembled: the narrator opens a room and configures it, friends join through a code
or invite link, choose a look and get ready, and the narrator starts the game once everything is in place.

## Requirements

### Requirement: Narrator creates a room
The system SHALL let anyone create a room by giving a room name and their own display name. The creator becomes the
room's narrator. The system SHALL assign the room a unique code of 6 characters drawn from uppercase letters and
digits, excluding the ambiguous characters 0, O, 1 and I. The creator SHALL receive a secret session token that
identifies their seat.

#### Scenario: Room created with defaults
- **WHEN** Nico creates a room named "Los Primos · Viernes" without custom settings
- **THEN** the room exists with a 6-character code, Nico is its only member and is marked as narrator
- **AND** the settings are the defaults: theme classic, night 60s, day 180s, vote 60s, ghost powers on, last words on, reveal role on death on, anonymous votes off, and the default deck of 2 Werewolf, Seer, Doctor, Witch, Hunter, Fool and Drunk

#### Scenario: Room name is required
- **WHEN** a room is created with a blank room name
- **THEN** the system rejects it with error `room-name-invalid`

### Requirement: Room settings
A room's settings SHALL consist of a theme, three phase timers, four house rules and a role deck. The theme SHALL be
`classic` (other themes are announced but locked). Timers SHALL only take these values in seconds, where 0 means the
narrator advances manually: night 0, 45, 60 or 90; day 0, 120, 180 or 300; vote 0, 30, 60 or 90. The house rules are
ghost powers, last words, reveal role on death and anonymous votes, each on or off. The deck SHALL map known role ids
to whole counts from 0 to 15 with a total of at most 15 cards. Only the narrator SHALL change settings, and only while
the room is in the lobby.

#### Scenario: Narrator updates timers
- **WHEN** the narrator sets the day timer to 300 seconds
- **THEN** every member sees the new day timer

#### Scenario: Timer value outside the allowed set
- **WHEN** the narrator sets the vote timer to 45 seconds
- **THEN** the system rejects it with error `settings-invalid` and the settings are unchanged

#### Scenario: Locked theme
- **WHEN** the narrator selects the `colombia` theme
- **THEN** the system rejects it with error `settings-invalid`

#### Scenario: Player tries to change settings
- **WHEN** a player who is not the narrator updates the settings
- **THEN** the system rejects it with error `not-narrator`

### Requirement: Room lookup by code
The system SHALL let anyone look up a room by code, ignoring letter case and surrounding spaces, and return its public
summary: room name, narrator name, theme, number of players, capacity, the avatars already in use and whether it is
still accepting players.

#### Scenario: Room found
- **WHEN** someone looks up `luna42` and room `LUNA42` exists with 5 players
- **THEN** they receive the room name, the narrator name, theme classic, 5 players of 15 and the avatars in use

#### Scenario: Room not found
- **WHEN** someone looks up a code that does not exist
- **THEN** the system answers with error `room-not-found`

### Requirement: Player joins a room
The system SHALL let a person join a room in the lobby with a display name. Names SHALL be 1 to 20 characters after
trimming and unique within the room ignoring letter case, the narrator included. A room SHALL hold at most 15 players
plus the narrator. Joining SHALL return a secret session token for the new seat.

#### Scenario: Successful join
- **WHEN** Caro joins room `LUNA42` in the lobby
- **THEN** Caro becomes a player who is not ready and has no avatar, and every member sees Caro in the list

#### Scenario: Name already taken
- **WHEN** someone joins with the name "ana" while "Ana" is in the room
- **THEN** the system rejects it with error `name-taken` and offers up to 3 free alternative names derived from the requested one

#### Scenario: Invalid name
- **WHEN** someone joins with a blank name or one longer than 20 characters
- **THEN** the system rejects it with error `name-invalid`

#### Scenario: Room full
- **WHEN** someone joins a room that already has 15 players
- **THEN** the system rejects it with error `room-full`

#### Scenario: Game already started
- **WHEN** someone joins a room whose game has started
- **THEN** the system rejects it with error `game-already-started`

### Requirement: Session resume
The system SHALL let a member reclaim their seat with the room code and their session token, for example after
reloading the page or losing the connection. The member keeps their name, avatar and readiness. An unknown token SHALL
be rejected with error `session-invalid`.

#### Scenario: Reload during the lobby
- **WHEN** Caro reloads the page and resumes with their token
- **THEN** Caro is back in the same seat, marked connected, with the same avatar and readiness unchanged

#### Scenario: Token from a kicked seat
- **WHEN** a kicked player tries to resume with their old token
- **THEN** the system rejects it with error `session-invalid`

### Requirement: Avatars
The room SHALL offer the avatars ana, caro, juan, luis, marta, nico, pipe, sofi, tato and vale. Any member, the
narrator included, MAY pick one avatar or none, and MAY change it while in the lobby. No two members SHALL hold the
same avatar.

#### Scenario: Pick a free avatar
- **WHEN** Caro picks the avatar `caro`
- **THEN** every member sees Caro with that avatar and it shows as taken for everyone else

#### Scenario: Avatar already taken
- **WHEN** Caro picks an avatar held by Ana
- **THEN** the system rejects it with error `avatar-taken`

### Requirement: Readiness
Players SHALL be able to mark themselves ready or not ready while in the lobby. The narrator SHALL have no readiness.

#### Scenario: Player gets ready
- **WHEN** Caro marks themselves ready
- **THEN** every member sees Caro as ready

### Requirement: Presence
The system SHALL mark a member as disconnected when their connection drops and as connected when they resume. A
disconnected member SHALL keep their seat.

#### Scenario: Connection drops
- **WHEN** Tato's connection drops
- **THEN** every member sees Tato as reconnecting and Tato keeps the seat

### Requirement: Leaving and kicking
A player SHALL be able to leave the room, which frees their seat, name and avatar. The narrator SHALL be able to kick
any player while in the lobby; the kicked player is removed, told they were kicked, and their token stops working,
though they MAY join again as a new player. If the narrator leaves, the room SHALL close and every member SHALL be told.

#### Scenario: Player leaves
- **WHEN** Caro leaves the room
- **THEN** Caro disappears from the list and the name "Caro" is free again

#### Scenario: Narrator kicks a player
- **WHEN** the narrator kicks Tato
- **THEN** Tato is removed from the list for everyone and Tato is told they were kicked

#### Scenario: Narrator leaves
- **WHEN** the narrator leaves
- **THEN** every remaining member is told the room closed and the code no longer finds a room

### Requirement: Start conditions
The narrator SHALL be able to start the game only when all of these hold: at least 6 players (the narrator does not
count), the deck holds exactly one card per player, and every player is ready and connected. Every member SHALL see
whether the room can start and, when it cannot, which conditions are unmet and which players are not ready.

#### Scenario: Ready to start
- **WHEN** the room has 7 players who are all ready and connected and the deck holds 7 cards
- **THEN** the room shows it can start

#### Scenario: Deck does not match the players
- **WHEN** the room has 7 players and the deck holds 8 cards
- **THEN** the room shows the unmet condition `deck-mismatch`

#### Scenario: Not everyone is ready
- **WHEN** Marta is not ready and Tato is disconnected
- **THEN** the room shows the unmet condition `players-not-ready` naming Marta and Tato

#### Scenario: Too few players
- **WHEN** the room has 5 players
- **THEN** the room shows the unmet condition `not-enough-players`

### Requirement: Game start
When the narrator starts a room whose start conditions hold, the room SHALL move to the in-game status, stop accepting
new players, and every member SHALL be told the game started. Starting with unmet conditions SHALL be rejected with
error `start-conditions-unmet`; a player trying to start SHALL get `not-narrator`.

#### Scenario: Narrator starts the game
- **WHEN** the narrator starts a room that can start
- **THEN** the room status is in-game for every member

#### Scenario: Start with unmet conditions
- **WHEN** the narrator starts a room with a deck mismatch
- **THEN** the system rejects it with error `start-conditions-unmet` and the room stays in the lobby

### Requirement: Live lobby view
Every member SHALL receive the full lobby state whenever it changes: code, room name, status, settings, the members
(name, avatar, narrator or player, ready, connected) and the start readiness. Session tokens SHALL never be shared with
other members.

#### Scenario: Another player joins
- **WHEN** Pipe joins while Caro is in the lobby
- **THEN** Caro's lobby shows Pipe without reloading

### Requirement: Invite link and remembered seat
The web app SHALL offer an invite link of the form `/join/<CODE>` that opens the join screen with the code filled in.
The app SHALL remember the member's seat per browser tab, so a reload returns each tab to its own seat, and SHALL
also keep the last seat used on the device so a reopened tab can find its way back. Only the narrator SHALL reach the
settings screen of a room. The app SHALL offer Spanish and English and remember the chosen language.

#### Scenario: Opening an invite link
- **WHEN** Caro opens `/join/LUNA42`
- **THEN** the join screen shows the code LUNA42 and the room it found

#### Scenario: Reloading the lobby
- **WHEN** Caro reloads the lobby page
- **THEN** the app resumes the seat and shows the lobby again

#### Scenario: Two seats on one device
- **WHEN** the narrator and a player use two tabs of the same browser and the narrator's tab reloads
- **THEN** the narrator's tab resumes the narrator seat, not the player's

#### Scenario: Player opens the settings screen
- **WHEN** a player opens the settings address of their room
- **THEN** the app sends them back to the lobby
