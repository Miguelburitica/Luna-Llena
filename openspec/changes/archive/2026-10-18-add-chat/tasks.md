## 1. Contracts

- [x] 1.1 Add the chat vocabulary, views and events, and `chat` on `MatchView`; verify with `tsc` in packages/contracts

## 2. Server match changes

- [x] 2.1 Carry the `lastWords` house rule into the match; record last-words windows in `bury` with `now` for dawn, execution and Hunter's shot deaths, but not for the narrator's kills; add `closeLastWords`; keep every existing test green
- [x] 2.2 Add `chatAccessOf` and the internal `ChatPermissions`; fill `chat` in `matchViews`; test every read and write rule of the spec in the domain, including "House rule off", the game-over rule and `villagePaused`
- [x] 2.3 Add `DescribeChatAudience` and `CloseLastWords` to the match application, with tests

## 3. Server chat feature

- [x] 3.1 Add the chat domain (`ChatLog`, `MessageText`); test "A blank message", the 280-character limit and the history cap
- [x] 3.2 Add the chat application (the ports, `SendMessage`, `ChatHistory`); test "The den stays secret", "Only the dead hear ghosts", "The village sleeps", "A wolf talks by day", "The dead cannot shout", "A villager knocks on the den", "Live delivery", "A line in the dark", "Juan has the floor", "One message only", "Too late", "The village holds its breath", "Back after a reload", "Welcome to the afterlife" and `chat-not-open`
- [x] 3.3 Add the chat infrastructure and the wiring in `startServer`; add a socket integration test with a night of wolf chat, a dawn with last words, and checks of who received what

## 4. Web chat feature

- [x] 4.1 Add the chat domain helpers with unit tests, and the `ChatGateway`, `SocketChatGateway`, `useChatStore` and `installChat`, with store tests (history on entry and after a reconnect, live messages for readable channels, send failures kept)
- [x] 4.2 Add `ChatBar`, `ChatSheet`, `LastWordsPrompt`, `LastWordsSpotlight` and `NarratorChatMonitor` following the canvas, and wire them into `PlayerTable` and `NarratorDashboard`; add component tests for "Night note", "Unread wolves", the message styles, the paused and read-only notes, the last-words prompt countdown and spotlight, and the narrator's monitor tabs and composer

## 5. Verification

- [x] 5.1 Run `pnpm check` green
- [x] 5.2 In the browser with bots: chat by day, wolves at night, last words at dawn, the narrator posting, and a reload restoring history
