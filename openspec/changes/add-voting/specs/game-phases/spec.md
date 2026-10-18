## MODIFIED Requirements

### Requirement: Win detection
After every change to who is alive, including deaths at dawn, executions and the Hunter's shot, the system SHALL check
the team win conditions: the village wins when no Werewolf is alive; the wolves win when the living Werewolves are at
least as many as all other living players. When a team has won, the narrator SHALL be asked to end the game or keep
playing; players see nothing until the narrator decides. A solo victory (the Fool's, see `voting`) SHALL NOT end the
game and SHALL NOT trigger this question by itself.

#### Scenario: Last wolf falls
- **WHEN** the narrator marks the last living Werewolf dead
- **THEN** the narrator is asked to end the game with the village as winner

#### Scenario: Wolves take over
- **WHEN** 2 Werewolves and 2 other players are alive
- **THEN** the narrator is asked to end the game with the wolves as winner

#### Scenario: Keep playing
- **WHEN** the narrator chooses to keep playing
- **THEN** the question goes away until the next change to who is alive

#### Scenario: Execution ends it
- **WHEN** the village executes the last living Werewolf
- **THEN** the narrator is asked to end the game with the village as winner

### Requirement: Ending the game
When the narrator ends a game that has a winner, the match SHALL be over. Every member SHALL see the winning team,
every solo winner recorded during the game, and every player's true role. The narrator SHALL no longer be able to
advance phases or change who is alive (error `match-over`). Ending a game without a winner SHALL be rejected with error
`no-winner-yet`.

#### Scenario: The village celebrates
- **WHEN** the narrator ends the game after the village won
- **THEN** every member sees the village won and all roles, the Drunk included

#### Scenario: Ending too early
- **WHEN** the narrator ends the game while no team has won
- **THEN** the system rejects it with error `no-winner-yet`

#### Scenario: The Fool laughs last
- **WHEN** the Fool was executed earlier and the wolves later win
- **THEN** the end screen shows the wolves won and the Fool as a solo winner
