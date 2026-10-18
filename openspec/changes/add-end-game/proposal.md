## Why

The game ends on a bare list of roles, and the best part of a werewolf night comes after it: finding out what really
happened. Who protected whom, who the Drunk "saw", which villager kept voting for their own side. Then a rematch. This
change gives the end of the game:
- a full end screen with the story of every night and day;
- funny awards;
- a plot-twist reveal for the Drunk;
- a "Play again" button that brings everyone back to the same lobby.

## What Changes

- The match records a timeline as it plays:
  - each night's hunt, protection, potions, visions and deaths;
  - each vote's tally and verdict;
  - each Hunter shot;
  - each manual kill or revive by the narrator.
- When the game ends, every member receives the full timeline and the awards:
  - **Most Suspicious:** most votes received.
  - **Worst Liar:** the first Werewolf the village executed, and on which day.
  - **Betrayed Own Team:** the village player who voted most often against village players.
  - **Silent Assassin:** a Werewolf who never received a vote.
  - **Chatterbox:** the most village messages, counted on the client from the chat history.
- End screen (canvas `EndGame`):
  - the winner banner with a flavor line;
  - the plot twist for a player whose card lied to them (the Drunk);
  - "Who was who" with your seat marked;
  - "What really happened", one expandable entry per night and day;
  - the award cards;
  - Play again and Leave.
- Play again: once the game is over, the narrator brings the room back to the lobby with the same members and
  settings. Readiness is cleared, the old game and its chat are discarded, and every member's app returns to the lobby.

## Capabilities

### New Capabilities
- `end-game`: the timeline, the awards, the end screen, and playing again in the same room.

### Modified Capabilities

## Impact

- Contracts:
  - Timeline entries and awards inside `MatchOutcome`.
  - The `room:playAgain` event and the `game-not-over` error.
- Server:
  - The match domain records the timeline and computes the awards.
  - The room gains `PlayAgain` with a `GameStarter.isOver` / `discard` port extension, wired to match and chat in the
    composition root.
- Web:
  - The `GameOverView` is rebuilt as the full end screen.
  - Play again is added for the narrator.
  - The game screen returns to the lobby when the room reopens.

## Non-goals

- Keeping scores or stats across games, sharing or exporting the timeline.
- Ghost whispers in the timeline (ghost powers do not exist yet).
- Players being able to start a rematch; only the narrator can.
