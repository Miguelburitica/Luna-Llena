## Why

Online players have no table to talk across. The voice call carries the noise, but the game needs its own written
channels:
- a village square for accusations;
- a secret den where the wolves plot at night;
- a quiet corner where the dead can gossip;
- a narrator who can drop an ominous line at any time.

Last words give the fallen 15 seconds of fame, which is where many of the laughs come from.

## What Changes

- Three chat channels during a game:
  - **Village:** everyone reads it. Living players write by day, and it is closed at night.
  - **Wolves:** only Werewolves read it, and the living ones write at night.
  - **Ghosts:** only the dead read and write it.
- The narrator reads every channel and posts narrator messages to the village at any time.
- Last words: when the house rule is on, a player killed at dawn, by execution or by the Hunter's shot gets one message
  in the village within 15 seconds of dying. Everyone sees it in a spotlight, and the village chat pauses for living
  players while it is open.
- Every member gets the history of the channels they may read when they join or come back. New messages arrive live.
- Screens:
  - The player chat bar and sheet with tabs, unread counts, message styles and the closed-chat note (canvas `DayChat`,
    `Ghost` chat bar).
  - The last-words spotlight (canvas `LastWords`).
  - The narrator's chat monitor with tabs and an "As Narrator → All" composer (canvas `NarratorDashboard`).

## Capabilities

### New Capabilities
- `chat`: the channels, who reads and writes each one and when, narrator messages, last words, history and live
  delivery.

### Modified Capabilities

## Impact

- Contracts:
  - Chat vocabulary, the `ChatMessage` and `ChatAccess` views, and chat errors.
  - The events `chat:send`, `chat:history` and `chat:message`.
  - `MatchView` gains each member's `chat` access.
- Server:
  - A new `chat` feature (domain, application and infrastructure).
  - The match domain decides chat access and records the last-words windows.
  - A `ChatAudience` port is wired to match in the composition root.
- Web: a new `chat` feature, wired into `PlayerTable`, `GameView` and `NarratorDashboard`.

## Non-goals

- Lobby chat, typing indicators, reactions, editing or deleting messages.
- Muting players or moderating messages. The dashboard's "Mute in chat" stays for later.
- Rate limiting beyond the message length rule.
- Keeping messages across server restarts.
