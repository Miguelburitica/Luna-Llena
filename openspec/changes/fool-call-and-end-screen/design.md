## Context

`Match.executeVerdict` is the only place that records a solo winner, and only when the vote executes the Fool.
`Match.setAlive` buries the Fool like anyone else. The narrator dashboard shows a Fool's win only as a badge on the
verdict panel, and `beginNight` clears the verdict. `soloWinnerIds` is already in every view, and `isRevealed` already
reveals a solo winner's role, so recording the win is enough for the players' side.

The end screen is `GameOverView` with `EndStory` and `EndAwards`, built on `design/canvas/EndGame.dc.html`. The
dashboard follows `design/canvas/NarratorDashboard.dc.html`; the Fool's colours and copy follow
`design/canvas/FoolWins.dc.html`.

## Goals / Non-Goals

**Goals:**
- The narrator can call the Fool's win whenever the narrator's own hand killed the Fool.
- The rule stays in `packages/rules`, so the server stays authoritative and the dashboard only renders an offer.
- An end screen that reads well from 360px phones to desktop, in the day scene (village, solo) and the night scene
  (wolves).

**Non-Goals:**
- A solo win ending the game.
- New timeline entry kinds. The narrator's kill is already in the timeline, and solo winners are already on the end
  screen.

## Decisions

- **Domain model.** `Match` keeps `handKilledFools: Set<string>`. `setAlive(false)` on a living Fool adds them after the
  burial; `bury` removes every fallen seat first, so a later death by another cause (after a revive) clears the claim;
  `setAlive(true)` removes them. `foolClaimIds` returns the dead Fools in the set who are not solo winners yet, in seat
  order. `declareFoolWin(actorId, memberId)` requires the running narrator (`not-narrator`, `match-over`), then
  `no-fool-win` unless the member is in `foolClaimIds`, then pushes the solo winner. Alternative considered: letting
  the narrator crown any dead Fool. Rejected because the spec says a Fool killed at night does not win.
- **View.** `NarratorMatchView.foolClaimIds: readonly string[]` from `narratorViewOf`. Players get nothing new.
- **Use case.** `DeclareFoolWin.execute(actor, input: { memberId?: unknown })` through `changeMatchAs`, like
  `SetAlive`.
- **Socket event.** `match:declareFoolWin` with `{ memberId: string }`, acked with `MatchAck<void>`, wrapped with
  `answer` in `registerMatchHandlers`.
- **Web.** `MatchGateway.declareFoolWin(memberId)`, `useMatchStore().declareFoolWin(memberId)`. The dashboard shows a
  `team-solo` strip under the winner bar whenever there is a claim or a solo winner: each solo winner as an `sbadge`
  with avatar, each claim with a "The Fool wins" button.
- **End screen layout.** `GameOverView` keeps the `phone` scene classes for the theme, but spans the window, with the
  content at most 1080px wide. On wide screens the hero repeats its scene along the width, and the title and flavor
  line carry a halo in the sky colour so the scenery never hides them. The sections sit in a CSS grid: one column on phones; from 900px the hero, twist, summary and roles span both columns and
  the story and awards sit side by side. Roles are grouped by team with a `tbadge` heading and `pick`-style tiles.
  `domain/endGame.ts` gains `gameSummaryOf(view)` (players, survivors, and days as the round the game ended in) and
  `rolesByTeam(rows)` (wolves, village, solo, empty groups left out). Both are pure and tested in `endGame.test.ts`.

## Risks / Trade-offs

- [The narrator kills the Fool by mistake and calls the win] → the narrator is the referee; a revive before calling
  removes the offer. A called win cannot be undone, the same as a vote.
- [A Fool killed by hand at night, standing in for the wolves] → the narrator is offered the win but is free not to
  call it. Telling the two apart would need the narrator to say why, which is more UI for a rare case.
