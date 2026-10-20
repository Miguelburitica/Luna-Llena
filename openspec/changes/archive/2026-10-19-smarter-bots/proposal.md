## Why

In playtests the bots went quiet in the day chat, and bot wolves kept attacking the same kind of player night after
night. Three causes:

- **The bot share of the chat never resets.** Bots may write at most 4 of the last 10 village messages, but the window
  spans the whole game and only moves when a message arrives. Humans mostly talk over the voice call, so after the
  first 4 bot lines of the game the window stays full and every bot line except a direct answer is dropped for the
  rest of the game.
- **Bots only answer humans.** A bot accused by another bot never replies, so once the opening lines are out the day
  chat dies unless a human types a bot's name.
- **Wolf picks are a coin flip.** A bot wolf picks a role claimer 70% of the time and anyone at random otherwise. It
  ignores who accuses the pack, who the village already suspects (a useful scapegoat), and whether last night's
  attack failed. The model only phrases lines; it never chooses the victim.

The bots call `openai/gpt-6-luna` through OpenRouter with reasoning effort `none`. Measured on that model, `medium`
answers in about 3 seconds with roughly 150 reasoning tokens, well inside the 12 second speech budget.

## What Changes

- **Chat budget:** the bot share window covers only the current day, and bots may write up to 6 of the last 10
  village messages of the day (was 4 of 10 for the whole game).
- **Bot replies:** a living bot named in an accusation by another bot MAY answer it, by personality. These answers
  count against the bot share; only answers to humans are exempt.
- **Wolf picks:** a bot wolf ranks its prey: a claimed Seer first, then other claimed powers, then whoever accused it
  or its pack. It spares the village's favourite suspect, avoids a claimed Hunter, and avoids the player who survived
  last night's attack. Personality and difficulty add noise. The pack agreement and first-night rules stay.
- **Wolf chat:** the wolf's line says why it picked its victim.
- **Prompt facts:** every bot's prompt lists the roles players claimed; a wolf's prompt also names the player who
  survived last night's attack.
- **Model effort:** bot speech asks the model for `medium` reasoning effort by default, configurable with
  `OPENROUTER_REASONING_EFFORT`. The 12 second budget and the scripted fallback stay.

## Capabilities

### Modified Capabilities
- `bots`: night play (wolf ranking), chat budget (per-day share, bot replies) and bot speech (reasoning effort, wolf
  reasons, claimed roles).

## Impact

- Server, `features/bots`:
  - `domain/hunting.ts` (new): prey ranking and the reason for a pick;
  - `domain/decisions.ts`: hunts use the ranking;
  - `domain/BotMind.ts`, `domain/suspicion.ts`: remember threats to the pack and the survivor of the last attack;
  - `domain/ChatBudget.ts`: per-day share window;
  - `domain/intents.ts`, `domain/botPrompt.ts`: wolf reasons and claimed-role facts;
  - `application/ObserveChatMessage.ts`, `application/botTurns.ts`: bot-to-bot replies;
  - `infrastructure/OpenRouterBotSpeech.ts` and `src/main.ts`: reasoning effort.
- Web: none. Contracts: none.

## Non-goals

- Letting the model choose night targets or votes. Decisions stay deterministic, testable and fair.
- Changing the per-bot cap of 4 village lines per day or 2 wolf lines per night.
- Changing the 12 second speech timeout or the 150 call budget per game.
