## MODIFIED Requirements

### Requirement: Room settings
A room's settings SHALL consist of a theme, three phase timers, four house rules and a role deck. The theme SHALL be
`classic` (other themes are announced but locked). Timers SHALL only take these values in seconds, where 0 means the
narrator advances manually: night 0, 45, 60 or 90; day 0, 120, 180 or 300; vote 0, 30, 60 or 90. The house rules are
ghost powers, last words, reveal role on death and anonymous votes, each on or off. The deck SHALL map known role ids
to whole counts within each role's copies-per-deck limit from the role catalog, with a total of at most 15 cards. Only
the narrator SHALL change settings, and only while the room is in the lobby.

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

#### Scenario: Role over its limit
- **WHEN** the narrator sets the deck to 5 Werewolves
- **THEN** the system rejects it with error `settings-invalid`

### Requirement: Start conditions
The narrator SHALL be able to start the game only when all of these hold: at least 6 players (the narrator does not
count), the deck holds exactly one card per player, the deck holds at least one Werewolf, and every player is ready and
connected. Every member SHALL see whether the room can start and, when it cannot, which conditions are unmet and which
players are not ready.

#### Scenario: Ready to start
- **WHEN** the room has 7 players who are all ready and connected and the deck holds 7 cards with at least one Werewolf
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

#### Scenario: A deck without wolves
- **WHEN** the deck holds 7 Villagers for 7 players
- **THEN** the room shows the unmet condition `no-wolves`

### Requirement: Game start
When the narrator starts a room whose start conditions hold, the room SHALL move to the in-game status, stop accepting
new players, open the match (see `role-assignment` and `game-phases`), and every member SHALL be told the game started.
Starting with unmet conditions SHALL be rejected with error `start-conditions-unmet`; a player trying to start SHALL get
`not-narrator`. The web app SHALL take every member from the lobby to the game screen once the game started.

#### Scenario: Narrator starts the game
- **WHEN** the narrator starts a room that can start
- **THEN** the room status is in-game for every member and the match begins at Night 1

#### Scenario: Start with unmet conditions
- **WHEN** the narrator starts a room with a deck mismatch
- **THEN** the system rejects it with error `start-conditions-unmet` and the room stays in the lobby

#### Scenario: Lobby screens follow the start
- **WHEN** the game starts while Caro is on the lobby screen
- **THEN** Caro's app opens the game screen with the role card

### Requirement: Leaving and kicking
A player SHALL be able to leave the room while it is in the lobby, which frees their seat, name and avatar. Once the
game started, leaving SHALL be rejected with error `game-already-started` and the seat stays (a player who closes the app
is shown as reconnecting). The narrator SHALL be able to kick any player while in the lobby; the kicked player is
removed, told they were kicked, and their token stops working, though they MAY join again as a new player. If the
narrator leaves, the room SHALL close and every member SHALL be told.

#### Scenario: Player leaves
- **WHEN** Caro leaves the room
- **THEN** Caro disappears from the list and the name "Caro" is free again

#### Scenario: Narrator kicks a player
- **WHEN** the narrator kicks Tato
- **THEN** Tato is removed from the list for everyone and Tato is told they were kicked

#### Scenario: Narrator leaves
- **WHEN** the narrator leaves
- **THEN** every remaining member is told the room closed and the code no longer finds a room

#### Scenario: Leaving mid-game
- **WHEN** Caro tries to leave during a game
- **THEN** the system rejects it with error `game-already-started` and Caro keeps the seat
