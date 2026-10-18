## 1. Contracts

- [x] 1.1 Add the voting views, the new `MatchView` fields, the error codes and the four socket events; verify with `tsc` in packages/contracts

## 2. Server match domain

- [x] 2.1 Add the single death path `bury` and refactor the dawn and `setAlive` onto it; the existing night and phase tests stay green unchanged
- [x] 2.2 Add `Ballot`, `Match.vote` and `Match.lockVote`; test "A first vote", "Voting during the night", "Voting for yourself" and "Lock it in", plus the dead and narrator rejections
- [x] 2.3 Add `verdictOf` and the vote→execution transition; test "The village has spoken", "A tie", "Nobody voted", "Anonymous votes", "Fooled you", "Killed at night", "Execution ends it" and "The Fool laughs last"
- [x] 2.4 Add revenge (`avenge`, `skipRevenge`, `revenge-pending`); test "One last shot" (for a death at dawn and for an execution), "Waiting for the shot", "The Hunter is away", "Not your shot", and a revenge triggered by the narrator's kill

## 3. Server application and infrastructure

- [x] 3.1 Extend `matchViews` (`voting`, `you.vote`, narrator `votes`, `verdict`, `revenge`, `soloWinnerIds`, the shared `isRevealed`) and add the use cases `CastVote`, `LockVote`, `TakeRevenge` and `SkipRevenge`; test "Counting without telling" (no player view leaks another player's vote) and "The narrator watches"
- [x] 3.2 Handle the four events in `registerMatchHandlers`; extend the socket integration test with a full vote → execution → Hunter revenge, checking what each member receives

## 4. Web match feature

- [x] 4.1 Add `domain/voting.ts` with unit tests, and add `vote`, `lockVote`, `avenge` and `skipRevenge` to the store and gateway with store tests
- [x] 4.2 Add `VoteDock`, `VerdictReveal`, `RevengeDock`, `HunterAimsBanner` and `FoolWinsCard`, wire them into `PlayerTable`, add the votes, verdict and revenge panels to `NarratorDashboard`, and add solo winners to `GameOverView`; add component tests for "Vote dock" (picker, lock, "Locked on X", progress), the tally reveal, "Tie card", the execution with role card, the Hunter's picker against the others' banner, the Fool overlay and its dismissal, the narrator's live votes and Skip, and Next disabled while a shot is pending

## 5. Verification

- [x] 5.1 Run `pnpm check` green
- [x] 5.2 Play a vote in the browser with bots: cast and lock votes, reveal the tally, execute, and trigger the Hunter's revenge
