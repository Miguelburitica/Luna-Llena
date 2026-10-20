## MODIFIED Requirements

### Requirement: Messages
A message SHALL have between 1 and 200 characters after cleaning and trimming; otherwise it is rejected with
`message-invalid`. Cleaning SHALL remove control characters, zero-width characters and text-direction overrides and
collapse runs of whitespace into one space. Every message SHALL carry an id, channel, kind (`player`, `narrator` or
`last-words`), author, text and the server time it was sent. Messages SHALL be delivered live to every member who may
read the channel. Each channel SHALL keep the most recent 200 messages.

#### Scenario: A blank message
- **WHEN** Caro sends only spaces
- **THEN** the system rejects it with error `message-invalid`

#### Scenario: Live delivery
- **WHEN** Pipe writes "Sofi is being weird on purpose" in the village during the day
- **THEN** every member receives the message at once with Pipe as author

#### Scenario: Too long
- **WHEN** Caro sends a message of 201 characters
- **THEN** the system rejects it with error `message-invalid`

#### Scenario: Exactly at the limit
- **WHEN** Caro sends a message of 200 characters
- **THEN** every reader receives it unchanged

#### Scenario: Hidden characters
- **WHEN** Caro sends "hola‮odnum" (with a right-to-left override)
- **THEN** readers receive "holaodnum"

## ADDED Requirements

### Requirement: Message length countdown
The composer SHALL stop input at 200 characters. Once a draft reaches 160 characters the composer SHALL show how many
characters are left, and it SHALL show the count as a warning at 0.

#### Scenario: Near the limit
- **WHEN** Caro has typed 170 characters
- **THEN** the composer shows "30" characters left

#### Scenario: Short drafts
- **WHEN** Caro has typed 20 characters
- **THEN** the composer shows no count

### Requirement: Flood limit
A member SHALL send at most 5 messages in any 10 second span, across all channels. Extra messages SHALL be rejected
with `chat-too-fast` and not delivered. The narrator SHALL have the same limit. The web app SHALL say "Slow down a
little." when it happens.

#### Scenario: Spamming the village
- **WHEN** Tato sends 6 messages within 10 seconds
- **THEN** the first 5 are delivered and the sixth is rejected with error `chat-too-fast`

#### Scenario: After a pause
- **WHEN** Tato sent 5 messages and waits 10 seconds
- **THEN** Tato's next message is delivered

### Requirement: Muted players
A player the narrator muted (see `room-lobby`) SHALL be unable to write in any channel; their messages SHALL be
rejected with `chat-muted`, including last words. The web app SHALL say "The narrator muted you." Messages a player
sent before being muted stay in the history.

#### Scenario: Muted player writes
- **WHEN** Tato is muted and writes in the village during the day
- **THEN** the system rejects it with error `chat-muted` and nobody receives it

#### Scenario: Muted bot
- **WHEN** the narrator mutes a bot
- **THEN** the bot writes nothing more in any channel
