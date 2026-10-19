## MODIFIED Requirements

### Requirement: Chat screens
The web app SHALL show players a chat bar under the game table that opens a chat sheet.

The sheet SHALL have:
- one tab per readable channel, each with an unread count;
- message styles for your own, other players', narrator, last-words, ghost, wolf and bot messages. A bot message
  carries a BOT tag next to its author;
- a composer for the channels you may write in now. Otherwise it shows one of these notes:
  - "The village sleeps — chat opens at dawn";
  - "Chat paused for last words";
  - "Village is read-only".

The sheet SHALL open on the tab the player can write in:
- Wolves, for a living Werewolf at night;
- Ghosts, for a dead player;
- Village, otherwise.

Once the player picks a tab, it stays on that tab.

A player in a last-words window SHALL be prompted with a countdown. Everyone SHALL see last words in a spotlight while
the window is open.

The narrator dashboard SHALL show a chat monitor with All, Village, Wolves and Ghosts tabs and an "As Narrator → All"
composer.

#### Scenario: Night note
- **WHEN** Caro, a Villager, opens the chat during the night
- **THEN** Caro sees "The village sleeps — chat opens at dawn" instead of a composer

#### Scenario: Unread wolves
- **WHEN** Tato writes in the wolves channel while Luis has the village tab open
- **THEN** Luis sees an unread count on the Wolves tab

#### Scenario: Wolves open the den
- **WHEN** Luis, a living Werewolf, opens the chat during the night
- **THEN** the sheet opens on the Wolves tab with a composer

#### Scenario: A bot speaks
- **WHEN** a bot writes in the village chat
- **THEN** every reader sees its message with a BOT tag next to the bot's name
