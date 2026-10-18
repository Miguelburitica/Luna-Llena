## Purpose

The end game is where the village learns what really happened: a night-by-night story, the true roles, a few
affectionate awards, and a quick way to play again with the same friends.

## ADDED Requirements

### Requirement: Timeline
The match SHALL record a timeline entry for each of these moments, in order:
- Every night resolved at dawn: the pack's victim, the protected player, whether the Witch healed, the poison target,
  every vision (who looked at whom, the result, and whether it came from the Drunk), and the deaths.
- Every vote resolved at execution: the full verdict, including who voted for whom even when votes were anonymous.
- Every Hunter shot, taken or skipped.
- Every manual kill or revive by the narrator.

The timeline SHALL be sent to members only once the game is over.

#### Scenario: Story of a night
- **WHEN** on Night 1 the wolves targeted Ana, the Doctor protected Ana and the Seer inspected Sofi
- **THEN** the end-of-game timeline has a Night 1 entry with those facts and no deaths

#### Scenario: Secrets stay secret until the end
- **WHEN** the game is still running
- **THEN** no member's view contains the timeline

#### Scenario: Anonymous votes revealed at last
- **WHEN** votes were anonymous during the game
- **THEN** the end-of-game timeline shows who voted for whom

### Requirement: Awards
When the game ends, the system SHALL compute these awards. An award with no qualifying player is left out. A tie goes
to the player who comes first in seat order.

| Award | Winner | Count shown |
|---|---|---|
| Most Suspicious | the player who received the most votes over the whole game | total votes received |
| Worst Liar | the first Werewolf executed by the village | the day of that execution |
| Betrayed Own Team | the village-team player who cast the most votes for other village-team players, at least one | those votes |
| Silent Assassin | a Werewolf who never received a single vote | — |
| Chatterbox | the player with the most village messages, at least one | message count |

Chatterbox SHALL be computed from the village chat history every member can read at the end.

#### Scenario: Most Suspicious
- **WHEN** Luis received 9 votes over the game, more than anyone
- **THEN** Luis wins Most Suspicious with 9 votes

#### Scenario: Worst Liar
- **WHEN** Luis, a Werewolf, was executed on Day 2 and was the first wolf executed
- **THEN** Luis wins Worst Liar, caught on Day 2

#### Scenario: No liar caught
- **WHEN** no Werewolf was executed
- **THEN** there is no Worst Liar award

#### Scenario: Betrayed Own Team
- **WHEN** Ana, a Villager, cast 3 votes against village players and nobody cast more
- **THEN** Ana wins Betrayed Own Team with 3

#### Scenario: Silent Assassin
- **WHEN** Tato, a Werewolf, never received a vote
- **THEN** Tato wins Silent Assassin

### Requirement: End screen
When the game ends, every member SHALL see the end screen:
- **Winner banner:** the winning team, with a flavor line.
- **Solo winners:** shown when there are any.
- **Plot twist:** a card shown to any player whose card showed a different role than their true one (the Drunk).
- **Who was who:** every player's true role, with the viewer's own seat marked.
- **What really happened:** one entry per night and per day in order. Each entry can be expanded, and an "Expand all"
  control opens every entry at once.
- **Awards:** the award cards.
- **Actions:** the narrator gets Play again and Leave; players get Leave.

#### Scenario: Plot twist
- **WHEN** Caro was the Drunk and the game ends
- **THEN** Caro sees "You were the Drunk all along"

#### Scenario: Reading the story
- **WHEN** the end screen shows and Caro taps "Expand all"
- **THEN** every night and day entry opens

### Requirement: Play again
Once the game is over, the narrator SHALL be able to play again. The room returns to the lobby with the same members,
names, avatars and settings. Every player becomes not ready, and the room accepts new players again. The previous game
and its chat are discarded. Every member's app SHALL return to the lobby. Playing again while the game is still running
SHALL be rejected with `game-not-over`; a player trying it SHALL get `not-narrator`.

#### Scenario: Rematch
- **WHEN** the narrator presses Play again after the game ended
- **THEN** every member is back in the lobby with the same seats, everyone not ready

#### Scenario: Too soon
- **WHEN** the narrator tries to play again during a running game
- **THEN** the system rejects it with error `game-not-over`

#### Scenario: Fresh chat
- **WHEN** the next game starts after a rematch
- **THEN** no chat message from the previous game is shown
