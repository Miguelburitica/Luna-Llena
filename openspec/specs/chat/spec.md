# chat Specification

## Purpose
Chat gives an online game its table talk: a village square, a wolves' den, a ghosts' corner and a narrator's voice,
each open to the right people at the right time, plus the dramatic last words of the fallen.

## Requirements

### Requirement: Channels and readers
A game SHALL have three chat channels. The village is read by every member. The wolves channel is read by Werewolves,
alive or dead, judged by true role. The ghosts channel is read by dead players. The narrator SHALL read every channel.
A member SHALL never receive a message from a channel they may not read.

#### Scenario: The den stays secret
- **WHEN** Luis, a Werewolf, writes in the wolves channel
- **THEN** Tato, the other Werewolf, and the narrator receive it, and no other player does

#### Scenario: Only the dead hear ghosts
- **WHEN** Ana, a dead player, writes in the ghosts channel
- **THEN** other dead players and the narrator receive it and the living do not

### Requirement: Who may write and when
- **Village:** living players SHALL write during dawn, day, vote and execution. It is closed at night (error
  `chat-closed`).
- **Wolves:** living Werewolves SHALL write only during the night (`chat-closed` otherwise).
- **Ghosts:** dead players SHALL write in any phase.

Writing to a channel the member may not write to SHALL be rejected with `chat-forbidden`. Once the game is over, the
village SHALL stay open to everyone, including the dead. Every member SHALL learn, with their game view, which channels
they may read and write right now.

#### Scenario: The village sleeps
- **WHEN** Caro writes in the village during the night
- **THEN** the system rejects it with error `chat-closed`

#### Scenario: A wolf talks by day
- **WHEN** Luis writes in the wolves channel during the day
- **THEN** the system rejects it with error `chat-closed`

#### Scenario: The dead cannot shout
- **WHEN** Ana, dead, writes in the village during the day without a last-words window
- **THEN** the system rejects it with error `chat-forbidden`

#### Scenario: A villager knocks on the den
- **WHEN** Caro, a Villager, writes in the wolves channel
- **THEN** the system rejects it with error `chat-forbidden`

### Requirement: Messages
A message SHALL have between 1 and 280 characters after trimming; otherwise it is rejected with `message-invalid`.
Every message SHALL carry an id, channel, kind (`player`, `narrator` or `last-words`), author, text and the server time
it was sent. Messages SHALL be delivered live to every member who may read the channel. Each channel SHALL keep the most
recent 200 messages.

#### Scenario: A blank message
- **WHEN** Caro sends only spaces
- **THEN** the system rejects it with error `message-invalid`

#### Scenario: Live delivery
- **WHEN** Pipe writes "Sofi is being weird on purpose" in the village during the day
- **THEN** every member receives the message at once with Pipe as author

### Requirement: The narrator's voice
The narrator SHALL be able to post to the village in any phase. These messages SHALL be of kind `narrator` and shown in
the narrator style.

#### Scenario: A line in the dark
- **WHEN** the narrator writes "The fog is thick tonight. Lock your doors." during the night
- **THEN** every member receives it as a narrator message

### Requirement: Last words
When the last-words house rule is on, every player who dies at dawn, by execution or by the Hunter's shot SHALL get a
last-words window of 15 seconds from the moment of death. A player in a window SHALL be able to post exactly one
message, of kind `last-words`, to the village, even though dead and even at night. While any window is open and unused,
living players SHALL NOT write in the village (error `chat-closed`); the narrator still can. A window SHALL close when
its message is sent or its time runs out. Deaths marked by the narrator open no window. With the house rule off, no
window opens.

#### Scenario: Juan has the floor
- **WHEN** Juan dies at dawn and writes "It was Tato. Avenge my hat." within 15 seconds
- **THEN** every member receives it as Juan's last words

#### Scenario: One message only
- **WHEN** Juan already sent last words and tries to write in the village again
- **THEN** the system rejects it with error `chat-forbidden`

#### Scenario: Too late
- **WHEN** Juan tries to send last words 20 seconds after dying
- **THEN** the system rejects it with error `chat-forbidden`

#### Scenario: The village holds its breath
- **WHEN** Juan's window is open and Caro writes in the village
- **THEN** the system rejects Caro's message with error `chat-closed`

#### Scenario: House rule off
- **WHEN** last words is off and Juan dies at dawn
- **THEN** Juan gets no window

### Requirement: History
A member SHALL be able to fetch the history of every channel they may read, oldest first. That includes channels that
became readable later: a player who dies SHALL see the ghosts channel's earlier messages. Chat SHALL only exist while a
game exists for the room; otherwise requests are rejected with `chat-not-open`.

#### Scenario: Back after a reload
- **WHEN** Caro reloads during the day
- **THEN** Caro gets the village history back

#### Scenario: Welcome to the afterlife
- **WHEN** Caro dies after the ghosts already talked
- **THEN** Caro can read the earlier ghost messages

### Requirement: Chat screens
The web app SHALL show players a chat bar under the game table that opens a chat sheet. The sheet SHALL have one tab per
readable channel, an unread count on each tab, message styles for your own, other players', narrator, last-words, ghost
and wolf messages, and a composer for channels you may write in now. Otherwise it shows a note: "The village sleeps —
chat opens at dawn", "Chat paused for last words" or "Village is read-only". The sheet SHALL open on the tab the player
can write in: Wolves for a living Werewolf at night, Ghosts for a dead player, Village otherwise; once the player picks
a tab, it stays on that tab. A player in a last-words window SHALL be prompted with a countdown. Everyone SHALL see last
words in a spotlight while the window is open. The narrator dashboard SHALL show a chat monitor with All, Village,
Wolves and Ghosts tabs and an "As Narrator → All" composer.

#### Scenario: Night note
- **WHEN** Caro, a Villager, opens the chat during the night
- **THEN** Caro sees "The village sleeps — chat opens at dawn" instead of a composer

#### Scenario: Unread wolves
- **WHEN** Tato writes in the wolves channel while Luis has the village tab open
- **THEN** Luis sees an unread count on the Wolves tab

#### Scenario: Wolves open the den
- **WHEN** Luis, a living Werewolf, opens the chat during the night
- **THEN** the sheet opens on the Wolves tab with a composer
