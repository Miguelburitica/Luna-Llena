## Why

The lobby can start a game, but nothing happens after that: nobody gets a role and the narrator has nothing to run. This
change deals the secret roles, gives every player their role card, and lets the narrator drive the night → dawn → day →
vote → execution cycle from a dashboard, until one team wins. Night actions, voting, chat and narration build on top of it.

## What Changes

- Role catalog for the Classic deck: each role's team, the most copies a deck may hold, and what the player is shown
  (the Drunk is shown the Seer). The deck builder shows a balance verdict and can fill in a suggested deck for N players.
- Room start also needs at least one Werewolf in the deck. Players cannot leave once a game is running.
- Starting a game deals one card per player at random and opens the match at Night 1.
- Each player privately sees their role card (tap to flip, hold to peek later). Wolves see their pack. The narrator
  sees every role.
- The narrator advances the phases, adds 30 seconds to a running timer, marks players dead or alive, and confirms the
  end of the game when a team has won. Every member sees the current phase, round, countdown and who is alive.
- Screens:
  - Role reveal (canvas `RoleReveal`, `RoleRevealWolf`).
  - Player game table shell: phase banner, timer ring, village of seats, hold-to-peek (canvas `NightDecoy`, `Day`).
  - Narrator dashboard shell: stepper, timer, Next, player grid with roles and kill/revive, win banner (canvas
    `NarratorDashboard`).
  - A simple game-over screen. The full end screen comes with the `end-game` change.

## Capabilities

### New Capabilities
- `role-catalog`: the Classic roles, their teams, deck limits, the balance verdict and suggested decks.
- `role-assignment`: dealing roles at game start and who may see which role.
- `game-phases`: the phase cycle, timers, alive/dead state, win detection and ending the game.

### Modified Capabilities
- `room-lobby`: deck limits per role, the `no-wolves` start condition, starting the game opens the match, and players
  cannot leave during a game.

## Impact

- Contracts: role catalog, match vocabulary, match views, match errors and `match:` socket events.
- Server:
  - The room feature gets a `GameStarter` port.
  - A new `apps/server/src/features/match` with domain, application and infrastructure.
  - Socket channel helpers move to `src/shared/infrastructure`.
  - New `Clock` and `RandomSource` ports in `src/shared/application`.
- Web:
  - A new `apps/web/src/features/match`.
  - The room setup gets the balance verdict and suggested deck.
  - The lobby redirects into the game.
  - A shared `RoleCard` component and role copy in the shared i18n.

## Non-goals

- Night actions, voting, execution choices, Hunter revenge and the Fool win: the `night-actions` and `voting` changes.
  Until then the narrator marks deaths by hand.
- Chat, narration, sound, ghost powers, the full end screen with awards, play again.
- Going back a phase, pausing timers, timers that advance on their own.
- Cleaning up the match when the narrator closes the room mid-game.
