## 1. Contracts

- [x] 1.1 Add `no-fool-win` to `MATCH_ERROR_CODES`, `foolClaimIds` to `NarratorMatchView` and `match:declareFoolWin` to the match events

## 2. Server domain (packages/rules)

- [x] 2.1 Add `Match.foolClaimIds` and `Match.declareFoolWin`; test in `Voting.test.ts` "Executed by hand", "Killed at night" (no claim), "Not the Fool's day" (living Fool, night-killed Fool, revived Fool, not the Fool) and "Only the narrator calls it"
- [x] 2.2 Send `foolClaimIds` in `narratorViewOf`; test in `narratorViewOf.test.ts`

## 3. Server application

- [x] 3.1 Add the `DeclareFoolWin` use case; test in `voting.test.ts` that every member sees the Fool revealed and recorded as a solo winner and the game goes on ("Executed by hand"), and the `no-fool-win` and `not-narrator` rejections

## 4. Server infrastructure

- [x] 4.1 Register `match:declareFoolWin` with `answer`; test it in `registerMatchHandlers.test.ts`

## 5. Web domain

- [x] 5.1 Add `gameSummaryOf` and `rolesByTeam` to `endGame.ts`; test "The game in numbers" and "Who was who by team" in `endGame.test.ts`

## 6. Web application

- [x] 6.1 Add `declareFoolWin` to the gateway port, the fixture gateway and the store; test in `useMatchStore.test.ts`

## 7. Web infrastructure

- [x] 7.1 Implement `declareFoolWin` in `SocketMatchGateway`
- [x] 7.2 Show solo winners and the Fool call on `NarratorDashboard`; test "Calling it from the dashboard" and "Solo winners stay on the dashboard" in `NarratorDashboard.test.ts`
- [x] 7.3 Redesign `GameOverView`, `EndStory` and `EndAwards`; extend `GameOverView.test.ts` with "The game in numbers" and "Who was who by team", keeping "Plot twist" and "Reading the story"
- [x] 7.4 Add en and es copy to `matchMessages.ts`

## 8. Verification

- [x] 8.1 Run `pnpm check` green
- [x] 8.2 In the browser at phone and desktop width, check the end screen after a village win (day scene) and a wolves win (night scene), and the Fool call on the dashboard
