## 1. Contracts

- [x] 1.1 Add the timeline entries, the awards, the extended `MatchOutcome`, `room:playAgain` and `game-not-over`; verify with `tsc` in packages/contracts

## 2. Server match

- [ ] 2.1 Record the timeline in `Match` at dawn, at execution (always with voter ids), at revenge taken or skipped, and at narrator kills or revives that change state; freeze it into the outcome; test "Story of a night", "Secrets stay secret until the end" and "Anonymous votes revealed at last"
- [ ] 2.2 Add `awardsOf`; test "Most Suspicious", "Worst Liar", "No liar caught", "Betrayed Own Team", "Silent Assassin", ties broken by seat order, and awards with no winner left out
- [ ] 2.3 Add the `IsMatchOver` and `DiscardMatch` use cases and `MatchRepository.remove`, with tests

## 3. Server room and chat

- [ ] 3.1 Add `ChatLogRepository.remove` and a `DiscardChat` use case, with tests
- [ ] 3.2 Extend the `GameStarter` port with `isOver` and `discard`, and add `Room.reopen` and the `PlayAgain` use case; test "Rematch" (same seats, everyone not ready, accepting players), "Too soon" and the `not-narrator` case
- [ ] 3.3 Wire `room:playAgain` and the port in `startServer`; add a socket integration test that plays to the end, checks the outcome timeline and awards, plays again, starts a new game and checks "Fresh chat"

## 4. Web

- [ ] 4.1 Add the match domain `endGame.ts` (chapters, plot twist, flavor line) and the chat domain `chatterbox.ts`, with unit tests; add `playAgain` to the room gateway and store; return `GameView` to the lobby on reopen and reset the match and chat stores; add store and view tests
- [ ] 4.2 Rebuild `GameOverView` following the canvas `EndGame` (banner, solo winners, plot twist, who was who, the timeline chapters with "Expand all", award cards including Chatterbox, Play again for the narrator, Leave); add component tests for "Plot twist", "Reading the story", the awards and Play again

## 5. Verification

- [ ] 5.1 Run `pnpm check` green
- [ ] 5.2 In the browser with bots, play to the end and read the timeline and awards; play again, check everyone returns to the lobby, and start a second game with an empty chat
