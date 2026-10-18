## Context

This builds on `match` (with night actions and voting), `chat` and `room`. The contracts are written and frozen:
- `packages/contracts/src/match/endGame.ts`:
  - `TimelineEntry`: a union of `night`, `vote`, `revenge` and `narrator` entries.
  - `TimelineVision`.
  - `SERVER_AWARD_IDS`: the four computed on the server.
  - `AWARD_IDS`: those plus `chatterbox`, computed on the web.
  - `Award`: `{ award, memberId, count | null }`.
- `MatchOutcome` is now `{ winner, timeline, awards }`. The server fills `awards` with the server awards only.
- Room:
  - the event `room:playAgain`;
  - the error `game-not-over`.

## Goals / Non-Goals

**Goals:**
- The timeline is recorded where events happen: in the `Match` aggregate, at the single death path and at the
  resolutions.
- Rematch is coordinated by the composition root, so no feature imports another.

**Non-Goals:** see proposal.md, Non-goals.

## Decisions

### Timeline recording in the Match aggregate
- `Match` keeps a private `timeline: TimelineEntry[]` and appends entries at four points:
  - **Night → dawn resolution:** a `night` entry built from the same `DawnResolution` used for the deaths, plus
    tonight's inspections. A real vision is `fromDrunk: false`.
  - **Vote → execution:** a `vote` entry with the verdict computed with `anonymous = false`, so it always carries
    voter ids. The live view's verdict still follows the anonymous-votes rule.
  - **`avenge`:** a `revenge` entry with the target.
  - **`skipRevenge`:** a `revenge` entry with `targetId: null`.
  - **`setAlive`:** a `narrator` entry when the state actually changes.
- `endGame` freezes the outcome as `{ winner, timeline: [...timeline], awards: awardsOf(...) }`.

### Awards
`domain/awardsOf.ts` is a pure function: `(timeline, seats)` → `Award[]`. Its order follows `SERVER_AWARD_IDS`.
- Votes are read from the `vote` entries' `tally.voterIds`, which are never null in the timeline.
- Ties are broken by seat order.
- Each award is computed as follows:
  - `most-suspicious`: the most total votes received, at least 1; `count` is the total.
  - `worst-liar`: the first `vote` entry whose `executedId` has a wolves-team true role; `count` is that round, used
    as the day number.
  - `betrayed-own-team`: counted among village-team voters, by true team; `count` is the number of votes they cast for
    other village-team players, at least 1.
  - `silent-assassin`: the first wolf in seat order with 0 votes received; `count` is null.

### Play again
- The room application's `GameStarter` port gains two methods:
  - `isOver(code): Promise<boolean>`
  - `discard(code): Promise<void>`
- New room use case `PlayAgain(actor)`. It checks, in order:
  1. narrator, otherwise `not-narrator`;
  2. the room is in game, otherwise `game-not-over`;
  3. `isOver`, otherwise `game-not-over`.

  It then calls `room.reopen()`, which sets the lobby status and makes every player not ready. Finally it saves and
  publishes the room, then calls `discard`.
- Composition root (`startServer`):
  - `isOver` asks the match feature through a new `IsMatchOver` use case.
  - `discard` calls a new match `DiscardMatch` use case, which removes the match from its repository, and a new chat
    `DiscardChat` use case, which removes the room's chat log.
  - `MatchRepository` and `ChatLogRepository` gain `remove(code)`.
- Socket: `room:playAgain` goes through `registerRoomHandlers` with `asActor`.

### Web
- `features/match/domain/endGame.ts` holds pure helpers:
  - `timelineChapters(outcome)`: groups the entries into `Night N` and `Day N` chapters. A night's chapter takes its
    night entry plus the revenge and narrator entries of the same round that happened before that round's vote. A day's
    chapter takes the vote entry plus the later revenge and narrator entries.
  - `plotTwistOf(view)`: when the player's perceived role differs from the true role in the outcome.
  - `flavorLineOf(winner)`.
- `features/chat/domain/chatterbox.ts`: `chatterboxOf(villageMessages, playerIds)` returns an `Award | null`, counting
  `player` and `last-words` messages.
- `GameOverView` is rebuilt from the canvas `EndGame`:
  - the winner banner with the flavor line, and the solo winners;
  - the plot-twist card;
  - "Who was who" (`.prow` rows with `RoleCard` mini or `tbadge`, with your seat marked);
  - "What really happened" (one disclosure per chapter, plus "Expand all");
  - the award cards (server awards plus chatterbox from `useChatStore`'s village messages);
  - Play again (narrator only) and Leave.
- Room web: `useRoomStore.playAgain()` through `RoomGateway.playAgain()`. `GameView` watches the room snapshot; when
  the status returns to `lobby`, it calls `router.replace` to the lobby route. `useMatchStore` and `useChatStore`
  reset their state for the code when that happens.
- All copy is in en and es, with sentences built per entry kind (for example "Wolves targeted {name}", "The Doctor
  saved {name}", "The Drunk “inspected” {name} and was told: {result}").

## Risks / Trade-offs

- [Timeline copy is hard to make read naturally in two languages] → one sentence per fact rather than generated
  prose. AI narration comes later.
- [Discard while a member is mid-request] → `match-not-found` is handled by `GameView` by going back to the lobby.
