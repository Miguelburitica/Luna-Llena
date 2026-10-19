## 1. Contracts and shared rules

- [x] 1.1 Add `TABLE_ERROR_CODES` with `nothing-to-undo` and its `TableError` type to `packages/contracts`; verify with `tsc` in packages/contracts
- [x] 1.2 Create `packages/rules` (`@luna/rules`) with package.json, tsconfig and vitest config; register it in the workspace and as a dependency of `apps/server` and `apps/web`
- [x] 1.3 Move `Match`, `Night`, `Ballot`, `Seat`, `dealRoles`, `resolveDawn`, `verdictOf`, `winnerOf`, `awardsOf`, `Match.fixtures.ts` and their tests from `apps/server/src/features/match/domain` to `packages/rules/src/domain/match`, export them from `src/index.ts`, and keep every moved test green ("Seven players, seven cards", "Saved by the Doctor", "Poison and claws", "A tie", "Fooled you", "Last wolf falls", "Wolves take over", awards)
- [x] 1.4 Add `narratorViewOf(match, now, chat)` to `@luna/rules` by lifting the narrator projection out of `matchViews.ts`, with a test that the narrator view of a seeded night matches the previous output, including the dawn preview and the Drunk shown as Drunk

## 2. Server domain

- [x] 2.1 Keep only `chatPermissionsOf` in `features/match/domain` and point it and its test at `Match` from `@luna/rules`

## 3. Server application

- [x] 3.1 Point every match use case, `matchAccess`, the fixtures and `matchViews` at `@luna/rules`, and make `toNarratorView` delegate to `narratorViewOf` with `chatAccessFor`; the existing use case tests pass unchanged

## 4. Server infrastructure

- [x] 4.1 Point `InMemoryMatchRepository`, `SocketMatchPublisher` and `registerMatchHandlers` at `@luna/rules`; the existing socket integration tests pass unchanged

## 5. Web domain

- [x] 5.1 Add `features/table/domain/tableSetup.ts` (`validateSetup`, `seatNameOf`, defaults) with tests "Quick setup", "Same name twice", "Deck too big", "Too few players" and the name length rule
- [x] 5.2 Add `features/table/domain/tableJournal.ts` (journal type, `replayJournal`, `appendEntry`, `undoLast`, `dealProgressOf`) with tests "Seven seats, seven cards", "Reload mid-deal", "Wrong victim", "Undo a dawn", "Nothing to undo", a Drunk vision that stays stable on replay, a hunt counted for every living Werewolf ("The pack points"), and rejection of invalid entries with `Match`'s codes ("One peek per night")
- [x] 5.3 Add `features/table/domain/nightScript.ts` (`nightScriptOf`, `unloggedSteps`) with tests "Script for the default deck", "A dead Seer", "No Witch in the deck" and "Forgot the Doctor"
- [x] 5.4 Add `features/table/domain/tableBallot.ts` (`ballotByAccused` and the move or clear rule for a voter) and `tableSeatsOf`, with tests "Hands up" and "Changing hands"

## 6. Web application

- [x] 6.1 Add the table ports (`TableJournalStore`, `RandomSource`, `Clock`), their fixtures and `useTableStore`, with store tests covering "Offline table" (no gateway is injected), "Privacy between players", "No peeking back", "A full day passes", "The narrator sees everything", "Same patient twice", "Heal already used", "Saved by the Doctor", "Poison and claws", "One last shot", "Waiting for the shot", "A tie", "Fooled you", "Last wolf falls", "Wolves take over", "A player goes home", "Votes remembered", "Rematch at the table", "The phone locks mid-game" and "Starting over"
- [x] 6.2 Add `useTableCountdown` with tests "Day countdown" and "Time's up" (fires once per phase, no advance)
- [x] 6.3 Give `useAtmosphereStore` `followScene` and `playHere`, and add `SoundEngine.playAlert`; add store tests "Thunder at the table" (played locally, no gateway call), "Nightfall sting" from a followed table scene, and that the online match scene is restored on unmount; keep the existing atmosphere tests green

## 7. Web infrastructure

- [x] 7.1 Add `LocalTableJournalStore` (try/catch device storage), `MathRandomSource`, `SystemClock`, `installTable`, `tableRoutes` with guards, and `tableMessages` in en and es
- [x] 7.2 Refactor `RoleRevealOverlay`, `PhaseTimer`, `DawnAnnouncement` and `VerdictReveal` to take props, and extract `DeckBuilder` from `RoomSetupView`; the existing match and room view tests pass unchanged
- [x] 7.3 Add the `alarm` recipe to `WebAudioSoundEngine` and the `local` prop to `NarratorSoundboard`, with a smoke test against the fake `AudioContext`
- [x] 7.4 Add `TableSetupView` (canvas `NarratorSetup` plus the new seats panel) and the Home buttons "Play in person" and "Resume table game", with view tests "Quick setup", "Same name twice", "Deck too big" and "Starting over"
- [x] 7.5 Add `DealView` (privacy screen, `RoleRevealOverlay`, hand back with hold-to-open) with view tests "Privacy between players", "No peeking back", "The Drunk's card", "The pack", "Back to the narrator" and "A quick tap"
- [x] 7.6 Add `LogbookView` with the night script and the step sheets (hunt, vision with `VisionCard`, protect, potions), with view tests "Script for the default deck", "A dead Seer", "No Witch in the deck", "Wolves cannot eat wolves", "A true vision", "The Drunk's vision", "Same patient twice", "The Witch sees the target", "Heal already used", "Forgot the Doctor" and "Who was Caro again" (tapping a seat opens its role card)
- [x] 7.7 Add the logbook dawn, Hunter sheet, accused-first vote entry, execution, win prompt, corrections and undo, with view tests "A death at dawn", "One last shot", "Waiting for the shot", "Hands up", "Changing hands", "A tie", "Fooled you", "Last wolf falls", "A player goes home" and "Wrong victim"
- [x] 7.8 Add the timer, +30 s, time's up alert and on-device soundboard to the logbook, and `TableScreenView` with `ScreenEffects` and hold-to-return, with view tests "Day countdown", "Time's up", "Thunder at the table", "Facing the table" and "Lightning for the table"
- [x] 7.9 Add `TableOverView` reusing `EndStory` and `EndAwards`, with view tests "The village celebrates", "Votes remembered" and "Rematch at the table"
- [x] 7.10 Add a test that no request or socket connection is opened while playing a full in-person game ("Nothing leaves the device")

## 8. Verification

- [x] 8.1 Run `pnpm check` green
- [x] 8.2 In the browser at phone width, with the network offline: set up 8 players, deal by passing through every privacy screen, play two nights and days logging every power and a vote, undo a mis-tap, reload mid-day and resume, use the soundboard and the table screen, and finish on the end summary
- [x] 8.3 Play one online game end to end to confirm the moved rules behave as before
