# game-phases Specification

## Purpose
Game phases are the rhythm of a match: the narrator moves the village through night, dawn, day, vote and execution,
keeps track of who is alive, and closes the game when a team has won.

## Requirements

### Requirement: Phase cycle
A match SHALL start in the night phase of round 1. The phases SHALL follow this cycle: night → dawn → day → vote →
execution → night, and the round SHALL increase by one each time a new night begins. Only the narrator SHALL advance
the phase; anyone else SHALL get error `not-narrator`. Every member SHALL see the current phase and round.

#### Scenario: The first night
- **WHEN** the narrator starts the game
- **THEN** every member sees Night 1

#### Scenario: A full day passes
- **WHEN** the narrator advances five times from Night 1
- **THEN** every member sees Night 2

#### Scenario: A player tries to advance
- **WHEN** a player advances the phase
- **THEN** the system rejects it with error `not-narrator`

### Requirement: Phase timers
When the night, day or vote phase begins and the room's timer for it is above 0, the phase SHALL carry an end time
that many seconds ahead, and every member SHALL see a countdown. Dawn and execution, and phases whose timer is 0, have
no end time. Timers do not advance the phase on their own; the narrator does. The narrator SHALL be able to add 30
seconds to a running timer; without a timer the system SHALL reject it with error `timer-not-running`.

#### Scenario: Night countdown
- **WHEN** Night 1 begins with a 60 second night timer
- **THEN** every member sees a countdown ending 60 seconds after the night began

#### Scenario: Manual day
- **WHEN** the day timer is 0 and the day begins
- **THEN** the day has no countdown

#### Scenario: More time
- **WHEN** the narrator adds 30 seconds during a vote with 10 seconds left
- **THEN** every member sees 40 seconds left

### Requirement: Alive and dead
Every player SHALL start alive. Until night actions and voting exist, the narrator SHALL be able to mark any player dead
or alive again. Every member SHALL see who is alive. When a player dies and the reveal-role-on-death house rule is on,
their true role SHALL become visible to everyone.

#### Scenario: Narrator marks a death
- **WHEN** the narrator marks Juan dead
- **THEN** every member sees Juan as dead

#### Scenario: Role revealed on death
- **WHEN** Juan, the Doctor, dies with reveal role on death on
- **THEN** every member sees that Juan was the Doctor

#### Scenario: Role kept secret on death
- **WHEN** Juan dies with reveal role on death off
- **THEN** players see Juan as dead but not Juan's role

### Requirement: Win detection
After every change to who is alive, the system SHALL check the win conditions: the village wins when no Werewolf is
alive; the wolves win when the living Werewolves are at least as many as all other living players. When a team has won,
the narrator SHALL be asked to end the game or keep playing; players see nothing until the narrator decides.

#### Scenario: Last wolf falls
- **WHEN** the narrator marks the last living Werewolf dead
- **THEN** the narrator is asked to end the game with the village as winner

#### Scenario: Wolves take over
- **WHEN** 2 Werewolves and 2 other players are alive
- **THEN** the narrator is asked to end the game with the wolves as winner

#### Scenario: Keep playing
- **WHEN** the narrator chooses to keep playing
- **THEN** the question goes away until the next change to who is alive

### Requirement: Ending the game
When the narrator ends a game that has a winner, the match SHALL be over: every member SHALL see the winning team and
every player's true role, and the narrator SHALL no longer be able to advance phases or change who is alive (error
`match-over`). Ending a game without a winner SHALL be rejected with error `no-winner-yet`.

#### Scenario: The village celebrates
- **WHEN** the narrator ends the game after the village won
- **THEN** every member sees the village won and all roles, the Drunk included

#### Scenario: Ending too early
- **WHEN** the narrator ends the game while no team has won
- **THEN** the system rejects it with error `no-winner-yet`
