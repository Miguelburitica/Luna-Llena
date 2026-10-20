## Why

In an online game with bots, the narrator killed the Fool (the bufón) and had no way to call the Fool's solo win. The
Fool only wins when the automated vote executes them. When the village decides by voice and the narrator marks the
Fool dead by hand, the win is lost, and the narrator dashboard never offers it. The only trace of a Fool's win on the
dashboard is a badge on the verdict, which disappears when the next night begins.

The end-of-game screen also needs love. It is a narrow phone column on every screen, the winner banner competes with
the scenery, the roles are an unordered grid of tiny badges, and the timeline and awards run as one long column on
desktop.

## What Changes

- **Calling the Fool's win:** when the narrator marks the Fool dead by hand, the dashboard offers "The Fool wins". Calling
  it records the Fool as a solo winner, reveals the Fool's role to everyone and the game goes on. A Fool killed by the
  wolves, the Witch or the Hunter is never offered.
- **Solo winners on the dashboard:** the narrator keeps seeing every solo winner for the rest of the game.
- **End screen redesign:** a full-width winner banner, a summary of the game (players, survivors, days), the roles grouped
  by team with who lived and died, and on wide screens the story and the awards side by side.

## Capabilities

### New Capabilities

### Modified Capabilities
- `voting`: the narrator can call the Fool's win after marking the Fool dead by hand; the dashboard keeps showing solo
  winners.
- `end-game`: the end screen layout (banner, summary, roles by team, wide layout).

## Impact

- Contracts, `match`: new error code `no-fool-win`, the `match:declareFoolWin` event, and `foolClaimIds` on the narrator
  view.
- Rules, `packages/rules/src/domain/match`: `Match.declareFoolWin` and `Match.foolClaimIds`; `narratorViewOf` sends the
  claims.
- Server, `features/match`: `DeclareFoolWin` use case and its socket handler.
- Web, `features/match`:
  - `application`: the gateway port, the socket gateway and the store action;
  - `infrastructure/components/NarratorDashboard.vue`: the call and the solo winners strip;
  - `infrastructure/views/GameOverView.vue`, `components/EndStory.vue`, `components/EndAwards.vue`: the redesign;
  - `domain/endGame.ts`: the game summary and the roles grouped by team;
  - `infrastructure/i18n/matchMessages.ts`: en and es copy.

## Non-goals

- Ending the game on the Fool's win. A solo win still never ends the game.
- Letting the narrator crown any other player or role as a solo winner.
- The in-person logbook (`features/table`), which already records the Fool's win when the logged vote executes them.
- Bot behaviour.
