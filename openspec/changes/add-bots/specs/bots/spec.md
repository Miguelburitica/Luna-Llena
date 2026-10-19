## ADDED Requirements

### Requirement: Adding and removing bots
While the room is in the lobby, the narrator SHALL be able to add a bot with an optional personality and difficulty,
and to remove a bot.
- When no personality is given, the system SHALL pick one at random. When no difficulty is given, it SHALL be Normal.
- The personalities are `paranoid`, `follower`, `detective`, `chaos` and `quiet`. The difficulties are `easy`,
  `normal` and `sharp`.
- A new bot SHALL take the first free name from the bot name list and a free avatar. It SHALL be ready and connected.
- A room SHALL hold at most 10 bots, and adding a bot to a full room is rejected with `room-full`. Adding an 11th
  bot SHALL be rejected with `bot-limit`.
- Only the narrator SHALL add or remove bots; anyone else gets `not-narrator`. Outside the lobby the system SHALL
  reject it with `game-already-started`.
- Removing a member who is not a bot SHALL be rejected with `not-a-bot`.

#### Scenario: Filling the table
- **WHEN** a lobby has 3 players and the narrator adds 3 bots
- **THEN** every member sees 6 players, the 3 bots ready, connected and labeled as bots

#### Scenario: Picked personality
- **WHEN** the narrator adds a bot with the `detective` personality and `sharp` difficulty
- **THEN** that bot plays as a sharp detective

#### Scenario: Too many bots
- **WHEN** the room already holds 10 bots and the narrator adds another
- **THEN** the system rejects it with error `bot-limit`

#### Scenario: A player tries to add a bot
- **WHEN** a player who is not the narrator adds a bot
- **THEN** the system rejects it with error `not-narrator`

#### Scenario: Removing a human as a bot
- **WHEN** the narrator removes Caro, a human, as a bot
- **THEN** the system rejects it with error `not-a-bot`

### Requirement: Fair information
A bot SHALL decide using only its own game view and the chat messages delivered to it, which are exactly what a human
in its seat would receive. It SHALL never use another member's view, the narrator's view or hidden game state.

#### Scenario: A villager bot does not know the wolves
- **WHEN** a bot Villager chooses whom to vote for
- **THEN** its choice depends only on its own view and the chat it may read, and never on the wolves' identities

### Requirement: Bots follow the rules
A bot SHALL act only through the same commands as a human player: night actions, votes, vote locks, Hunter revenge,
haunts and chat messages. Every rule and error that applies to a human SHALL apply to the bot. A bot SHALL never
advance the phase.

#### Scenario: A full game with bots
- **WHEN** a game runs with one human and five bots and the narrator keeps advancing
- **THEN** the game reaches a winner and no bot command was ever rejected

### Requirement: Night play
During the night every living bot SHALL perform its role's action:
- A Werewolf bot SHALL hunt a living non-wolf, joining a victim the pack already picked when there is one. Otherwise
  it prefers players who claimed a role. On the first night it prefers bots as victims, so the humans get to play.
- A Seer or Drunk bot SHALL inspect the living player it has no vision of and suspects most.
- A Doctor bot SHALL protect a player other than the one it may not protect, preferring a player who claimed a role.
- A Witch bot SHALL heal the pack's victim on the first night, or when the victim claimed a role, if the heal is left.
  It SHALL poison only a player it strongly suspects, if the poison is left. Otherwise it does nothing. When the pack
  picks a victim after the Witch bot acted, it SHALL reconsider before dawn.
- Other bots SHALL suspect the living player they suspect most.

#### Scenario: The pack agrees
- **WHEN** a human Werewolf picks Ana as the victim and a bot Werewolf acts afterwards
- **THEN** the bot also picks Ana

#### Scenario: The witch reconsiders
- **WHEN** a bot Witch acted on Night 1 before the wolves picked, and the wolves then pick Ana
- **THEN** the bot Witch heals Ana before dawn

#### Scenario: Humans get to play
- **WHEN** the first night begins and only bots are Werewolves
- **THEN** the bot Werewolves pick a bot as their victim

#### Scenario: A seer bot inspects
- **WHEN** a bot Seer has already seen Luis
- **THEN** it inspects a living player other than itself and Luis

### Requirement: Voting
During the vote every living bot SHALL vote for the living player it suspects most:
- A bot SHALL never vote for itself.
- A Werewolf bot SHALL never vote for a packmate.
- Votes stay secret while open, so a `follower` bot SHALL vote for the player accused most in today's village chat
  when there is one.
- A Hunter bot whose revenge is pending SHALL take it on the living player it suspects most.

#### Scenario: Never against the pack
- **WHEN** a bot Werewolf votes while its packmate is the most accused player
- **THEN** it votes for someone outside the pack

#### Scenario: Follow the crowd
- **WHEN** the village chat accused Luis more than anyone today and a `follower` bot votes
- **THEN** the bot votes for Luis

### Requirement: Suspicion
Every bot SHALL keep a suspicion score for each other player and update it from what it can see:
- A villager executed or killed raises suspicion of whoever voted for them.
- A Werewolf revealed lowers suspicion of whoever voted for it.
- A Seer or Drunk bot's vision of a wolf makes that player the top suspect; a clear vision makes them trusted.
- Chat accusations and defenses it reads move the scores a little.
- Its personality and difficulty add noise.

A Werewolf bot SHALL know its pack and never suspect it.

#### Scenario: The seer trusts its vision
- **WHEN** a bot Seer sees that Tato is a wolf
- **THEN** Tato becomes its top suspect and it votes for Tato

### Requirement: Pacing
A bot SHALL act after a short human-like delay and never instantly:
- **Night action:** 4 to 20 seconds after the night starts, and always before the night timer ends.
- **Vote:** 10 to 25 seconds after the vote opens. It locks its vote 5 seconds before the vote timer ends, or as soon
  as it is the last voter not locked, or 45 seconds into an untimed vote.
- **Hunter revenge:** within a few seconds.

#### Scenario: Before the timer
- **WHEN** a night starts with a 45 second timer
- **THEN** every living bot has acted before the 45 seconds run out

### Requirement: Chat budget
Bots SHALL talk enough to give the humans someone to suspect, without flooding the chat:
- A living bot MAY open the day with one line. Opening lines are staggered so they don't arrive at once.
- It SHALL answer when a human names it in the village chat.
- It MAY explain its vote in one line.
- It MAY react once at dawn when the news concerns it.
- A bot SHALL write at most 4 village lines per day and at most 2 wolf-chat lines per night.
- Bots together SHALL write no more than 40% of the last 10 village messages. Answers to a human who named the bot
  are exempt, so a question always gets an answer.
- A dead bot MAY write one line in the ghost chat and use its haunt once.
- A bot in a last-words window SHALL write one last line.

#### Scenario: Named in the chat
- **WHEN** Ana writes "Moco-Bot, where were you last night?" in the village chat
- **THEN** the bot named Moco-Bot answers in the village chat within a few seconds

#### Scenario: No flood
- **WHEN** a day lasts long enough for many lines
- **THEN** no bot writes more than 4 village lines that day

### Requirement: Bot speech
A bot's chat line SHALL be phrased in the room's bot language and in its personality's voice. It SHALL say what its
brain decided: an accusation, a defense, a claim, a reaction or an answer, which can be a lie when the bot is a wolf
or the Fool. The line SHALL mention only real player names and facts the bot knows, and SHALL stay party-safe. When
no language model is configured, the model fails or times out, or the room has used its 150 model calls for the game,
the bot SHALL use a scripted line for the same intent.

#### Scenario: No model configured
- **WHEN** the server runs without an OpenRouter key and a bot has to speak
- **THEN** the bot writes a scripted line in the room's bot language

#### Scenario: A bad answer from the model
- **WHEN** the model answers with something that is not the expected JSON
- **THEN** the bot writes a scripted line for the same intent
