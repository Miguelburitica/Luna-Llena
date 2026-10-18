## Purpose

Ghost powers give dead players one playful way to reach the living, so they stay part of the fun after dying without
changing who wins.

## ADDED Requirements

### Requirement: Who may haunt
When the ghost-powers house rule is on, every dead player SHALL have exactly one haunt for the whole game, usable in
any phase while the game is running. The narrator and living players SHALL be rejected with `not-a-ghost`. A second
haunt SHALL be rejected with `haunt-used`. When the house rule is off, haunts SHALL be rejected with
`ghost-powers-off`. After the game is over, haunts SHALL be rejected with `match-over`. Each member's game view SHALL
say whether they have a haunt available.

#### Scenario: A fresh ghost
- **WHEN** Juan dies and ghost powers are on
- **THEN** Juan's view shows one haunt available

#### Scenario: Once per game
- **WHEN** Juan already haunted and tries again
- **THEN** the system rejects it with error `haunt-used`

#### Scenario: The living can't haunt
- **WHEN** Caro, alive, tries to haunt
- **THEN** the system rejects it with error `not-a-ghost`

#### Scenario: House rule off
- **WHEN** ghost powers are off and Juan, dead, tries to haunt
- **THEN** the system rejects it with error `ghost-powers-off`

### Requirement: Flicker
A ghost SHALL be able to use the haunt to flicker. Every member SHALL receive the flicker at once. Players SHALL NOT
learn which ghost caused it; the narrator SHALL.

#### Scenario: Lights out
- **WHEN** Juan's ghost flickers during the vote
- **THEN** every member's screen flickers, players are not told it was Juan, and the narrator sees "Juan’s ghost flickered the lights"

### Requirement: Whisper
A ghost SHALL be able to use the haunt to whisper one word to one living player. The word SHALL be a single word of 1
to 20 characters after trimming, with no spaces; otherwise the whisper is rejected with `whisper-invalid` and the haunt
is not used. The target SHALL be a living player; otherwise the whisper is rejected with `target-invalid` and the haunt
is not used. Only the target and the narrator SHALL receive the whisper. The target SHALL NOT learn which ghost sent
it; the narrator SHALL.

#### Scenario: A word from beyond
- **WHEN** Juan's ghost whispers "bakery" to Marta
- **THEN** Marta sees "A ghost whispers to you: “bakery”", no other player receives anything, and the narrator sees that Juan whispered to Marta

#### Scenario: Too many words
- **WHEN** Juan's ghost tries to whisper "it was Tato"
- **THEN** the system rejects it with error `whisper-invalid` and Juan still has the haunt

#### Scenario: Whispering to the dead
- **WHEN** Juan's ghost whispers to Ana, who is dead
- **THEN** the system rejects it with error `target-invalid`

### Requirement: Ghost screens
The web app SHALL show dead players a ghost dock while the game runs and ghost powers are on (canvas `Ghost`):
- "Haunt the living once per game" with Flicker and Whisper choices;
- for Whisper, a one-word input and a living-player picker with "Whisper “word” to Name";
- after use, "Your haunting power is spent".

A received flicker SHALL briefly flicker the whole screen. When the player prefers reduced motion, it SHALL show a
"A ghost flickered the lights" toast instead. A received whisper SHALL show as a ghost toast for a few seconds. The
narrator dashboard SHALL list the haunts of the game with names.

#### Scenario: Spent
- **WHEN** Juan used the haunt
- **THEN** Juan's ghost dock shows "Your haunting power is spent"

#### Scenario: Gentle flicker
- **WHEN** a flicker arrives and the player prefers reduced motion
- **THEN** the player sees the toast and no flashing
