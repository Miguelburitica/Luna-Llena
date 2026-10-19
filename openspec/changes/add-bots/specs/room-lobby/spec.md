## MODIFIED Requirements

### Requirement: Room settings
A room's settings SHALL consist of a theme, three phase timers, four house rules, a role deck and a bot language.
- **Theme:** SHALL be `classic`. Other themes are announced but locked.
- **Timers:** SHALL only take these values in seconds, where 0 means the narrator advances manually:
  - night 0, 45, 60 or 90;
  - day 0, 120, 180 or 300;
  - vote 0, 30, 60 or 90.
- **House rules:** ghost powers, last words, reveal role on death and anonymous votes, each on or off.
- **Deck:** SHALL map known role ids to whole counts within each role's copies-per-deck limit from the role catalog,
  with a total of at most 15 cards.
- **Bot language:** SHALL be `es` or `en`, with `es` by default.

Only the narrator SHALL change settings, and only while the room is in the lobby.

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

#### Scenario: Bots speak English
- **WHEN** the narrator sets the bot language to `en`
- **THEN** every member sees the bot language `en`

#### Scenario: Unknown bot language
- **WHEN** the narrator sets the bot language to `fr`
- **THEN** the system rejects it with error `settings-invalid`

### Requirement: Readiness
Players SHALL be able to mark themselves ready or not ready while in the lobby. The narrator SHALL have no readiness.
Bots SHALL always be ready.

#### Scenario: Player gets ready
- **WHEN** Caro marks themselves ready
- **THEN** every member sees Caro as ready

#### Scenario: Bots are ready
- **WHEN** the narrator adds a bot
- **THEN** every member sees the bot as ready

### Requirement: Presence
The system SHALL mark a member as disconnected when their connection drops and as connected when they resume. A
disconnected member SHALL keep their seat. Bots SHALL always be connected.

#### Scenario: Connection drops
- **WHEN** Tato's connection drops
- **THEN** every member sees Tato as reconnecting and Tato keeps the seat

#### Scenario: Bots never drop
- **WHEN** the game starts with bots
- **THEN** every bot shows as connected

### Requirement: Live lobby view
Every member SHALL receive the full lobby state whenever it changes:
- code, room name, status and settings;
- the members, each with name, avatar, narrator or player, bot or human, ready and connected;
- the start readiness.

Session tokens SHALL never be shared with other members.

#### Scenario: Another player joins
- **WHEN** Pipe joins while Caro is in the lobby
- **THEN** Caro's lobby shows Pipe without reloading

#### Scenario: A bot is labeled
- **WHEN** the narrator adds a bot
- **THEN** every member sees that member marked as a bot
