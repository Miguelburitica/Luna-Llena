## Purpose

Voting is how the village fights back: every living player secretly picks who should leave, the narrator reveals the
tally, and the most-voted player is executed. It also carries the deaths that trigger special rules, such as the
Hunter's last shot and the Fool's solo victory.

## ADDED Requirements

### Requirement: Casting a vote
During the vote phase every living player SHALL be able to vote for one other living player, change that vote, or
clear it to abstain. Voting outside the vote phase SHALL be rejected with `not-vote`; dead players and the narrator with
`player-dead` and `not-your-action`; voting for yourself, the dead or an unknown player with `target-invalid`.

#### Scenario: A first vote
- **WHEN** Caro votes for Luis during the vote
- **THEN** Caro's vote is on Luis and Caro can still change it

#### Scenario: Voting during the night
- **WHEN** Caro votes during the night
- **THEN** the system rejects it with error `not-vote`

#### Scenario: Voting for yourself
- **WHEN** Caro votes for Caro
- **THEN** the system rejects it with error `target-invalid`

### Requirement: Locking a vote
A player with a vote SHALL be able to lock it. A locked vote SHALL NOT change; changing or clearing it SHALL be
rejected with `vote-locked`. Locking without a vote SHALL be rejected with `target-invalid`.

#### Scenario: Lock it in
- **WHEN** Caro locks a vote on Luis and then votes for Tato
- **THEN** the system rejects the change with error `vote-locked` and the vote stays on Luis

### Requirement: Secret while open
While the vote is open, players SHALL see only their own vote and how many living players have voted and locked; no
player SHALL learn anyone else's choice. The narrator SHALL see every vote and lock live.

#### Scenario: Counting without telling
- **WHEN** 5 of 7 living players have voted
- **THEN** every player sees "5 of 7 voted" and nothing about who voted for whom

#### Scenario: The narrator watches
- **WHEN** Ana votes for Tato
- **THEN** the narrator sees Ana's vote on Tato

### Requirement: The verdict
When the narrator advances from vote to execution, the system SHALL count every current vote, locked or not, and reveal
the tally to every member: each voted player with their number of votes, ordered from most to fewest. The tally SHALL
also list who voted for whom unless the anonymous-votes house rule is on. The player with strictly the most votes is
executed and dies under the existing alive and dead rules. When two or more players share the most votes, or nobody
voted, nobody is executed. The verdict SHALL stay visible until the next night begins.

#### Scenario: The village has spoken
- **WHEN** Luis gets 4 votes, Tato 2 and Sofi 1
- **THEN** every member sees the tally, Luis is executed, and with reveal role on death on, everyone sees Luis was a Werewolf

#### Scenario: A tie
- **WHEN** Luis and Tato get 3 votes each
- **THEN** every member sees it is a tie and nobody is executed

#### Scenario: Nobody voted
- **WHEN** the vote ends with no votes
- **THEN** nobody is executed

#### Scenario: Anonymous votes
- **WHEN** the anonymous-votes house rule is on
- **THEN** the tally shows only the counts, not who voted for whom

### Requirement: Hunter revenge
When the Hunter dies by any cause (the wolves, the Witch's poison, an execution or the narrator), the system SHALL open
a revenge shot. Every member SHALL see that the Hunter takes aim. The dead Hunter SHALL pick one living player, who dies
at once under the existing alive and dead rules. While the shot is pending, the narrator SHALL NOT advance the phase
(error `revenge-pending`) but SHALL be able to skip the shot. A pick by anyone other than the pending Hunter, or with no
shot pending, SHALL be rejected with `no-revenge`; an invalid target with `target-invalid`. The result SHALL stay
visible until the next phase begins.

#### Scenario: One last shot
- **WHEN** the wolves kill Sofi, the Hunter, and Sofi picks Tato
- **THEN** Tato dies at once and every member sees the Hunter took Tato down

#### Scenario: Waiting for the shot
- **WHEN** the Hunter's shot is pending and the narrator advances
- **THEN** the system rejects it with error `revenge-pending`

#### Scenario: The Hunter is away
- **WHEN** the narrator skips the pending shot
- **THEN** nobody else dies and the narrator can advance again

#### Scenario: Not your shot
- **WHEN** a living player tries to take the Hunter's shot
- **THEN** the system rejects it with error `no-revenge`

### Requirement: The Fool's victory
When the village executes the Fool, every member SHALL see that the Fool wins, the Fool's role SHALL be revealed to
everyone, and the Fool SHALL be recorded as a solo winner. The game SHALL continue: the wolves and the village keep
playing for their own victory.

#### Scenario: Fooled you
- **WHEN** the village executes Marta, the Fool
- **THEN** every member sees "The Fool wins!", Marta is recorded as a solo winner, and the game goes on

#### Scenario: Killed at night
- **WHEN** the wolves kill the Fool
- **THEN** the Fool does not win

### Requirement: Vote screens
The web app SHALL show the vote dock to living players during the vote:
- a target picker;
- "Lock vote", and after locking "Locked on X";
- "N of M voted".

During execution the web app SHALL reveal the verdict: the animated tally, then either the executed player with their
role card when it is revealed, or the tie card. The dead Hunter SHALL see a revenge picker while the shot is pending,
and everyone else "The Hunter takes aim…". When the Fool wins, everyone SHALL see the Fool's victory card with a way back
to the village. The narrator dashboard SHALL show the live votes and locks, the verdict, and the pending shot with a
Skip button.

#### Scenario: Vote dock
- **WHEN** Caro opens the game during the vote
- **THEN** Caro sees the picker without Caro, the dead or the narrator, and "N of M voted"

#### Scenario: Tie card
- **WHEN** the verdict is a tie
- **THEN** every member sees "It’s a tie!" and "No execution today"
