## Purpose

The role catalog defines the Classic deck: which team each role plays for, how many copies a deck may hold, what the
player is told they are, and how the narrator gets help building a fair deck.

## ADDED Requirements

### Requirement: Classic roles
The Classic theme SHALL offer these roles, each with a team and a deck limit:

| Role | Team | Copies per deck |
|---|---|---|
| Werewolf | wolves | 0–4 |
| Villager | village | 0–15 |
| Seer | village | 0–1 |
| Doctor | village | 0–1 |
| Witch | village | 0–1 |
| Hunter | village | 0–1 |
| Fool | solo | 0–1 |
| Drunk | village | 0–1 |

A deck holding more copies of a role than its limit SHALL be rejected with error `settings-invalid`.

#### Scenario: Two seers
- **WHEN** the narrator sets the deck to 2 Seers
- **THEN** the system rejects it with error `settings-invalid`

#### Scenario: Four wolves
- **WHEN** the narrator sets the deck to 4 Werewolves
- **THEN** the deck is accepted

### Requirement: Perceived role
Every role SHALL be shown to its player as itself, except the Drunk, who SHALL be shown the Seer card and the Seer's
team. The true role of a Drunk SHALL be visible only to the narrator, and to everyone once revealed.

#### Scenario: The Drunk looks at their card
- **WHEN** Caro is dealt the Drunk
- **THEN** Caro's role card shows the Seer

### Requirement: Balance verdict
The deck builder SHALL show a balance verdict for the deck against the number of players it is meant for. The
recommended number of Werewolves for N players is the floor of (N + 1) / 4, with a minimum of 1. The verdict SHALL be:
`no-wolves` when the deck has no Werewolf; `too-few-wolves` when it has more than one fewer than recommended;
`too-many-wolves` when it has more than one above recommended; otherwise `balanced`.

#### Scenario: Balanced for 8
- **WHEN** the deck has 2 Werewolves for 8 players
- **THEN** the verdict is `balanced`

#### Scenario: Wolf pack too big
- **WHEN** the deck has 4 Werewolves for 7 players
- **THEN** the verdict is `too-many-wolves`

#### Scenario: Nobody to fear
- **WHEN** the deck has no Werewolf
- **THEN** the verdict is `no-wolves`

### Requirement: Suggested deck
The deck builder SHALL fill in a suggested deck for N players (6 to 15). The suggestion is the recommended number of
Werewolves, then the special roles in this order until the deck is full or all are used: Seer, Doctor, Witch, Hunter,
Fool, Drunk, then Villagers for the remaining cards.

#### Scenario: Suggested deck for 8
- **WHEN** the narrator asks for the suggested deck for 8 players
- **THEN** the deck is 2 Werewolves, Seer, Doctor, Witch, Hunter, Fool and Drunk

#### Scenario: Suggested deck for 6
- **WHEN** the narrator asks for the suggested deck for 6 players
- **THEN** the deck is 1 Werewolf, Seer, Doctor, Witch, Hunter and Fool

#### Scenario: Suggested deck for 15
- **WHEN** the narrator asks for the suggested deck for 15 players
- **THEN** the deck is 4 Werewolves, the six special roles and 5 Villagers
