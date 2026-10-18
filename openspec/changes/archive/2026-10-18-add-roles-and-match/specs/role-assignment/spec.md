## Purpose

Role assignment hands every player one secret card when the game starts and controls who may know which role, so the
game stays a game of deduction.

## ADDED Requirements

### Requirement: Dealing the deck
When a game starts, the system SHALL deal the deck so every player receives exactly one card, chosen uniformly at
random. The narrator SHALL receive no card.

#### Scenario: Seven players, seven cards
- **WHEN** a game starts with 7 players and a deck of 2 Werewolves, Seer, Doctor, Witch, Hunter and Fool
- **THEN** each player holds exactly one of those cards and every card is held by exactly one player

### Requirement: Role secrecy
A player SHALL learn only their own perceived role. A Werewolf SHALL also learn which other players are Werewolves.
The narrator SHALL see every player's true role. Other players' roles SHALL stay hidden until they are revealed by
death (when the reveal-role-on-death house rule is on) or by the end of the game.

#### Scenario: A villager looks around
- **WHEN** Ana, a Villager, views the game
- **THEN** Ana sees only their own role and no other player's role

#### Scenario: The wolf pack
- **WHEN** Luis and Tato are the Werewolves
- **THEN** Luis sees Tato as part of the pack and Tato sees Luis

#### Scenario: The narrator's view
- **WHEN** the narrator views the game
- **THEN** the narrator sees every player's true role, including the Drunk as Drunk

### Requirement: Role card
The web app SHALL show each player their role card face down when the game starts. Tapping it flips it to show the
role art, team, power and win condition; Werewolves also see their pack. After closing it, the player SHALL be able to
press and hold a card button to peek at the role again; it hides when released.

#### Scenario: First look
- **WHEN** the game starts and Marta taps the card
- **THEN** the card flips to show the Seer, the village team, the Seer's power and the village win condition

#### Scenario: Peek later
- **WHEN** Marta presses and holds the card button during the game
- **THEN** the role shows until Marta lets go

### Requirement: Rejoining keeps the role
A player who resumes their seat during a game SHALL get the same role and view back.

#### Scenario: Reload mid-game
- **WHEN** Caro reloads the page during Night 2
- **THEN** Caro sees the same role and the current phase
