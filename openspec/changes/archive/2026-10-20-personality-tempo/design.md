## Context

`botTurns.ts` hard-codes `OPENING_ODDS`, `TALKATIVE`, `DAWN_REACTION_ODDS` and one 3 to 10 second dawn delay for every
bot, and staggers openings by seat order. `speak` builds the prompt and awaits the model as soon as its timer fires,
so bots that fire together never see each other's lines. `AddBot` draws a personality uniformly. No screens change.

## Decisions

- **`domain/tempo.ts`.** `PERSONALITY_TEMPO: Record<BotPersonality, { opening, dawn, explainVote, delay: [min, max] }>`
  with the numbers from the spec, `FLOOR_GAP_SECONDS = [4, 8]` and `DAWN_REACTION_CAP = 2`. `botTurns` reads its odds
  and delays from here; seat-order staggering goes away because turn-taking spaces the lines.
- **`domain/ChatFloor.ts`.** A per-table value with `isBusy(channel)`, `hold(channel)`, `release(channel)`, and a dawn
  counter `dawnReactionsIn(round)` / `countDawnReaction(round)`. `BotTable.reset` makes a new floor.
- **Turn-taking in `speak`.** `speak` gains `skipsQueue` (true only for answers to a human). For village and wolf
  lines, when the floor is busy the bot reschedules itself after a floor gap and tries again; the usual phase check
  drops it when the phase ends. Holding the floor covers the budget check, the model call and the post. After a
  posted line the floor is released one floor gap later through the scheduler; when nothing was posted it is
  released at once. The prompt is built while the floor is held, so it reads every earlier bot line. Ghost lines do
  not queue.
- **Dawn cap.** The dawn reaction checks the cap and, for a `follower`, that another bot already reacted, when its turn
  comes, then counts itself after it posts.
- **Voices and rules.** The Spanish shared rule drops "(parce, uy, qué boleta)". The `chaos` voice gains "parce" and
  "qué boleta", the `paranoid` voice "¡uy!", and `detective` and `quiet` say "sin muletillas". Both rule sets add: do not start with the first word of
  the last RECENT CHAT line.
- **Seconding wolf.** The `wolf-plan` intent gains `seconding: string | null`, the packmate who already picked the
  same victim. The intent line asks to agree in new words with a new reason.
- **Surprise pick.** `room/domain/botPersonality.ts` exports `surprisePersonalityOf(existing, roll)`: weight is
  `BASE[personality] * 0.25 ** count`, `BASE` 1 except `quiet` 0.6, and `roll` in [0, 1) walks the cumulative weights.
  `AddBot` resolves the personality inside `changeRoomAs`, from `room.bots`.

## Risks / Trade-offs

- A slow model holds the floor up to 12 seconds, so the next bot waits. That is the point: it reads the line first.
- Fewer bots react at dawn. The day opening and replies still keep the chat alive.
