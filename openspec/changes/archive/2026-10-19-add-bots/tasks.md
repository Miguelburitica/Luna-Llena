## 1. Contracts

- [x] 1.1 Add bot vocabulary (`BOT_PERSONALITIES`, `BOT_DIFFICULTIES`, `BOT_LANGUAGES`, `BOT_NAMES`, `BOT_LIMITS`, `BotProfile`), `MemberView.bot`, `botLanguage` in room settings and defaults, `room:addBot`/`room:removeBot` events and `bot-limit`/`not-a-bot` errors; verify with `tsc`

## 2. Server domain

- [x] 2.1 Room: bot members, `addBot`, `removeBot`, bots kept ready on reopen, `botLanguage` setting; tests "Filling the table", "Too many bots", "A player tries to add a bot", "Removing a human as a bot", "Bots are ready", "Bots never drop", "Bots speak English", "Unknown bot language"
- [x] 2.2 Bots: `BotMind`, suspicion updates, decisions, intents, `ChatBudget`, pacing, `botPrompt`/`parseSpokenLine`, `scriptedLines`; tests "The pack agrees", "A seer bot inspects", "Never against the pack", "Follow the crowd", "The seer trusts its vision", "No flood", "A bad answer from the model" (parser)

## 3. Server application

- [x] 3.1 Room `AddBot`/`RemoveBot` use cases with `createRoomKit` tests, including "Picked personality" and "A bot is labeled"
- [x] 3.2 Bots ports and use cases (`ObserveRoomSnapshot`, `ObserveMatchView`, `ObserveChatMessage`, `ForgetRoom`) with a `createBotKit` running a real match and a fake scheduler; tests "A villager bot does not know the wolves", "A full game with bots", "Before the timer", "Named in the chat", "No model configured"

## 4. Server infrastructure

- [x] 4.1 `OpenRouterBotSpeech` (stubbed fetch test), `NoBotSpeech`, `TimerBotScheduler`, `InMemoryBotTables`, bot-aware publishers, socket handlers `room:addBot`/`room:removeBot`, wiring in `startServer`; socket integration test that bots act at night

## 5. Web

- [x] 5.1 Room store `addBot`/`removeBot`, gateway calls, narrator lobby bot panel (personality and difficulty chips, add, remove) and bot language control; tests in the narrator lobby
- [x] 5.2 `.bot-tag` style, `LunaAvatar` bot tag, bot tag in lobby rows, table seats and chat bubbles; test "A bot speaks" and the lobby label

## 6. Verification

- [x] 6.1 Run `pnpm check` green
- [x] 6.2 Play in the browser with a human and 5–6 bots at phone width without an API key (scripted lines); screenshot the lobby, a night, the narrator dashboard and a day chat where a bot answers a question
- [x] 6.3 Check live `openai/gpt-6-luna` lines in both languages with the real `OPENROUTER_API_KEY`
- [x] 6.4 Drop the gross-out humor from bot voices, prompt examples, scripted lines and ghost whispers; test "No gross-out talk"
