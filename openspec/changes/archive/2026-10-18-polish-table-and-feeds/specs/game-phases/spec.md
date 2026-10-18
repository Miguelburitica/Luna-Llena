## MODIFIED Requirements

### Requirement: Phase cycle
A match SHALL start in the night phase of round 1. The phases SHALL follow this cycle: night → dawn → day → vote →
execution → night, and the round SHALL increase by one each time a new night begins. Only the narrator SHALL advance
the phase; anyone else SHALL get error `not-narrator`. Every member SHALL see the current phase and round. The
narrator's phase stepper SHALL show the current round on every phase step, not only the current one.

#### Scenario: The first night
- **WHEN** the narrator starts the game
- **THEN** every member sees Night 1

#### Scenario: A full day passes
- **WHEN** the narrator advances five times from Night 1
- **THEN** every member sees Night 2

#### Scenario: A player tries to advance
- **WHEN** a player advances the phase
- **THEN** the system rejects it with error `not-narrator`

#### Scenario: Rounds on the stepper
- **WHEN** the game is at the vote of round 2
- **THEN** the narrator's stepper reads Night 2, Dawn 2, Day 2, Vote 2, Execution 2 with Vote highlighted
