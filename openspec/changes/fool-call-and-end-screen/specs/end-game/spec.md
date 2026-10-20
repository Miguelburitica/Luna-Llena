## MODIFIED Requirements

### Requirement: End screen
When the game ends, every member SHALL see the end screen:
- **Winner banner:** the winning team's badge, the winning team, and a flavor line, over the scene of the winning side.
- **Summary:** how many players there were, how many survived, and how many days the game lasted.
- **Solo winners:** shown when there are any.
- **Plot twist:** a card shown to any player whose card showed a different role than their true one (the Drunk).
- **Who was who:** every player's true role, grouped by team (wolves, village, solo), with the dead marked and the
  viewer's own seat marked.
- **What really happened:** one entry per night and per day in order. Each entry can be expanded, and an "Expand all"
  control opens every entry at once.
- **Awards:** the award cards.
- **Actions:** the narrator gets Play again and Leave; players get Leave.

On a phone the sections SHALL stack in one column. On a wide screen the roles SHALL span the page and the story and the
awards SHALL sit side by side.

#### Scenario: Plot twist
- **WHEN** Caro was the Drunk and the game ends
- **THEN** Caro sees "You were the Drunk all along"

#### Scenario: Reading the story
- **WHEN** the end screen shows and Caro taps "Expand all"
- **THEN** every night and day entry opens

#### Scenario: The game in numbers
- **WHEN** a game of 8 players ends on Day 3 with 5 players alive
- **THEN** the end screen shows 8 players, 5 survivors and 3 days

#### Scenario: Who was who by team
- **WHEN** the game ends with 2 Werewolves, 5 village players and the Fool, and Luis, a Werewolf, is dead
- **THEN** the end screen lists the wolves first, then the village, then the Fool, and marks Luis as dead
