## Why

Live playtests turned up five rough edges that make the table harder to read and the narrator's job harder:
- seats overlap the moon;
- names under tombstones are hard to read on the light dawn and day scenes;
- wolves open the chat on the Village tab at night, where they can't write;
- the narrator's stepper shows the round only on the current step;
- the narrator's haunt feed empties after a reload.

## What Changes

- **Village scene:** seats are laid out in the lower part of the scene, so no seat covers the moon or the sun. Every
  name, a dead player's included, sits on a readable pill on every phase background.
- **Chat:** at night, a living Werewolf's chat opens on the Wolves tab.
- **Narrator stepper:** every step shows the current round, for example "Night 2 · Dawn 2 · Day 2 · Vote 2 ·
  Execution 2".
- **Haunt feed:** the narrator view carries the game's haunt history, so the feed survives a reload.

## Capabilities

### New Capabilities

### Modified Capabilities
- `chat`: the opening tab rule for wolves at night.
- `ghost-powers`: the narrator's haunt list comes from the game state and survives a reload.
- `game-phases`: the round is shown on every phase step for the narrator.

## Impact

- Contracts: `HauntRecord` and `NarratorMatchView.haunts`. The timeline `haunt` entry reuses `HauntRecord`.
- Server: `matchViews` fills the narrator's `haunts` from the match state.
- Web:
  - match `domain/phases.ts` (`seatPositions`, stepper labels);
  - `PlayerTable` and seat styles;
  - `NarratorDashboard` and `NarratorHauntFeed`;
  - chat `domain/channels.ts` (`defaultTab`).

## Non-goals

- A full visual redesign of the scene or new illustrations.
- Haunt history for players. Players still only get the live effect.
