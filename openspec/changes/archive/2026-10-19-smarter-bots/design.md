## Context

The bots feature (`apps/server/src/features/bots`) decides everything in pure domain code and only asks the model to
phrase an intent. `ChatBudget` caps the bot share of the village chat with a 10-message window that lives for the
whole game. `ObserveChatMessage` plans an answer only when a human names the bot. `huntTargetOf` picks a claimer with
70% odds and anyone at random otherwise. `OpenRouterBotSpeech` sends `reasoning: { effort: 'none' }`.

No screens change. No socket events, contracts or web code change.

## Goals / Non-Goals

**Goals:**
- Day chat that keeps going after the opening lines, without drowning the humans.
- Wolf picks that look reasoned and vary when an attack fails.
- A smarter phrasing model, still inside the 12 second budget.

**Non-Goals:**
- Model-chosen targets or votes. They would be slow, costly, hard to test and harder to keep fair.

## Decisions

- **Per-day share window.** `ChatBudget` remembers the round of its window. The first village `allows` or `reserve`
  of a new round clears it. `BOT_CHAT_LIMITS.botLinesInWindow` becomes 6. Humans mostly speak over the voice call, so
  a 40% share starved the chat; 60% still leaves room for every human line.
- **Bot replies.** `ObserveChatMessage` also plans an answer when the author is another bot, the text names the bot
  and reads as an accusation (`accuses` exported from `suspicion.ts`), and the roll is under `BOT_REPLY_ODDS` for its
  personality (paranoid 0.7, chaos 0.6, detective 0.5, follower 0.3, quiet 0.2). `planAnswer` takes `exempt`, true only
  for human askers, and passes it to `speak`, which hands it to `ChatBudget.allows`. Ping-pong ends when the per-bot
  and share caps run out.
- **Prey ranking (`domain/hunting.ts`).** `bestPreyOf(mind, view, prey, random)` scores every candidate:
  - claimed Seer +3, Doctor +2.5, Witch +2, Hunter -1;
  - +1 for each accusation of the bot or its pack, up to +3 (`mind.threats`);
  - -0.5 for each village accusation today, down to -2 (`mind.accusedToday`);
  - -2 when the candidate survived the pack's attack last night (`mind.survivors`);
  - plus `random * (0.3 + 4 * noiseOf(mind))`.
  The best score wins, ties broken at random. `huntReasonOf(mind, targetId)` returns the strongest positive
  reason without noise: `claimed-seer`, `claimed-role`, `accused-pack` or `null`. A failed attack lowers the target
  even though the Doctor may not guard the same player twice: the Witch's heal and a second guard are unknown to the
  wolves, and players read a repeat attack as a bot that cannot think.
- **Memory on `BotMind`.** `threats: Map<id, count>` grows in `observeChat` when a wolf reads an accusation naming
  itself or a packmate. `attack: { round, targetId } | null` is set from the night view's `packVictimId`. At dawn, if
  the dawn round matches and the target is alive, `survivors.set(targetId, round)`.
- **Wolf-plan intent.** It gains `reason: HuntReason | null`. `wolfPlanIntentOf` takes the mind and computes it. The
  intent line appends the reason in both languages. Scripted lines ignore it.
- **Prompt facts.** `factsOf` lists every claim (`Luis claimed Seer`) and, for wolves, the survivor of last night's
  attack.
- **Reasoning effort.** `OpenRouterOptions.reasoningEffort` (type `ReasoningEffort`: `none`, `minimal`, `low`,
  `medium`, `high`) defaults to `medium`. `max_tokens` rises to 1200 so reasoning tokens never truncate the JSON.
  `main.ts` reads `OPENROUTER_REASONING_EFFORT` through `reasoningEffortOf`, which ignores unknown values. Measured on
  `openai/gpt-6-luna`: none about 1.5 s, low about 2 s, medium about 3 s.

## Risks / Trade-offs

- Medium effort costs about 150 more output tokens per line, a fraction of a cent per game at Luna prices.
- A slow model day pushes more lines to the scripted fallback. The fallback already exists and is tested.
