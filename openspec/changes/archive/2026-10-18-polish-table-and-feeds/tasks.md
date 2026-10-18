## 1. Contracts

- [x] 1.1 Add `HauntRecord` and `NarratorMatchView.haunts`, and reuse `HauntRecord` in the timeline entry; verify with `tsc` in packages/contracts

## 2. Server

- [x] 2.1 Fill the narrator's `haunts` in `matchViews` from the match's haunt records, with players never receiving it; test it alongside the existing haunt tests, including after a simulated reload via `SyncMatch`

## 3. Web

- [x] 3.1 Move the seat ellipse per design.md, update the `seatPositions` tests, and add a test that every seat's top is at least 35%; add the readable name pills in `PlayerTable`
- [x] 3.2 Add `defaultTab` by phase and access, and apply it when the chat sheet opens unless a tab was picked; test "Wolves open the den" and that a picked tab sticks
- [x] 3.3 Add `stepperOf` with tests and show the round on every step in `NarratorDashboard`; test "Rounds on the stepper"
- [x] 3.4 Make `NarratorHauntFeed` render `view.haunts`, with toasts only for live effects after mount; test "Narrator reloads"

## 4. Verification

- [x] 4.1 Run `pnpm check` green
- [x] 4.2 In the browser at phone width, check the scene on night, dawn, day and vote with 7 players: no seat over the moon or sun, every name readable, a wolf opening chat lands on Wolves, the narrator stepper shows rounds, and the haunt feed survives a reload
