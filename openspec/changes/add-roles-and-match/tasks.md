## 1. Contracts

- [x] 1.1 Add the role catalog, `no-wolves`, and the match vocabulary, views and events to packages/contracts, and verify `pnpm -r typecheck`

## 2. Server room changes

- [ ] 2.1 Move room and member channels to `src/shared/infrastructure/socketChannels.ts` and verify the room integration tests still pass
- [ ] 2.2 Enforce `ROLE_CATALOG` copy limits in `RoomSettings`, add `no-wolves` to `StartReadiness`, and reject player leave in game; verify with domain tests for "Role over its limit", "A deck without wolves" and "Leaving mid-game"
- [ ] 2.3 Add the `GameStarter` port and call it from `StartGame`; verify with an application test that the opening carries the code, narrator, players, deck, timers and reveal rule

## 3. Server match domain

- [ ] 3.1 Add `dealRoles` with an injected random source; test "Seven players, seven cards" and that a seeded sequence deals a deterministic, complete assignment
- [ ] 3.2 Add the `Match` aggregate, with tests for "The first night", "A full day passes", "A player tries to advance", "Night countdown", "Manual day", "More time", `timer-not-running`, "Narrator marks a death", the win scenarios ("Last wolf falls", "Wolves take over", "Keep playing"), "The village celebrates", "Ending too early" and `match-over`

## 4. Server match application

- [ ] 4.1 Add the `Clock` and `RandomSource` shared ports, the match ports, `toMatchViews` and the use cases; test "A villager looks around", "The wolf pack", "The narrator's view", "The Drunk looks at their card", "Role revealed on death", "Role kept secret on death", and `SyncMatch` returning only the caller's view

## 5. Server match infrastructure

- [ ] 5.1 Add the in-memory repository, system clock, random source, `SocketMatchPublisher`, `registerMatchHandlers` and the wiring in `startServer`; extend the socket integration tests so that starting a room sends each player a private `match:view` (no other roles leak) and the narrator can advance, kill and end the game; test "Reload mid-game" via resume and `match:sync`

## 6. Web room changes

- [ ] 6.1 Add `deckAdvice.ts` with tests for every balance verdict and suggested deck scenario
- [ ] 6.2 Update `RoomSetupView` (player count, suggested deck, verdict badge, catalog maxima) and `NarratorLobby` (suggested deck button, `no-wolves` check); redirect `LobbyView` to the game route when in game; extend the component tests

## 7. Web match feature

- [ ] 7.1 Add the match domain functions (`phaseLook`, `secondsLeft`, `seatPositions`, `nextPhaseOf`) with unit tests
- [ ] 7.2 Add the `MatchGateway` port, `useMatchStore` and `useCountdown`, with store tests against a fake gateway (sync on entry, live views, narrator commands, errors kept)
- [ ] 7.3 Add `SocketMatchGateway`, `installMatch`, match i18n (en and es), the shared `RoleCard`, the role card copy, `GameView`, `RoleRevealOverlay`, `PlayerTable`, `NarratorDashboard` and `GameOverView`, following the canvas; add component tests for "First look", "Peek later", the narrator's Kill and Next, the win banner, and the game-over roles

## 8. Verification

- [ ] 8.1 Run `pnpm check` green
- [ ] 8.2 Play in the browser: start a 6-player game (bots), see role reveal on a player tab, advance a full cycle, kill the wolves, end the game, and see all roles
