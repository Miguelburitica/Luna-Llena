## Context

This builds on the `match` feature as extended by `add-night-actions`. See the specs `game-phases`, `night-actions`
and `role-assignment`. The contracts for this change are written and frozen:
- `packages/contracts/src/match/voting.ts`: `VoteTally`, `Verdict` (`round`, `tally`, `executedId`, `tie`,
  `foolWins`), `VotingProgress`, `CastVote` and `RevengeView`.
- New `MatchView` fields:
  - common: `voting`, `verdict`, `revenge`, `soloWinnerIds`;
  - player: `you.vote`;
  - narrator: `votes`.
- New error codes: `not-vote`, `vote-locked`, `revenge-pending`, `no-revenge`.
- New events: `match:vote` (`{ targetId | null }`), `match:lockVote`, `match:avenge` (`{ targetId }`) and
  `match:skipRevenge`.

## Goals / Non-Goals

**Goals:** voting and its consequences live in the match domain, and every death goes through a single path, so
revenge, reveals and win checks can never be missed.
**Non-Goals:** see proposal.md, Non-goals.

## Decisions

### One death path
`Match` gets a private `bury(memberIds)` used by:
- the dawn resolution;
- the execution;
- the Hunter's shot;
- the narrator's `setAlive(false)`.

For each seat that goes from alive to dead, `bury`:
- marks the seat dead;
- opens a revenge shot when the seat's true role is `hunter` and no shot is pending;
- recomputes `pendingWinner` with `winnerOf` once at the end.

The dawn code from `add-night-actions` is refactored onto `bury`. `setAlive(true)` stays as it is.

### Ballot
- `domain/Ballot.ts` holds `Map<voterId, { targetId, locked }>`. It starts empty each time the vote phase begins.
- `Match.vote(actorId, targetId | null)` and `Match.lockVote(actorId)` validate in this order:
  1. `match-over`
  2. `not-vote`
  3. the narrator gets `not-your-action`
  4. `player-dead`
  5. `vote-locked`
  6. `target-invalid`
- Payloads arrive as `unknown` and are validated in the domain.

### Verdict
- `domain/verdictOf.ts` is a pure function: `(ballot, seats, anonymous, round)` returns a `Verdict`.
  - It counts the current votes of living voters for living targets.
  - The tally is sorted by votes, highest first, then by seat order.
  - `voterIds` is null when the vote is anonymous.
  - A strict maximum is executed; a shared maximum or an empty tally means `tie`/no execution.
- `Match.advance` from vote to execution:
  - computes the verdict;
  - when the executed seat's true role is `fool`, sets `foolWins` and appends the seat to `soloWinnerIds`;
  - then calls `bury([executedId])`.
- `verdict` stays until the next night begins, and is cleared together with `dawn`.

### Revenge
- `pendingRevenge: { hunterId, targetId | null, pending }` lives on `Match`.
- `Match.avenge(actorId, targetId)` requires a pending shot owned by `actorId` (otherwise `no-revenge`) and a living
  target other than the Hunter (otherwise `target-invalid`). It then sets the target, marks the shot resolved and calls
  `bury([targetId])`.
- `Match.skipRevenge(actorId)` is narrator only and works only with a shot pending (otherwise `no-revenge`).
- `Match.advance` returns `revenge-pending` while a shot is pending. Any advance clears a resolved shot from the view.

### Reveals
- A player's `revealedRole` is shown when any of these holds:
  - the player is dead and the reveal-role-on-death rule is on;
  - the outcome is set;
  - the player is in `soloWinnerIds`, because the Fool is revealed when they win.
- `matchViews` keeps a single `isRevealed(seat)` helper for this.

### Views
- `voting` is filled only during the vote phase:
  - `voters` counts the living players;
  - `voted` counts those with a target;
  - `locked` counts those who locked.
- `you.vote` is set during the vote for living players, otherwise null.
- The narrator's `votes` is set during the vote, keyed by voter.

### Application and socket
- One class per use case, built on `changeMatchAs`: `CastVote`, `LockVote`, `TakeRevenge`, `SkipRevenge`. They are
  wired into `createMatchUseCases`.
- `registerMatchHandlers` maps the four events with `answer`.

### Web
- `domain/voting.ts` holds pure helpers:
  - `voteTargetsFor(view)`: living players other than you.
  - `revengeTargetsFor(view)`.
  - `progressLabel`.
  - `tallyBars(verdict)`: each bar's width as a percentage of the top count, plus whether it is the top bar.
- `useMatchStore` gains `vote`, `lockVote`, `avenge` and `skipRevenge`. Failures are kept, as for the other commands.
- Components, with markup and classes from the canvas files and the existing `TargetPicker` reused:
  - `VoteDock` (canvas `Vote`): the picker, "Lock vote" or "Locked on X", and "N of M voted".
  - `VerdictReveal` (canvas `VoteReveal`, `Tie` and `Execution`): `.tally`, `.tally-row`, `.bar` with `is-top`, the
    executed card with `RoleCard` when the role is revealed, and the tie card.
  - `RevengeDock` for the dead Hunter (canvas `HunterRevenge`, without the countdown copy).
  - `HunterAimsBanner` for everyone else.
  - `FoolWinsCard` (canvas `FoolWins`) as a dismissible overlay. "Back to the village" is remembered per tab under the
    sessionStorage key `luna-llena.fool.<CODE>.<round>`.
- `PlayerTable`:
  - shows `VoteDock` during the vote and `VerdictReveal` during execution;
  - shows the revenge pieces whenever `revenge.pending`;
  - shows the Fool overlay when `verdict.foolWins`.
- `NarratorDashboard`:
  - a votes panel with each voter's target and lock state, plus the progress;
  - the verdict summary after the reveal;
  - a revenge panel with "Skip the shot" while one is pending;
  - "Next" disabled while a shot is pending.
- `GameOverView` lists `soloWinnerIds` under the winning team.
- All copy is in en and es.

## Risks / Trade-offs

- [A Hunter who never picks blocks the game] → the narrator's Skip button.
- [Players change their vote at the last second] → that is part of the fun. Locking is optional and only commits the
  vote.
- [A refactor of the dawn code could regress the night] → the existing night tests must stay green unchanged.
