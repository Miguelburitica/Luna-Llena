## Why

The village can't fight back yet: days pass with no vote, the Hunter's death is just a death, and the Fool has no way to
win. This change adds the heart of the day: a secret, simultaneous vote. The tally is revealed when the narrator calls
the execution. Ties spare everyone. The Hunter takes one last shot when killed, and the Fool steals a solo victory if
the village executes them.

## What Changes

- Voting during the vote phase:
  - Each living player votes for another living player, can change the vote until they lock it, or can abstain.
  - While voting is open, members only see how many have voted and locked. The narrator sees every vote live.
- Execution when the narrator advances from vote to execution:
  - The tally is revealed. Voter names are shown unless the anonymous-votes house rule is on.
  - The player with the most votes is executed.
  - A tie for the most votes, or no votes at all, means no execution.
- Hunter revenge:
  - When the Hunter dies by any cause, they must pick one living player, who dies at once.
  - Everyone sees "The Hunter takes aim…". The narrator cannot advance while the shot is pending, but can skip it.
- Fool win: if the village executes the Fool, everyone sees "The Fool wins!". The Fool is recorded as a solo winner
  and the game continues; the end screen lists them.
- Win detection now also runs after executions and revenge shots.
- Screens:
  - The vote dock (canvas `Vote`).
  - The tally reveal (canvas `VoteReveal`), the tie (canvas `Tie`) and the execution (canvas `Execution`).
  - Hunter revenge (canvas `HunterRevenge`) and the Fool's win (canvas `FoolWins`).
  - Narrator panels for live votes and the pending revenge.

## Capabilities

### New Capabilities
- `voting`: casting and locking votes, the tally, ties, executions, Hunter revenge and the Fool's solo win.

### Modified Capabilities
- `game-phases`:
  - Win detection also covers the Fool's solo win.
  - The game's outcome lists solo winners.
  - Advancing is blocked while the Hunter's shot is pending.

## Impact

- Contracts:
  - New vote and verdict views, a revenge view, `soloWinnerIds`.
  - New error codes.
  - The socket events `match:vote`, `match:lockVote`, `match:avenge` and `match:skipRevenge`.
- Server: the match domain gains vote state, verdict resolution and revenge, plus new use cases.
- Web: the match feature gains the vote dock, the verdict screens, revenge and the Fool's win, plus narrator panels.

## Non-goals

- Revenge or vote timers that run out on their own: the narrator advances, or skips the shot.
- The narrator breaking ties or overriding a verdict.
- Chat during the vote, last words, and the end-game awards.
