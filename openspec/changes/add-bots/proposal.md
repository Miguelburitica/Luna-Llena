## Why

Small groups of 3 to 5 friends can't reach the 6-player minimum, so they can't play at all. Bots that fill the empty
seats let them play now. The bots have to keep the game interesting: they play their role, vote, and give the humans
on the voice call someone to accuse and interrogate in the chat. They must stay fair, labeled, and quiet enough that
the humans remain the stars.

## What Changes

- **Lobby:** the narrator can add and remove bots. A bot is a labeled player named after a character from the room's classic book, with a free avatar, a
  personality and a difficulty. Bots are always ready and connected and count as players.
- **Bot language:** a new room setting picks whether bots speak Spanish or English.
- **Fair play:**
  - A bot learns only what a human in its seat would see: its own game view and the chat channels it may read.
  - It acts only through the normal game commands, so every rule applies to it.
  - The narrator still advances every phase.
- **Bot play:** a deterministic brain keeps a suspicion score for each player, shaped by votes, deaths, chat,
  visions, the pack and the bot's personality. From those scores it decides:
  - night actions;
  - votes and when to lock them;
  - Hunter revenge;
  - haunts;
  - what each chat line should say.
- **Pacing:** bots act after human-like delays, always before the phase timer runs out.
- **Bot talk:** an LLM on OpenRouter (`glm-5.3-flash` by default) phrases each chat line from the intent the brain
  chose and the facts the bot knows. A chat budget keeps bots from flooding the chat. Bots answer when a human names
  them in the chat. Scripted lines take over when there is no API key, the model fails, or the room hits its call cap.
- **Web:**
  - an "Add a bot" panel in the narrator lobby;
  - a sticker BOT tag on bot avatars and bot chat bubbles;
  - the bot language setting.

## Capabilities

### New Capabilities
- `bots`: adding bots, their labels and personalities, fair information, how they act and vote, pacing, chat budget,
  mentions, speech, fallback and cost cap.

### Modified Capabilities
- `room-lobby`: members can be bots, settings gain the bot language, and start readiness treats bots as ready and
  connected.
- `chat`: messages written by bots are labeled as bots.

## Impact

- **Contracts:**
  - `MemberView.isBot`;
  - bot vocabulary: `BOT_PERSONALITIES`, `BOT_DIFFICULTIES`, `BOT_CAST_IDS`, `BOT_CASTS`, `BOT_LANGUAGES`, `BOT_LIMITS`;
  - `RoomSnapshot.botCast`;
  - `RoomSettings.botLanguage`;
  - events `room:addBot` and `room:removeBot`;
  - error codes `bot-limit` and `not-a-bot`.
- **Server:**
  - `features/room`: bot members, the `AddBot` and `RemoveBot` use cases, and the bot language setting;
  - a new `features/bots` feature with domain, application and infrastructure layers;
  - `shared/infrastructure/startServer.ts` wiring and bot-aware publishers.
- **Web:**
  - `features/room`: the narrator lobby bot panel, the store actions `addBot` and `removeBot`, and the bot language
    control;
  - `shared/infrastructure/ui`: the `LunaAvatar` bot tag and the `.bot-tag` style;
  - `features/chat`: bot bubbles.
- **Environment:** `OPENROUTER_API_KEY` (optional) and `OPENROUTER_MODEL`.

## Non-goals

- An automatic narrator or solo mode. A human narrator is still required.
- Bots speaking on the voice call, or hearing it.
- Hidden bots that pass as humans.
- Persisting bot memory across server restarts.
