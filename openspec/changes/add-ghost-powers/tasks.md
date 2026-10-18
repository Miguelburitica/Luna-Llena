## 1. Contracts

- [x] 1.1 Add the ghost input, effect and power view, the `haunt` timeline entry, the new errors and the haunt events; verify with `tsc` in packages/contracts

## 2. Server

- [ ] 2.1 Carry the `ghostPowers` house rule into the match; add `Match.haunt` with its validation order, the used-haunt set, `you.haunt` in the views, and the timeline entry; test "A fresh ghost", "Once per game", "The living can't haunt", "House rule off", "Too many words", "Whispering to the dead", `match-over`, and "The ghost's secret" in the timeline
- [ ] 2.2 Add the `Haunt` use case and `MatchPublisher.haunt` delivery, the socket publisher and the `match:haunt` handler; test "Lights out" (every member receives the flicker, and only the narrator's copy has `ghostId`) and "A word from beyond" (only the target and the narrator receive it), including a socket integration test

## 3. Web

- [ ] 3.1 Add `domain/ghosts.ts` with tests, and `haunt`, `hauntEffects` and `onHaunted` in the gateway and store, with store tests
- [ ] 3.2 Add `GhostDock`, `FlickerOverlay`, `WhisperToast` and `NarratorHauntFeed`, wire them into `PlayerTable` and `NarratorDashboard`, and render haunt entries in `EndStory`; add component tests for "Spent", the whisper form with its disabled state and the target picker, "Gentle flicker", the whisper toast, the narrator feed, and the end-story sentences

## 4. Verification

- [ ] 4.1 Run `pnpm check` green
- [ ] 4.2 In the browser with bots: a dead player flickers (every tab flickers) and whispers (only the target sees it), the narrator feed lists both, and the end screen shows the haunts
