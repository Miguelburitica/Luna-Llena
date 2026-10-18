## Context

The `room` feature is the gold example (see `openspec/config.yaml` and `CLAUDE.md`). The shared contracts for this
change are already written and are the interface between server and web:
- `packages/contracts/src/roles/catalog.ts`: `ROLE_CATALOG`, `ROLE_TEAMS`, `SPECIAL_ROLE_ORDER`, `ROLE_IDS`, `TEAM_IDS`.
- `packages/contracts/src/match/{vocabulary,views,events}.ts`: phases, errors, `MatchView` and the socket events.
- `START_CONDITIONS` now includes `no-wolves`.

## Goals / Non-Goals

**Goals:**
- A second feature (`match`) built exactly like `room`, plus a clean integration point between the two features.
- Per-member views, so secrecy is enforced on the server.

**Non-Goals:** see proposal.md, Non-goals.

## Decisions

### Role catalog lives in contracts; deck advice lives in the web room domain
`ROLE_CATALOG` holds the data both apps need: team, copy limit and perceived role. The server's `RoomSettings` checks
each role's count against `maxCopies`.

The balance verdict and the suggested deck are only shown in the deck builder, so they are pure functions in
`apps/web/src/features/room/domain/deckAdvice.ts`:
- `recommendedWolves(players)`
- `balanceVerdictOf(deck, players)` returns `'no-wolves' | 'too-few-wolves' | 'too-many-wolves' | 'balanced'`
- `suggestedDeckFor(players)`

Alternative considered: a separate `roles` feature. Rejected, because it would hold no behaviour of its own and would
force imports between features' infrastructure.

### Room → match integration through a port
- The room application gets a `GameStarter` port (`apps/server/src/features/room/application/ports.ts`):
  `start(opening: GameOpening): Promise<void>`.
- `GameOpening` is `{ code, narratorId, playerIds, deck, timers, revealRoleOnDeath }`.
- `StartGame` calls it after `room.start` succeeds and the room is saved and published.
- The composition root (`startServer.ts`) wires it to the match feature's `StartMatch` use case.
- The room domain gains the `no-wolves` start condition in `StartReadiness`.
- `Room.leave` rejects players with `game-already-started` once the room is in game.

### Match server feature (`apps/server/src/features/match`)
- `domain/`
  - `Match` aggregate:
    - It holds `code`, `narratorId`, the `seats` (`{ memberId, role, alive }`), `phase`, `round`, `phaseEndsAt`,
      `pendingWinner`, `outcome`, the timers and `revealRoleOnDeath`.
    - Methods return `Result<_, MatchError>`: `advance(actorId, now)`, `extendTimer(actorId)`,
      `setAlive(actorId, memberId, alive)`, `endGame(actorId)`, `keepPlaying(actorId)`.
    - Authorization: only the narrator; `not-narrator` otherwise. After the end, `match-over`.
  - `dealRoles(deck, playerIds, random)`: a Fisher–Yates shuffle with an injected random source returning numbers in
    [0, 1).
  - `winnerOf(seats)`: the pure win rule.
  - Phase order and timer lookup use `PHASES` and `PHASE_TIMERS` from contracts. Timer seconds of 0 mean
    `phaseEndsAt = null`.
- `application/`
  - Ports: `MatchRepository` (find, save) and `MatchPublisher` (`publish(code, views: Array<{ memberId, view }>)`).
  - New shared ports in `src/shared/application`: `Clock` (`now(): number`, epoch ms) and `RandomSource`
    (`next(): number`).
  - `toMatchViews(match, now)` builds the narrator view and one player view per seat. A player view carries:
    - the perceived role (`ROLE_CATALOG[role].appearsAs`) and its team;
    - `packIds` (the other werewolves) for werewolves only;
    - `revealedRole` for dead players when `revealRoleOnDeath`, or for everyone once the outcome is set.
  - Use cases: `StartMatch`, `SyncMatch`, `AdvancePhase`, `ExtendTimer`, `SetAlive`, `EndGame`, `KeepPlaying`.
    - Mutating use cases share a helper like room's `changeRoomAs`: load the match, mutate it, save it, publish all
      views.
    - `SyncMatch` returns only the caller's view.
    - The actor is `{ code, memberId }`. A member not in the match gets `session-invalid`; a missing match gets
      `match-not-found`.
- `infrastructure/`
  - `InMemoryMatchRepository`, `SystemClock`, `MathRandomSource`.
  - `SocketMatchPublisher` emits `match:view` to `memberChannel(memberId)`.
  - `registerMatchHandlers` follows the same pattern as `registerRoomHandlers`, using `answer` and the socket session.
- `roomChannel` and `memberChannel` move from `features/room/infrastructure/roomChannels.ts` to
  `src/shared/infrastructure/socketChannels.ts`, because both features use them.

### Web match feature (`apps/web/src/features/match`)
- `domain/`
  - `phaseLook(phase)`: the CSS phase class (`ph-night`, `ph-dawn`, `ph-day`, `ph-vote`; execution uses `ph-vote`) and
    the phase icon.
  - `secondsLeft(view, clientNow, receivedAt)`: uses `serverNow` to correct for clock offset and never goes below 0.
  - `seatPositions(count)`: percentage positions on an ellipse for the village scene, starting at the top and going
    clockwise.
  - `nextPhaseOf(phase)`: the label shown on the narrator's Next button.
- `application/`
  - `MatchGateway` port and `MATCH_GATEWAY` injection key, as in room's `ports.ts`.
  - `useMatchStore`, a Pinia setup store:
    - It holds `view` and `receivedAt`.
    - Actions: `sync`, `advance`, `extendTimer`, `setAlive`, `endGame`, `keepPlaying`.
    - It listens to `match:view`.
    - It uses `useRoomStore` for the session and names. A feature may use another feature's application layer;
      `openspec/config.yaml` records this rule.
  - `useCountdown`, a composable that ticks once per second.
- `infrastructure/`
  - `SocketMatchGateway` and `installMatch(app, socket)`.
  - The `/room/:code/game` route is `GameView`. It resumes the room seat through room's `useRoomEntry`, then syncs the
    match, then renders one of three things:
    - `RoleRevealOverlay` (canvas `RoleReveal` and `RoleRevealWolf`) until the player taps "Got it". That choice is
      remembered per tab, under the key `luna-llena.revealed.<CODE>` in sessionStorage.
    - `PlayerTable` (canvas `NightDecoy` and `Day` frames without the action dock): phase banner, timer ring, village
      seats with alive and dead states, revealed roles, and a hold-to-peek card button.
    - `NarratorDashboard` (canvas `NarratorDashboard`, left column only):
      - the stepper with the current phase and Night N;
      - the timer with +30s and "Next: <phase>";
      - the player grid with true roles and Kill/Revive;
      - the win banner with Keep playing and End game.
  - `GameOverView`, inside `GameView` when the outcome is set: the winner banner and every player with their true role.
  - The `LobbyView` in-game notice is replaced by `router.replace` to the game route.
  - Shared UI: `RoleCard.vue` in `src/shared/infrastructure/ui/components`, with face-down, face-up and mini variants
    built from `.rcard`, `.rcard-back` and `.rcard-mini`. Role copy (power and win line, en and es) goes into
    `sharedMessages.roleCards`, taken from canvas `Roles.dc.html`.

### Deck builder changes (web room feature)
`RoomSetupView` gets:
- a player-count counter with "Suggested deck for N";
- the verdict badge next to the balance bar;
- per-role counter maxima from `ROLE_CATALOG[role].maxCopies`, capped by the cards left.

`NarratorLobby` gets "Use suggested deck for {players}" in the deck panel, and the `no-wolves` check in "Before you
start".

## Risks / Trade-offs

- [Clock skew between devices] → views carry `serverNow`; the countdown corrects by the offset measured on receipt.
- [The narrator closes the tab mid-game] → the match stays in memory and resumes on reload, like the room.
- [Random dealing is hard to test] → `RandomSource` is injected, so tests use a seeded sequence.
