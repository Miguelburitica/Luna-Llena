## Why

Nights are empty: the narrator kills players by hand. This change gives every living player something to do at night.
The wolves hunt, the Seer peeks, the Doctor protects, the Witch brews, and everyone else names a suspect so nobody can
tell who acted. When the narrator calls dawn, the game resolves the night by itself and everyone wakes up to its result.

## What Changes

- Night actions by perceived role:
  - The wolves hunt together and see each other's picks live.
  - The Seer, and the Drunk who believes they are the Seer, inspects one player per night and gets a private result
    (the Drunk's result is random). The Seer keeps a history of past visions.
  - The Doctor protects one player, never the same one two nights in a row.
  - The Witch sees the wolves' current target. The Witch has one heal potion and one poison potion for the whole game, or
    can do nothing tonight.
  - Villagers, the Hunter and the Fool get a decoy "Who do you suspect?" prompt.
- Dawn resolution when the narrator advances from night to dawn:
  - The wolves' victim dies unless the Doctor protected them or the Witch healed them.
  - The Witch's poison target dies.
  - Deaths reveal roles per the house rule, and the existing win check runs.
- Every member sees who died at dawn, or that nobody did.
- The narrator sees every player's action and a live preview of what happens at dawn, including who has not acted yet.
- Screens:
  - The night dock on the player table (canvas `NightWolf`, `NightSeer`, `NightDoctor`, `NightWitch`, `NightDecoy`).
  - The dawn announcement (canvas `Dawn`, `DawnNobody`).
  - Per-player action lines and the dawn panel in the narrator dashboard (canvas `NarratorDashboard`).

## Capabilities

### New Capabilities
- `night-actions`: who acts at night and how, what each player may see, and how dawn resolves the night.

### Modified Capabilities

## Impact

- Contracts:
  - `ROLE_CATALOG` gains each role's `nightAction`.
  - New night-action input, the night views and new match error codes.
  - A `match:act` socket event.
- Server: the match feature grows the night state and the dawn resolution, plus an `ActAtNight` use case.
- Web: the match feature grows the night dock, the dawn announcement, and the narrator's action lines and dawn panel.

## Non-goals

- Wolf chat and village chat: the `chat` change. The canvas chat bar is not built yet.
- Hunter revenge, Fool win, voting and execution: the `voting` change.
- AI narration on the dawn card: the `narration` change. Dawn shows the deaths only.
- Ghost powers for dead players.
