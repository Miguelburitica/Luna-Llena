## MODIFIED Requirements

### Requirement: The Fool's victory
When the village executes the Fool, every member SHALL see that the Fool wins, the Fool's role SHALL be revealed to
everyone, and the Fool SHALL be recorded as a solo winner. The game SHALL continue: the wolves and the village keep
playing for their own victory.

When the narrator marks the Fool dead by hand, for example after a vote held over the voice call, the narrator SHALL be
offered to call the Fool's win. Calling it SHALL record the Fool as a solo winner and reveal the Fool's role to everyone,
and the game SHALL continue. The offer SHALL go away once called, or when the Fool is revived. A Fool killed by the
wolves, the Witch's poison or the Hunter's shot SHALL NOT be offered. Calling the win for anyone not offered SHALL be
rejected with `no-fool-win`; a player trying it SHALL get `not-narrator`.

#### Scenario: Fooled you
- **WHEN** the village executes Marta, the Fool
- **THEN** every member sees "The Fool wins!", Marta is recorded as a solo winner, and the game goes on

#### Scenario: Killed at night
- **WHEN** the wolves kill the Fool
- **THEN** the Fool does not win and the narrator is not offered the Fool's win

#### Scenario: Executed by hand
- **WHEN** the narrator marks Marta, the Fool, dead by hand and calls the Fool's win
- **THEN** Marta is recorded as a solo winner, every member sees Marta was the Fool, and the game goes on

#### Scenario: Not the Fool's day
- **WHEN** the narrator calls the Fool's win for a living Fool, a Fool killed by the wolves, or a player who is not the
  Fool
- **THEN** the system rejects it with error `no-fool-win`

#### Scenario: Only the narrator calls it
- **WHEN** a player tries to call the Fool's win
- **THEN** the system rejects it with error `not-narrator`

### Requirement: Vote screens
The web app SHALL show the vote dock to living players during the vote:
- a target picker;
- "Lock vote", and after locking "Locked on X";
- "N of M voted".

During execution the web app SHALL reveal the verdict: the animated tally, then either the executed player with their
role card when it is revealed, or the tie card. The dead Hunter SHALL see a revenge picker while the shot is pending,
and everyone else "The Hunter takes aim…". When the Fool wins, everyone SHALL see the Fool's victory card with a way back
to the village. The narrator dashboard SHALL show the live votes and locks, the verdict, and the pending shot with a
Skip button. The narrator dashboard SHALL also show every solo winner for the rest of the game, and a "The Fool wins"
button for each Fool the narrator is offered.

#### Scenario: Vote dock
- **WHEN** Caro opens the game during the vote
- **THEN** Caro sees the picker without Caro, the dead or the narrator, and "N of M voted"

#### Scenario: Tie card
- **WHEN** the verdict is a tie
- **THEN** every member sees "It’s a tie!" and "No execution today"

#### Scenario: Calling it from the dashboard
- **WHEN** the narrator is offered the Fool's win for Marta and presses "The Fool wins"
- **THEN** the dashboard asks the server to record Marta's win

#### Scenario: Solo winners stay on the dashboard
- **WHEN** Marta won as the Fool on Day 1 and the game is in Night 2
- **THEN** the narrator dashboard still shows Marta as a solo winner
