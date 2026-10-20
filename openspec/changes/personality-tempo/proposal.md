## Why

In playtests every bot spoke at once and sounded alike. At dawn three bots reacted to the same death within seconds,
all starting with "Uy, qué boleta", and two wolves announced the same pick with the same reason. Four causes:

- Every bot rolls the same odds and waits the same 3 to 10 seconds, whatever its personality.
- Lines are written in parallel, so no bot reads the line written just before it.
- The Spanish rules tell every bot to say "parce, uy, qué boleta".
- "Surprise me" picks a personality uniformly, so a table can get three of a kind.

## What Changes

- **Personality tempo:** each personality has its own odds to open the day, react at dawn and explain its vote, and
  its own wait before writing, from a jumpy `paranoid` (2 to 6 seconds) to a `quiet` bot (20 to 40 seconds).
- **Taking turns:** one bot writes at a time per chat, 4 to 8 seconds after the previous bot line, and builds its
  prompt when its turn comes. Answers to a human skip the queue.
- **Dawn cap:** at most 2 bots react to the same dawn; a `follower` reacts only after another bot did.
- **Slang by voice:** Spanish slang moves from the shared rules into the `chaos` and `paranoid` voices. The model is
  told not to start with the same word as the last chat line.
- **Wolves agree in new words:** a wolf joining its packmate's announced pick is told to agree with a new reason.
- **Surprise me:** personalities are weighted by 0.25 to the power of how many bots of that personality are already
  in the room, with `quiet` starting at 0.6.

## Capabilities

### Modified Capabilities
- `bots`: adding bots (weighted surprise), chat budget (tempo, turns, dawn cap) and bot speech (slang, wolf
  agreement).

## Impact

- Server, `features/bots`:
  - `domain/tempo.ts` (new): personality tempos, the floor gap and the dawn cap;
  - `domain/ChatFloor.ts` (new): whose turn it is per chat and the dawn reaction count;
  - `domain/BotTable.ts`: holds the floor;
  - `domain/botPrompt.ts`, `domain/intents.ts`: voices, rules, the seconding wolf;
  - `application/botTurns.ts`: tempo odds and delays, turn-taking, dawn cap.
- Server, `features/room`:
  - `domain/botPersonality.ts` (new): the weighted surprise pick;
  - `application/AddBot.ts`: uses it with the room's current bots.
- Web: none. Contracts: none.

## Non-goals

- Changing per-bot line caps, the bot share of the chat or the model budget.
- Changing scripted lines.
- Changing the web bot panel.
