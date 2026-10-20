## MODIFIED Requirements

### Requirement: Night play
During the night every living bot SHALL perform its role's action:
- A Werewolf bot SHALL hunt a living non-wolf. It forms its own pick by ranking its prey: a player who claimed the
  Seer ranks highest, then a player who claimed another power role, then a player who accused the bot or its pack in
  the village chat. It ranks lower the player the village accused most (a useful scapegoat), a player who claimed the
  Hunter, and the player who survived the pack's attack last night. Its personality and difficulty add noise to the
  ranking, so an `easy` bot often picks loosely and a `sharp` bot rarely does.
- When the pack already picked someone, a Werewolf bot joins that pick only by its personality's agreeableness: a
  `follower` almost always, a `chaos` bot rarely. Late in the night, a wolf that still disagrees MAY give in to the
  pack's pick. The pack's rule (most picks, then the latest pick) settles any split that remains. On the first night
  it prefers bots as victims, so the humans get to play.
- A Seer or Drunk bot SHALL inspect the living player it has no vision of and suspects most.
- A Doctor bot SHALL protect a player other than the one it may not protect, preferring a player who claimed a role.
- A Witch bot SHALL heal the pack's victim on the first night, or when the victim claimed a role, if the heal is left.
  It SHALL poison only a player it strongly suspects, if the poison is left. Otherwise it does nothing. When the pack
  picks a victim after the Witch bot acted, it SHALL reconsider before dawn.
- Other bots SHALL suspect the living player they suspect most.

#### Scenario: The pack agrees
- **WHEN** a human Werewolf picks Ana as the victim and an agreeable `follower` bot Werewolf acts afterwards
- **THEN** the bot usually also picks Ana

#### Scenario: Wolves argue
- **WHEN** a `chaos` bot Werewolf acts after its packmate picked Ana
- **THEN** it usually picks a victim of its own, and both picks show in the pack's view

#### Scenario: Giving in
- **WHEN** a bot Werewolf still disagrees with its packmate late in the night
- **THEN** it may switch to the packmate's pick before dawn

#### Scenario: Hunting the Seer
- **WHEN** Luis claimed the Seer and Caro claimed the Doctor in the village chat, and a `sharp` bot Werewolf hunts
- **THEN** it picks Luis

#### Scenario: Silencing an accuser
- **WHEN** Caro accused the bot Werewolf's packmate in the village chat, nobody claimed a role, and a `sharp` bot
  Werewolf hunts
- **THEN** it picks Caro

#### Scenario: Keeping the scapegoat
- **WHEN** the village accused Pipe more than anyone today and a `sharp` bot Werewolf hunts
- **THEN** it picks someone other than Pipe

#### Scenario: A failed attack
- **WHEN** the pack attacked Luis last night, Luis is still alive at dawn and Luis claimed the Seer
- **THEN** the next night a `sharp` bot Werewolf ranks another claimed player above Luis

#### Scenario: The witch reconsiders
- **WHEN** a bot Witch acted on Night 1 before the wolves picked, and the wolves then pick Ana
- **THEN** the bot Witch heals Ana before dawn

#### Scenario: Humans get to play
- **WHEN** the first night begins and only bots are Werewolves
- **THEN** the bot Werewolves pick a bot as their victim

#### Scenario: A seer bot inspects
- **WHEN** a bot Seer has already seen Luis
- **THEN** it inspects a living player other than itself and Luis

### Requirement: Chat budget
Bots SHALL talk enough to give the humans someone to suspect, without flooding the chat:
- A living bot MAY open the day with one line. Opening lines are staggered so they don't arrive at once.
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
A bot's chat line SHALL be phrased in the room's bot language and in its personality's voice. It SHALL say what its
brain decided: an accusation, a defense, a claim, a reaction, an answer or a wolf pick with its reason, which can be a
lie when the bot is a wolf or the Fool. The line SHALL mention only real player names and facts the bot knows,
including the roles players claimed in the chat, and SHALL stay party-safe. Its humor SHALL be teasing and bluffing,
not gross-out jokes about slime, snot, drool, warts or vomit. The model SHALL think with medium reasoning effort
unless the server is configured with another effort, and SHALL get 12 seconds to answer. When no language model is
configured, the model fails or times out, or the room has used its 150 model calls for the game, the bot SHALL use a
scripted line for the same intent. A room SHALL not repeat a scripted line for an intent until it has used every line
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
