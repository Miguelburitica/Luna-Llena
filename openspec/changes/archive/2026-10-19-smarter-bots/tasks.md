## 1. Server domain

- [x] 1.1 Give `ChatBudget` a per-day share window of 6 of the last 10 village messages; tests "Bots share the chat" and "A new day, a fresh share" in `domain/bots.test.ts`
- [x] 1.2 Remember threats to the pack, the last attack and its survivor on `BotMind` from `observeChat` and `observeView`; export `accuses`
- [x] 1.3 Add `domain/hunting.ts` with `bestPreyOf` and `huntReasonOf`, and hunt with it in `decisions.ts`; tests "Hunting the Seer", "Silencing an accuser", "Keeping the scapegoat" and "A failed attack"
- [x] 1.4 Add the reason to the wolf-plan intent and the claimed roles and the survivor to the prompt facts; tests "The wolf says why" and "Claimed roles are facts"

## 2. Server application

- [x] 2.1 Plan bot-to-bot answers by personality in `ObserveChatMessage`, not exempt from the share; test "Bots argue" in `application/bots.test.ts`

## 3. Server infrastructure

- [x] 3.1 Send the configured reasoning effort, medium by default, from `OpenRouterBotSpeech` and read `OPENROUTER_REASONING_EFFORT` in `main.ts`; test "Thinking before speaking" in `infrastructure/bots.test.ts`
- [x] 3.2 Keep the ghost whisper words to one word each, as the haunt rule requires; covered by "A full game with bots" in `application/bots.test.ts`, which surfaced the rejected multi-word whispers

## 4. Verification

- [x] 4.1 Run `pnpm check` green
