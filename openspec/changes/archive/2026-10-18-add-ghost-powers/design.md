## Context

This builds on the `match` feature after `add-end-game`. The contracts are written and frozen:
- `packages/contracts/src/match/ghosts.ts`:
  - `HAUNT_KINDS`
  - `GHOST_LIMITS.maxWhisperLength` (20)
  - `HauntInput` (`flicker`, or `whisper` with `targetId` and `word`)
  - `HauntEffect` (`id`, `kind`, `word`, `ghostId`, `targetId`, `sentAt`)
  - `GhostPowerView`
- `PlayerMatchView.you.haunt`.
- New errors: `not-a-ghost`, `haunt-used`, `ghost-powers-off`, `whisper-invalid`.
- Events:
  - client `match:haunt` (`HauntInput`), acknowledged with void;
  - server `match:haunted` (`HauntEffect`).
- A `haunt` timeline entry.

## Goals / Non-Goals

**Goals:** haunts are a match-domain rule with targeted, ephemeral delivery that keeps the ghost anonymous to players.
**Non-Goals:** see proposal.md, Non-goals.

## Decisions

### Domain
- The `ghostPowers` house rule travels room `GameOpening` → `MatchOpening` → `Match`, like `anonymousVotes` and
  `lastWords`.
- `Match` keeps `hauntsUsed: Set<memberId>`.
- `Match.haunt(actorId, input: unknown, now)` returns `Result<HauntOutcome, MatchError>` and validates in this order:
  1. `match-over`
  2. `ghost-powers-off`
  3. the narrator or a living actor gets `not-a-ghost`
  4. `haunt-used`
  5. a malformed input gets `whisper-invalid`
  6. for a whisper, `word` gets `whisper-invalid` when, after trimming, it is empty, longer than 20 characters, or has
     whitespace
  7. `targetId` must be a living player, otherwise `target-invalid`
- On success it marks the haunt used and appends a `haunt` timeline entry. It returns
  `HauntOutcome = { kind, ghostId, targetId | null, word | null }`.
- `you.haunt` is `{ available }` for dead players while ghost powers are on. It is null for the living and when the
  rule is off.

### Application and delivery
- The `Haunt` use case is built on the `changeMatchAs` style: load, haunt, save, publish views (to refresh
  `you.haunt`), then deliver the effect.
- A new port method `MatchPublisher.haunt(code, deliveries: Array<{ memberId, effect }>)`. One `IdGenerator` id is
  shared by the copies of one haunt.
  - **Flicker:** every member receives `{ kind: 'flicker', word: null, ghostId: null, targetId: null }`. The narrator's
    copy has `ghostId` set.
  - **Whisper:** the target receives `{ kind: 'whisper', word, ghostId: null, targetId: <target> }`. The narrator's
    copy has `ghostId` set. Nobody else receives anything.
- `SocketMatchPublisher.haunt` emits `match:haunted` to each `memberChannel`.
- `registerMatchHandlers` handles `match:haunt` with `answer`.

### Web
- `features/match/domain/ghosts.ts`:
  - `whisperProblem(word)` mirrors the word rule so the button can be disabled early. The server stays authoritative.
  - `hauntLine(effect, names)` for the narrator feed.
- `useMatchStore`:
  - `haunt(input)`;
  - `hauntEffects`, a list that the gateway's `onHaunted` feeds;
  - `lastHaunt` for overlays.
- Components:
  - `GhostDock` (canvas `Ghost`, reusing `TargetPicker`, `DockHeader` and `DockError`): shown in `PlayerTable` for dead
    players when `view.you.haunt` is not null, instead of the night or vote dock.
  - `FlickerOverlay`: the `.flicker` class for about 2.4 s on each new flicker. It is replaced by a toast when
    `matchMedia('(prefers-reduced-motion: reduce)')` matches or the `reduced` setting is on, because the global
    reduced-motion rule disables the animation and would leave a black overlay.
  - `WhisperToast` (`.toast.is-ghost`), shown for 4 s.
  - `NarratorHauntFeed`, a list in `NarratorDashboard` that shows a toast for new haunts.
- `EndStory` renders `haunt` timeline entries in the right chapter:
  - "Juan’s ghost flickered the lights."
  - "Juan’s ghost whispered “bakery” to Marta."
- All copy is in en and es.

## Risks / Trade-offs

- [Photosensitivity] → the flicker is short and dim, as in the canvas animation, and reduced motion gets a toast.
- [Whisper abuse] → one word, 20 characters, once per game. The narrator sees every whisper.
