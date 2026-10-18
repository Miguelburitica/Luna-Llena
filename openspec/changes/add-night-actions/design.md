## Context

This builds on the `match` feature (see the archived change `2026-10-18-add-roles-and-match` and the specs
`game-phases`, `role-assignment`). The contracts for this change are already written and frozen:
- `ROLE_CATALOG[role].nightAction`: `hunt`, `inspect`, `protect`, `potions` or `suspect`. The Drunk's is `inspect`.
- `packages/contracts/src/match/night.ts`:
  - `NightActionInput`, `Vision` and `PlayerNightView` (a union keyed by `action`).
  - `NarratorActionView`, `DawnPreview`, `NarratorNightView` and `DawnReport`.
- `MatchView` changes:
  - Common: `dawn: DawnReport | null`.
  - Player `you`: `night: PlayerNightView | null` and `visions: Vision[]`.
  - Narrator: `night: NarratorNightView | null`.
- New error codes: `not-night`, `player-dead`, `not-your-action`, `target-invalid`, `already-inspected`,
  `protected-last-night`, `potion-used`.
- New socket event `match:act` with a `NightActionInput`.

## Goals / Non-Goals

**Goals:** night behaviour that lives entirely in the match domain, with the secrecy rules enforced in `matchViews`.
**Non-Goals:** see proposal.md, Non-goals.

## Decisions

### Night state inside the Match aggregate
A `Night` value or class in `features/match/domain/Night.ts`, owned by `Match`:
- `huntPicks`: an ordered list of `{ wolfId, targetId }`. A wolf re-picking replaces its entry and moves it to the end,
  so the recency tie-break works.
- `inspections`: `Map<memberId, Vision & { fromDrunk }>`, fixed once set.
- `protections`: `Map<doctorId, targetId>`.
- `potions`: `Map<witchId, { heal, poisonTargetId }>`, where an entry means the Witch acted.
- `suspicions`: `Map<memberId, targetId>`.

Match-level state that lives across nights:
- `visionsBySeer`: the history shown to the Seer or Drunk.
- `blockedPatient`: per doctor, the patient protected the previous night.
- `spentPotions`: per witch, heal and poison.
- `dawn: DawnReport | null`.

Pure functions in `domain/`:
- `packVictimOf(huntPicks)`: the most picks wins; on a tie, the latest pick among the tied players.
- `resolveDawn(night, seats, spent)` returns `{ deaths, healUsed, poisonUsed, nextBlocked }` per spec step 1 to 4.
- `deathsPreview` reuses `resolveDawn`, so the narrator's preview and the real dawn can never disagree.

`Match.act(actorId, input, random)` validates the action in this order:
1. `match-over`
2. `not-night`
3. the actor is a player (the narrator gets `not-your-action`)
4. `player-dead`
5. `not-your-action`
6. `target-invalid`
7. the action-specific errors

The Drunk's result is `random.next() < 0.5`. A real Seer's result is `ROLE_CATALOG[target.role].team === 'wolves'`.

`Match.advance`:
- leaving night for dawn applies `resolveDawn`: deaths, spent potions, blocked patients, then the pending-winner check;
- entering night clears `dawn` and starts a fresh `Night`.

### Views
`matchViews.ts` builds the new fields:
- **Players:**
  - `you.night` is filled only while the phase is night and the seat is alive.
  - Wolves get `packPicks` keyed by wolf id and `packVictimId`.
  - The Witch gets `victimId` = `packVictimOf`, `healAvailable` and `poisonAvailable`.
  - The Doctor gets `blockedTargetId`.
  - The Seer or Drunk gets tonight's `vision`.
  - `you.visions` holds the past visions for inspectors; it is empty for everyone else.
- **Narrator:**
  - `night` is filled during the night.
  - It has one `actions` entry per living player.
  - `waitingOn` lists living players who have not acted, in seat order.
  - `preview` comes from `resolveDawn`.

### Application and socket
- One new use case, `ActAtNight`, built on the existing `changeMatchAs` helper, taking `RandomSource`.
- `registerMatchHandlers` maps `match:act` to it using `answer`.
- Payload shape is validated in the domain from `unknown`, like `RoomSettings` does: a malformed input returns
  `target-invalid` or `not-your-action`, never a throw.

### Web
- `features/match/domain/night.ts` holds pure helpers:
  - `targetsFor(view, seats)`: the selectable seats per action, with a disabled reason (`self`, `dead`, `wolf`,
    `last-night`).
  - `packAgreement(packPicks)`: the unanimous target or null.
  - `deathsAnnouncement(view)`.
- `useMatchStore` gains `act(input)`, with failures kept like the other commands.
- New components in `features/match/infrastructure/components`:
  - `NightDock` chooses one of `HuntDock`, `InspectDock`, `ProtectDock`, `PotionsDock` and `SuspectDock`. Markup and
    classes come from the canvas `NightWolf`, `NightSeer`, `NightDoctor`, `NightWitch` and `NightDecoy` (`.dock`,
    `.picker`, `.pick`, `.why`, `.result`, `.chk`, `.mini`).
  - `DawnAnnouncement` (canvas `Dawn` and `DawnNobody`: tombstone with `a-drop`, the role flip when it is revealed, the
    rooster for "Nobody died tonight!").
- `PlayerTable` places the dock under the village. It shows `DawnAnnouncement` while the `dawn` report is set and the
  phase is dawn.
- `NarratorDashboard`:
  - Each player row shows that player's action line.
  - A "What happens at dawn" panel renders `preview` and `waitingOn`, copying the canvas `NarratorDashboard` centre
    column.
- All copy is in en and es.

## Risks / Trade-offs

- [Hunt tie-breaks feel arbitrary] → the "Pack agrees on X" / "Pack is split" copy tells wolves to agree before dawn.
- [The Witch heals when there is no victim] → `heal: true` is accepted with no victim, but has no effect and spends
  nothing.
- [View size grows] → still small: one object per seat, sent only on changes.
