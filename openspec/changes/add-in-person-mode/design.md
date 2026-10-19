## Context

Online, a match lives on the server (`apps/server/src/features/match/domain/Match.ts`). Each member gets a projected
view (`matchViews.ts`), and the web renders it through `useMatchStore`. In person there is one device and one user,
the narrator. The players only touch the phone to see their own card.

What already exists and is pure:
- **The `Match` aggregate and its helpers:** `Night`, `Ballot`, `Seat`, `dealRoles`, `resolveDawn`, `verdictOf`,
  `winnerOf` and `awardsOf`. They import nothing but `@luna/contracts`. Randomness comes in as a `{ next(): number }`
  argument and time as `now: number`.
- **The web view rules in `features/match/domain`:** `phases` (stepper, clock, scene), `night` (targets, action lines,
  death announcement), `voting` (tally bars, verdict outcome), `endGame` (chapters, facts, flavor, plot twist,
  ordered awards) and `seating`.
- **`deckAdvice` in `features/room/domain`:** the balance verdict and the suggested deck.
- **`features/atmosphere`:** the domain (`ambientFor`, `stingsBetween`, `soundSettings`, `soundboard`) and
  `WebAudioSoundEngine`.

## Goals / Non-Goals

**Goals:**
- One set of game rules for both modes. Not a single rule is restated in the web app.
- The in-person game works with no network, survives a reload, and can undo a mis-tap.
- Reuse the existing role cards, pickers, end-game pieces and atmosphere instead of drawing new ones.

**Non-Goals:** see proposal.md, Non-goals.

## Decisions

### 1. Offline on the device, with the rules in a shared package (not server seats without sockets)

**Chosen:** the in-person game runs only in the browser. The rules move into a new workspace package,
`packages/rules` (`@luna/rules`), which the server and the web both import.

**Rejected: reusing the server match with seats that have no sockets.** It looks like more reuse, but it fights the
current model at every step:
- **`Room`:** seats come from joins with tokens, readiness and presence. Start conditions require every player ready
  and connected. Seats with no sockets would need a new "offline seat" kind, which touches `features/room`, and the
  bots change is reworking that right now.
- **`Match` authority:** each action checks that the actor is the seat (`act`, `vote`, `avenge`). The narrator acting
  "as" Luis needs an impersonation rule in the server. That is a new rule, and a hole in the server's main promise:
  each member only knows what they may know.
- **Publishers:** they would send views to members who aren't there, and the narrator dashboard would still show
  chat, ghosts, last words and voice-call panels that don't apply.
- **Operations:** a party with bad Wi-Fi loses the game, and the in-memory server loses it on restart.

**Why offline is simpler:**
- `Match` is already pure, so moving it is a mechanical refactor.
- In the browser, the narrator calls `match.act(seatId, …)` for each seat with no authority problem: on one device
  the narrator *is* every actor.
- Persistence is a local journal (see 3).
- The server is untouched in behaviour.

**Package shape:**
```
packages/rules/
  package.json          name @luna/rules, exports ./src/index.ts, depends on @luna/contracts
  src/domain/match/     Match.ts Night.ts Ballot.ts Seat.ts dealRoles.ts resolveDawn.ts verdictOf.ts winnerOf.ts
                        awardsOf.ts narratorViewOf.ts + their *.test.ts and Match.fixtures.ts
  src/index.ts
```
Placing the code under `src/domain/` makes the existing ESLint rule apply as it is: no `application` or
`infrastructure` imports and no frameworks. `chatPermissionsOf` stays in the server because chat is online-only.

**`narratorViewOf(match, now, chat): NarratorMatchView`** is the narrator half of `matchViews.ts`, lifted unchanged.
The server passes `chatAccessFor(match, narratorId, now)`. The table passes a constant "no chat" access. This gives
the web table a real `MatchView`, so `stingsBetween`, `ambientFor`, `stepperOf`, `tallyBars`, `timelineChapters` and
the rest work with no change.

**Sequencing:** the move touches `features/match` on the server only. It should land after `add-bots` merges, or be
rebased on it, because bots may import match domain types.

### 2. Web feature `table`

The in-person game is the "table" in code: `apps/web/src/features/table/{domain,application,infrastructure}`.

**Domain (pure):**
- **`TableSetup`:**
  - `seatCount` (6..`ROOM_LIMITS.maxPlayers`);
  - `names: (string | null)[]`;
  - `timers` (values from `TIMER_OPTIONS`);
  - `revealRoleOnDeath`;
  - `deck`.

  `validateSetup(setup)` returns per-seat name errors (`name-invalid` or `name-taken`, from contracts, with
  `ROOM_LIMITS.maxNameLength`) and the unmet deck conditions (`deck-mismatch` or `no-wolves`, from
  `START_CONDITIONS`). `seatNameOf(setup, index)` returns the name, or `null` so i18n renders "Player N".
- **`TableJournal`:** the saved game.
  ```
  { version, setup, seats: { id, role }[], dealtUpTo: number, entries: JournalEntry[], startedAt }
  JournalEntry =
    | { kind: 'hunt', targetId, at }        | { kind: 'inspect', seerId, targetId, draw, at }
    | { kind: 'protect', doctorId, targetId, at } | { kind: 'potions', witchId, heal, poisonTargetId, at }
    | { kind: 'vote', voterId, targetId | null, at } | { kind: 'avenge', targetId, at } | { kind: 'skip-revenge', at }
    | { kind: 'set-alive', seatId, alive, at } | { kind: 'advance', at } | { kind: 'extend-timer', at }
    | { kind: 'keep-playing', at } | { kind: 'end-game', at }
  ```
  - `draw` is the random number given to `Match.act` for an inspection. That keeps a Drunk's vision stable on replay.
  - `TABLE_NARRATOR_ID = 'narrator'`, seat ids are `seat-1…seat-N`, and the match code is the constant `TABLE`.
- **`replayJournal(journal): Result<Match, MatchError>`:** `Match.begin` with `lastWords`, `ghostPowers` and
  `anonymousVotes` set to false, and the setup's timers and reveal rule. It then applies each entry with its `at` as
  `now`:
  - `hunt` calls `act` for every living Werewolf;
  - `vote` calls `vote(voterId, …)`;
  - `avenge` uses the pending `match.revenge.hunterId`;
  - the rest map one to one.
- **`appendEntry(journal, entry, random)`:** replays, applies the new entry, and returns the new journal only when
  `Match` accepted it. Errors are `Match`'s own codes.
- **`undoLast(journal)`:** drops the last entry, or returns `nothing-to-undo`.
- **`nightScriptOf(view, seats)`:** builds the wake-up steps from the narrator view and the true roles, in order hunt,
  Seer, Drunk, doctor, witch. Each step is `{ power, playerIds, status: 'pending' | 'logged' | 'pretend' }`. A step is
  `pretend` when every player who holds that power is dead.
- **`unloggedSteps(script)`:** feeds the "end the night anyway?" confirmation.
- **`ballotByAccused(view)`:** groups `view.votes` by target for the accused-first vote screen.
- **`dealProgressOf(journal)`:** returns the current seat to deal, or `done`.
- **`tableSeatsOf(journal, view)`:** maps to the match `Seat` shape (name, `avatar: null`, alive, revealedRole), so
  `EndStory`, `EndAwards` and `TargetPicker` take it unchanged.

**Application:**
- **Ports:**
  - `TableJournalStore`: `load(): TableJournal | null`, `save(journal)` and `clear()`;
  - `RandomSource`: `next(): number`, used for dealing and for Drunk draws;
  - `Clock`: `now()`.
- **`useTableStore` (Pinia setup store with injected adapters):**
  - state: `journal` and `failure`;
  - derived:
    - `match`, from `replayJournal`, memoised per journal;
    - `view = narratorViewOf(match, clock.now(), NO_CHAT)`;
    - `seats`, `script` and `dealProgress`;
  - actions:
    - setup: `startSetup` and `deal(setup)`, which calls `dealRoles`;
    - dealing: `markSeen()` and `openLogbook()`;
    - night: `logHunt`, `logVision` (draws `random.next()` and stores it), `logProtect` and `logPotions`;
    - vote: `logVote(voterId, targetId | null)`;
    - Hunter: `logRevenge` and `skipRevenge`;
    - corrections: `setAlive`;
    - phases and outcome: `advance`, `extendTimer`, `keepPlaying` and `endGame`;
    - journal: `undo`, `playAgain` (same setup, new deal) and `abandon`.

  Every action goes through `appendEntry` and saves the journal.
- **`useTableCountdown`:** like `useCountdown`, from `view.phaseEndsAt` with `serverNow` equal to the local clock.
  It also emits `timeUp` once per phase.

**Infrastructure:**
- `LocalTableJournalStore`, through `shared/infrastructure/storage/deviceStorage` with try/catch;
- `MathRandomSource` and `SystemClock` for the web;
- `installTable(app)`;
- `tableRoutes`;
- i18n `tableMessages` in en and es;
- the views and components below.

**Ownership:** the room and match stores are never used by the table. The table reaches other features only through
their components with props, their domain functions, and the atmosphere store (see 4).

### 3. A command journal, not a snapshot

The saved game is the setup, the deal and the list of logged commands. The `Match` is rebuilt by replaying them.

- **No serialization of `Match` internals.** Its private Maps for visions, blocked patients, spent potions and so on
  stay private.
- **Undo is "drop the last entry and replay".** It is exact for everything, including spent potions and Hunter shots.
- **The rules stay in one place.** The journal never decides anything. It only records what the narrator tapped.
- **The cost is negligible:** a long game is a few hundred entries, and `Match` replays them in well under a
  millisecond each.
- **A version number on the journal** lets a future format change drop an unreadable save instead of crashing.

### 4. Atmosphere follows a scene, not always the online match

Today `useAtmosphereStore` watches `useMatchStore().view` and sends cues through `CueGateway`.

- The store gains `followScene(source: () => MatchView | null)`. It defaults to `useMatchStore().view`. While mounted,
  the table views call `followScene(() => table.view)` and restore the default on unmount. Stings and ambient keep
  using `stingsBetween` and `ambientFor` on whatever scene is followed.
- The store gains `playHere(input: CueInput)`. It plays the cue on this device, with a generated id, through the same
  path as a received cue. `NarratorSoundboard` gets a `local` prop that calls `playHere` instead of `sendCue`.
- **"Time's up" alarm:** a short synthesized recipe in `soundRecipes` (`alarm`), played through a new
  `SoundEngine.playAlert(volume)` method. It is not added to `SOUND_CUES`, so the online soundboard is unchanged.

### 5. Making match components mountable outside the online game

These are small prop refactors with no visual change:
- **`RoleRevealOverlay`:** takes `pack: readonly { name; avatar }[]` instead of reading `useRoomStore`. `GameView`
  maps the members.
- **`PhaseTimer`:** takes `seconds: number | null` and `totalSeconds`. `PlayerTable` and `NarratorDashboard` compute
  them as they do now.
- **`DawnAnnouncement` and `VerdictReveal`:** take `MatchView` (not only `PlayerMatchView`). They read only the common
  fields.
- **`DeckBuilder.vue`** is extracted from `RoomSetupView` into `features/room/infrastructure/components`, with
  `v-model:deck` and `players` props. Both setups mount it.

### 6. Screens

Existing canvas screens and what each table view takes from them:

| Table view | Canvas source | Notes |
|---|---|---|
| `TableSetupView` | `NarratorSetup` (deck builder, timers, house rules) | New "Seats" panel: a player counter and an ordered list of optional name fields. No room name, theme or voice call. |
| `DealView`: privacy screen | **new** | Full-screen sticker card "Pass the phone to Caro", seat n of N, and a big "I'm Caro" button. The night background, no role art. |
| `DealView`: card | `RoleReveal`, `RoleRevealWolf` | Reuses `RoleRevealOverlay`, with "I've seen it" instead of close. The pack names show for wolves. |
| `DealView`: hand back | **new** | "Give the phone back to the narrator" with a hold-to-open ring. The same ring is reused by the table screen. |
| `LogbookView` | `NarratorDashboard` | The stepper, timer, seat list with true roles and dead state, the soundboard, Next and +30 s. The chat monitor, haunt feed and voice call are left out. The right column swaps by phase. |
| Logbook night | `NarratorDashboard` night column, `NightWolf`, `NightSeer`, `NightDoctor`, `NightWitch` | **New layout:** the wake-up script list. Each step opens a sheet with `TargetPicker` and the role's dock look. |
| Vision result card | `NightSeer` ("The crystal ball says…") | **New:** a full-screen card meant to be shown to the Seer. Big wolf or not-wolf art, and nothing else. |
| Logbook dawn | `Dawn`, `DawnNobody` | Reuses `DawnAnnouncement`. |
| Hunter sheet | `HunterRevenge` | Reuses the `RevengeDock` look in a sheet, with Skip. |
| Logbook vote | `Vote`, `NarratorDashboard` votes | **New layout:** accused-first hands entry. The living players are chips, and the running tally reuses `tallyBars`. |
| Logbook execution | `VoteReveal`, `Execution`, `Tie`, `FoolWins` | Reuses `VerdictReveal` and `FoolWinsCard`. |
| Win prompt | `NarratorDashboard` pending winner | The same end-or-keep-playing panel. |
| `TableScreenView` | `Day`, `Dawn`, `Motion` | **New:** the phase scene, a big countdown, and the latest announcement or verdict. `ScreenEffects` are mounted. Hold to return. |
| `TableOverView` | `EndGame` | Reuses `EndStory` and `EndAwards`, the who-was-who grid and the plot twist. Play again, Back to setup and Leave. |
| Home buttons | `Home` | "Play in person" and "Resume table game". |
| Settings | `Settings` | Reused as it is. |

New screens should be drawn in Claude Design (`design/canvas`) before the views are built: `TableSetup`, `PassPhone`,
`HandBack`, `LogbookNight`, `VisionCard`, `LogbookVote` and `TableScreen`.

### 7. Routes

| Route | View | Guard |
|---|---|---|
| `/table/setup` | `TableSetupView` | Confirms before discarding a saved game. |
| `/table/deal` | `DealView` | Needs a journal that is not fully dealt. |
| `/table` | `LogbookView` | Needs a fully dealt journal that has been opened. |
| `/table/stage` | `TableScreenView` | Same as `/table`. |
| `/table/over` | `TableOverView` | Needs a match outcome. |

`/table/resume` sends the narrator to the right route from the saved journal.

### 8. Found while building

- **No connection during in-person play.** The socket used to connect as soon as the app loaded, so it pinged the
  server even at the table. It is now created with `autoConnect: false`. `app/connectOnlineRoutes` connects it on online
  routes and disconnects it on every `/table*` route.
- **The first night starts when the logbook opens.** It no longer starts at the deal, so Night 1's timer doesn't run
  while the phone goes around. `openLogbook` sets the journal's `startedAt`.
- **Guards:** `tableScreenOf(progress, isOver)` and `useTableGuard` send each table route to the screen the saved game
  is on. `/table/resume` is the entry from Home.
- **`DeckBuilder`** takes `playersFixed`. The table hides the deck builder's own player counter because the seats
  decide the number of players.

## Use cases, ports and events added

- **Server:** no new use case, port or socket event.
- **Web table store actions:** `deal`, `markSeen`, `openLogbook`, `logHunt`, `logVision`, `logProtect`, `logPotions`,
  `logVote`, `logRevenge`, `skipRevenge`, `setAlive`, `advance`, `extendTimer`, `keepPlaying`, `endGame`, `undo`,
  `playAgain` and `abandon`.
- **Web ports:**
  - `TableJournalStore`, `RandomSource` and `Clock` in `features/table`;
  - `SoundEngine.playAlert` in `features/atmosphere`.

## Risks / Trade-offs

- **The move collides with the bots change.** Mitigation: land it after `add-bots`. It is a pure move with tests that
  move along, and `pnpm check` proves it.
- **The pack pick is logged for every wolf.** If the wolves split, the narrator logs the one they settled on. This
  matches table play, where the pack points together.
- **Per-voter vote logging is slower than "Luis got 4".** It is needed for the verdict rule, the end story and three
  of the four awards. The accused-first entry keeps it to one tap per raised hand.
- **localStorage can be cleared.** The game is then lost. This is acceptable for a party tool, and the store fails
  softly.
- **Phone screen effects are small for a table.** The table screen makes them usable. A real second screen is an open
  question.

## Decided with the user

- **Consulting roles:** the narrator can open any seat's role card from the logbook at any time. A player who forgot
  their role asks the narrator. The deal itself still never goes back.
- **Players:** the minimum stays 6.
- **Seats:** names only, with no avatars, to keep setup fast.
- **Second screen:** a TV or laptop showing the table screen is a possible later change, not part of this one.

- **Roles not dealt:** the wake-up script skips them entirely, with no pretend step and no time spent. Pretend steps
  exist only for powers whose players are dead.

## Open Questions

None.
