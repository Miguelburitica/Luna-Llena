## Context

These are fixes found in live playtests. The contract is written and frozen:
- `HauntRecord` (`round`, `ghostId`, `haunt`, `targetId`, `word`) in `packages/contracts/src/match/ghosts.ts`;
- `NarratorMatchView.haunts: HauntRecord[]`;
- the timeline `haunt` entry is now `{ kind: 'haunt' } & HauntRecord`, which has the same shape as before.

## Decisions

### Seats clear of the sky
The scene art is 390×340.
- **Moon (night):** drawn at (300, 78) with r 44 and a glow of r 64, which is about x 61–93% and y 4–42%.
- **Sun (day):** drawn at (86, 70) with r 34, which is about x 13–31% and y 11–31%.
- **Dawn sun:** rises behind the village at the bottom centre, around the hearth, which is fine.

`seatPositions(count)` moves its ellipse:
- centre from (50%, 50%) to (50%, 64%);
- radii from (38%, 36%) to (40%, 22%).

The top seat then sits at 42% and the upper-right seats at about 45%, below the moon's disc. The constants stay named
in `phases.ts` (`SEAT_CENTER_X`, `SEAT_CENTER_Y`, `SEAT_RADIUS_X`, `SEAT_RADIUS_Y`). The existing `seatPositions` tests
are updated to the new numbers, plus a test that every position has `top ≥ 40`.

### Readable names
`.av-name` inside `.table-seat` gets a pill:
- `background: var(--surface)`
- `padding: 2px 8px`
- `border-radius: 99px`
- `box-shadow: inset 0 0 0 1px var(--line)`
- `color: var(--ink)`

A dead player's name keeps the strike-through but uses `color: var(--ink)` with `opacity: .8` on the pill, instead of
`--muted` on the bare scene. These are scoped styles in `PlayerTable`; `design-system.css` stays as it is.

### Wolves open the den
Chat `domain/channels.ts` `defaultTab(access, phase)` returns:
- `wolves` when `access.write` includes `wolves` (a living wolf at night);
- `ghosts` for the dead;
- `village` otherwise.

The store applies it when the sheet opens, unless the player chose a tab in this game. `requestedTab` already exists
for that.

### Stepper rounds
`NarratorDashboard` labels every phase step `"<Phase> <round>"`, using the existing i18n phase names and `view.round`.
A pure helper `stepperOf(view)` in match `domain/phases.ts` returns `{ phase, label key, round, state: done | now |
next }[]`, with tests.

### Haunt history for the narrator
- **Server:** `matchViews` fills the narrator's `haunts` from the match state. That is the `haunt` timeline entries
  projected to `HauntRecord`, in order. Players' views never carry it, and the timeline itself stays hidden until the
  end.
- **Web:** `NarratorHauntFeed` renders `view.haunts`. The live `hauntEffects` only trigger the toast, and only for
  effects received after mount. A reload shows the list and no toast.

## Risks / Trade-offs

- [Seats get tighter vertically with 12+ players] → the existing dense mode (`av-md`) still applies. The vertical
  radius stays at 22% even when dense.
