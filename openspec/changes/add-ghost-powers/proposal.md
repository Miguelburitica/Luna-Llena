## Why

Dead players can read and chat with other ghosts, but they can't touch the living. One small, mischievous power per
ghost keeps the dead invested in the game. Two powers:
- making every screen flicker at the worst possible moment;
- whispering a single creepy word to one living player.

Either one usually gets a laugh.

## What Changes

- Every dead player gets exactly one haunt per game, when the ghost-powers house rule is on. They choose one of two
  powers:
  - **Flicker:** every member's screen flickers for a moment. The living don't learn which ghost did it.
  - **Whisper:** one word, up to 20 characters, is sent to one living player of the ghost's choice. Only that player
    sees it, as "A ghost whispers to you: “bakery”", without the ghost's name.
- The narrator sees every haunt with the ghost's name, both live and in the dashboard.
- Haunts are recorded in the end-of-game timeline, for example "Juan’s ghost whispered “bakery” to Marta".
- Screens:
  - the ghost dock for dead players (canvas `Ghost`);
  - the flicker overlay, with a toast instead when the player prefers reduced motion;
  - the whisper toast;
  - the narrator's haunt feed.

## Capabilities

### New Capabilities
- `ghost-powers`: who may haunt, the two powers, who learns what, and the screens.

### Modified Capabilities
- `end-game`: the timeline also records haunts.

## Impact

- Contracts:
  - `HauntInput`, `HauntEffect` and `GhostPowerView` (`you.haunt`).
  - New errors and the `match:haunt` / `match:haunted` events.
  - A `haunt` timeline entry.
- Server: the match domain gains haunt state and rules, plus a `Haunt` use case; the ghost-powers house rule is carried
  into the match.
- Web: the match feature gains the ghost dock, the flicker overlay, the whisper toast and the narrator feed, plus haunt
  sentences in the end story.

## Non-goals

- More than one haunt per ghost, or haunts that change game rules (votes, night actions).
- Sound effects for haunts (the atmosphere change).
- Haunting after the game is over.
