## MODIFIED Requirements

### Requirement: Adding and removing bots
While the room is in the lobby, the narrator SHALL be able to add a bot with an optional personality and difficulty,
and to remove a bot.
- When no personality is given ("Surprise me"), the system SHALL pick one at random, weighted so the table gets a
  mix: each personality's weight is cut to a quarter for every bot of that personality already in the room, and
  `quiet` starts at 0.6 of the others' weight. When no difficulty is given, it SHALL be Normal.
- The personalities are `paranoid`, `follower`, `detective`, `chaos` and `quiet`. The difficulties are `easy`,
  `normal` and `sharp`.
- Each room SHALL draw one classic book when its first bot is added: One Hundred Years of Solitude, The Three
  Musketeers, Don Quixote, Alice in Wonderland, The Odyssey or The Wizard of Oz. Every bot in that room SHALL take the
  first free character name from that book, in the room's bot language, plus a free avatar. Once every bot is removed,
  the next bot draws a book again.
- A new bot SHALL be ready and connected.
- A room SHALL hold at most 10 bots, and adding a bot to a full room is rejected with `room-full`. Adding an 11th
  bot SHALL be rejected with `bot-limit`.
- Only the narrator SHALL add or remove bots; anyone else gets `not-narrator`. Outside the lobby the system SHALL
  reject it with `game-already-started`.
- Removing a member who is not a bot SHALL be rejected with `not-a-bot`.

#### Scenario: Filling the table
- **WHEN** a lobby has 3 players and the narrator adds 3 bots
- **THEN** every member sees 6 players, the 3 bots ready, connected and labeled as bots

#### Scenario: One book per room
- **WHEN** the narrator adds three bots to a room whose bots speak English and the room drew Alice in Wonderland
- **THEN** the bots are called Alice, Mad Hatter and March Hare

#### Scenario: A human took the name
- **WHEN** Aureliano, a human, is in a room that drew One Hundred Years of Solitude and the narrator adds a bot
- **THEN** the bot is called José Arcadio

#### Scenario: Picked personality
- **WHEN** the narrator adds a bot with the `detective` personality and `sharp` difficulty
- **THEN** that bot plays as a sharp detective

#### Scenario: Surprise me spreads the table
- **WHEN** the room already holds a `paranoid` bot and the narrator adds a bot with no personality
- **THEN** each of `follower`, `detective` and `chaos` is four times as likely as `paranoid`

#### Scenario: Too many bots
- **WHEN** the room already holds 10 bots and the narrator adds another
- **THEN** the system rejects it with error `bot-limit`

#### Scenario: A player tries to add a bot
- **WHEN** a player who is not the narrator adds a bot
- **THEN** the system rejects it with error `not-narrator`

#### Scenario: Removing a human as a bot
- **WHEN** the narrator removes Caro, a human, as a bot
- **THEN** the system rejects it with error `not-a-bot`

### Requirement: Chat budget
Bots SHALL talk enough to give the humans someone to suspect, without flooding the chat:
- Each personality has its own tempo: how often it opens the day, reacts at dawn and explains its vote, and how long
  it waits before writing:

  | Personality | Opens the day | Reacts at dawn | Explains its vote | Waits before writing |
  |---|---|---|---|---|
  | `paranoid` | 90% | 60% | 60% | 2 to 6 seconds |
  | `chaos` | 80% | 50% | 50% | 4 to 12 seconds |
  | `detective` | 80% | 15% | 50% | 12 to 25 seconds |
  | `follower` | 30% | 50%, only after another bot reacted | 20% | 8 to 20 seconds |
  | `quiet` | 25% | 5% | 10% | 20 to 40 seconds |

- A living bot MAY open the day with one line.
- Bots SHALL take turns: in the village chat and the wolf chat only one bot writes at a time, and the next bot line
  comes 4 to 8 seconds after the previous one was posted. A bot writes its line when its turn comes, so it reads
  the bot lines before it. An answer to a human who named it does not wait for its turn.
- At most 2 bots SHALL react to the same dawn.
- It SHALL answer when a human names it in the village chat.
- It MAY answer when another bot accuses it by name in the village chat, more often when it is `paranoid` or
  `chaos` and rarely when it is `quiet`.
- It MAY explain its vote in one line.
- It MAY react once at dawn when the news concerns it.
- A bot SHALL write at most 4 village lines per day and at most 2 wolf-chat lines per night.
- Bots together SHALL write no more than 6 of the last 10 village messages of the current day. A new day starts with
  an empty count. Answers to a human who named the bot are exempt, so a question always gets an answer.
- A dead bot MAY write one line in the ghost chat and use its haunt once.
- A bot in a last-words window SHALL write one last line.

#### Scenario: Named in the chat
- **WHEN** Ana writes "Moco-Bot, where were you last night?" in the village chat
- **THEN** the bot named Moco-Bot answers in the village chat within a few seconds

#### Scenario: One at a time
- **WHEN** three bots decide to react to the same dawn within a second of each other
- **THEN** their lines arrive at least 4 seconds apart, and each later bot's prompt holds the earlier lines

#### Scenario: Two reactions per dawn
- **WHEN** a death is announced at dawn and every bot at the table is `paranoid`
- **THEN** at most 2 bots react to that dawn

#### Scenario: Followers follow
- **WHEN** a death is announced at dawn and no other bot reacted
- **THEN** a `follower` bot does not react

#### Scenario: Fast and slow
- **WHEN** the day opens
- **THEN** a `paranoid` bot waits 2 to 6 seconds before its opening line and a `quiet` bot waits 20 to 40 seconds

#### Scenario: No flood
- **WHEN** a day lasts long enough for many lines
- **THEN** no bot writes more than 4 village lines that day

#### Scenario: Bots share the chat
- **WHEN** bots wrote 6 of the last 10 village messages today
- **THEN** no bot writes another village line until human lines bring the bots under 6 of the last 10, except to
  answer a human who named it

#### Scenario: A new day, a fresh share
- **WHEN** bots filled their share of the village chat yesterday and no human wrote since
- **THEN** bots may open today's chat again

#### Scenario: Bots argue
- **WHEN** a bot accuses Moco-Bot by name in the village chat and Moco-Bot is a `paranoid` bot with lines left
- **THEN** Moco-Bot answers in the village chat within a few seconds

### Requirement: Bot speech
A bot's chat line SHALL be phrased in the room's bot language and in its personality's voice. Slang and catchphrases belong to the voice, not to every bot: in Spanish only a
`chaos` bot says "parce" or "qué boleta", only a `paranoid` bot cries "¡uy!", and a `detective` or `quiet` bot uses
no filler words. The model SHALL be told not to start its line with the same word as the last chat line. It SHALL say what its
brain decided: an accusation, a defense, a claim, a reaction, an answer or a wolf pick with its reason, which can be a
lie when the bot is a wolf or the Fool. The line SHALL mention only real player names and facts the bot knows,
including the roles players claimed in the chat, and SHALL stay party-safe. Its humor SHALL be teasing and bluffing,
not gross-out jokes about slime, snot, drool, warts or vomit. The model SHALL think with medium reasoning effort
unless the server is configured with another effort, and SHALL get 12 seconds to answer. When no language model is
configured, the model fails or times out, or the room has used its 150 model calls for the game, the bot SHALL use a
scripted line for the same intent. When a wolf picks the same victim its packmate already picked, it SHALL be told to agree in its own words with a
new reason. A room SHALL not repeat a scripted line for an intent until it has used every line
for that intent. The model SHALL be told not to copy lines from the chat it reads.

#### Scenario: No model configured
- **WHEN** the server runs without an OpenRouter key and a bot has to speak
- **THEN** the bot writes a scripted line in the room's bot language

#### Scenario: Thinking before speaking
- **WHEN** the server runs with an OpenRouter key and no reasoning effort configured, and a bot has to speak
- **THEN** the model is asked for medium reasoning effort, and a configured effort replaces it

#### Scenario: The wolf says why
- **WHEN** a bot Werewolf picks Luis because Luis claimed the Seer
- **THEN** its wolf-chat intent tells the model it picked Luis because Luis claimed the Seer

#### Scenario: Claimed roles are facts
- **WHEN** Luis wrote "I am the Seer" in the village chat and a bot speaks
- **THEN** the bot's prompt facts say Luis claimed the Seer

#### Scenario: Slang by voice
- **WHEN** a room's bots speak Spanish
- **THEN** only the `chaos` voice holds "parce" and "qué boleta", only the `paranoid` voice holds "uy", and the shared
  rules hold neither

#### Scenario: Wolves agree in new words
- **WHEN** a bot Werewolf picks Ana after its packmate Tato already picked Ana
- **THEN** its intent tells the model that Tato also picked Ana and to agree with a new reason, not Tato's words

#### Scenario: No echo
- **WHEN** two bot wolves announce their pick in the same night with scripted lines
- **THEN** they use two different lines

#### Scenario: No gross-out talk
- **WHEN** a bot speaks with any personality, in either language, from the model or a scripted line
- **THEN** its voice, its examples and its scripted lines hold no slime, snot, drool, wart or vomit jokes, and the
  model is told to skip them

#### Scenario: A bad answer from the model
- **WHEN** the model answers with something that is not the expected JSON
- **THEN** the bot writes a scripted line for the same intent
