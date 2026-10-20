## Purpose

Public games let people who have no code find a room that needs players. The host makes a room public, it shows up in
a live list, and anyone can join from there. Limits keep strangers from abusing the list.

## ADDED Requirements

### Requirement: Room visibility
Every room SHALL be either `private` or `public`, chosen by the host when creating it, with `private` by default. The
visibility SHALL NOT change for the life of the room. Every member SHALL see the room's visibility. Private rooms SHALL
work as before: they are joined by code or invite link and never listed. Public rooms SHALL also be joinable by code.
An unknown visibility SHALL be rejected with `settings-invalid`.

#### Scenario: Private by default
- **WHEN** Nico creates a room without choosing a visibility
- **THEN** the room is private and does not appear in the public games list

#### Scenario: Public room
- **WHEN** Nico creates a public room named "Lobos de medianoche"
- **THEN** every member sees the room as public and it appears in the public games list

#### Scenario: Unknown visibility
- **WHEN** a room is created with the visibility `secret`
- **THEN** the system rejects it with error `settings-invalid`

#### Scenario: Public room joined by code
- **WHEN** Caro enters the code of a public room on the join screen
- **THEN** Caro finds the room and can join as with a private one

### Requirement: Public games list
The system SHALL let anyone, seated or not, watch the list of public rooms. Each entry SHALL show:
- the room code and name;
- the narrator's name;
- the number of players and the capacity;
- how many of the players are bots;
- the deck size;
- the status: waiting, in progress or full;
- whether it can be joined now.

A room SHALL be joinable when it is in the lobby and has a free seat. The list SHALL include only rooms whose narrator
is connected and that have not been hidden by reports. It SHALL put joinable rooms first, then fuller rooms first,
then newer rooms first, and SHALL hold at most 50 rooms. It SHALL never show session tokens, member ids or anything
from a running game besides its status.

#### Scenario: Watching the list
- **WHEN** Caro opens the public games list while two public rooms and one private room exist
- **THEN** Caro sees the two public rooms with their names, narrators, player counts, bot counts and deck sizes, and
  not the private one

#### Scenario: Narrator away
- **WHEN** the narrator of a public room loses the connection
- **THEN** the room disappears from the list until the narrator is back

#### Scenario: Joinable rooms first
- **WHEN** the list holds a full room, a room in progress and a waiting room with free seats
- **THEN** the waiting room with free seats comes first

### Requirement: Live list updates
Everyone watching the public games list SHALL see changes without reloading: a public room opening or closing, players
joining or leaving, bots being added or removed, deck changes, a game starting or ending, and the narrator dropping or
coming back. Updates MAY be grouped so that a burst of changes reaches watchers as one update within one second.

#### Scenario: A player joins
- **WHEN** Pipe joins a public room while Caro watches the list
- **THEN** Caro's list shows one more player in that room within a second

#### Scenario: A room closes
- **WHEN** the narrator of a public room leaves it while Caro watches the list
- **THEN** the room disappears from Caro's list

#### Scenario: A game starts
- **WHEN** the narrator starts the game in a public room while Caro watches the list
- **THEN** Caro's list shows the room as in progress and not joinable

### Requirement: Rooms in progress or full
A public room whose game is running SHALL stay on the list as *in progress*. A public room in the lobby with no free
seat SHALL stay on the list as *full*. Neither SHALL be joinable from the list. When the game ends and the narrator
reopens the lobby, or a seat frees up, the room SHALL become joinable again.

#### Scenario: Full room
- **WHEN** a public room has 15 players
- **THEN** the list shows it as full and not joinable

#### Scenario: Back to the lobby
- **WHEN** the narrator of an in-progress public room chooses to play again
- **THEN** the list shows the room as waiting and joinable

### Requirement: Public games screen
The web app SHALL offer a "Find a game" action on the home page that opens the public games screen. The screen SHALL:
- show one card per listed room in the style of the join screen's room card, with the narrator, the player count, a
  bot count when there are bots, the deck size and a status badge;
- offer two filters, "Waiting to start" and "Free seats", both on by default, which hide rooms in progress and full
  rooms respectively;
- open the join screen with the room's code filled in when the player taps a joinable card;
- show joinable rooms only as tappable, and rooms in progress or full as greyed out;
- show an empty state with an action to create a room when nothing matches;
- update live while it is open, and stop watching when it is left.

#### Scenario: Opening the screen
- **WHEN** Caro taps "Find a game" on the home page
- **THEN** Caro sees the public games screen with both filters on

#### Scenario: Joining from the list
- **WHEN** Caro taps the card of a waiting public room with code LUNA42
- **THEN** the app opens the join screen with the code LUNA42 filled in and the room found

#### Scenario: Filters off
- **WHEN** Caro turns off "Waiting to start"
- **THEN** rooms in progress appear greyed out and cannot be tapped

#### Scenario: Nothing to join
- **WHEN** no public room matches the filters
- **THEN** Caro sees "No open games right now" and a "Create a room" action

### Requirement: Reporting a public room
Anyone watching the list SHALL be able to report a public room once. When reports from 3 different network addresses
have been made against a room, the room SHALL be hidden from the list for the rest of its life. It still works for the
people in it and by code. Reporting a private or unknown room SHALL be rejected with `room-not-public` or
`room-not-found`. A second report from the same address SHALL be accepted and not counted. The web app SHALL ask for
confirmation before sending a report.

#### Scenario: Three reports hide a room
- **WHEN** people on three different networks report the room "Sala de spam"
- **THEN** the room disappears from the public games list for everyone and can still be joined by code

#### Scenario: Reporting twice
- **WHEN** Caro reports the same room twice from the same network
- **THEN** the second report is not counted

#### Scenario: Reporting a private room
- **WHEN** someone reports a private room by its code
- **THEN** the system rejects it with error `room-not-public`

### Requirement: Public room cap
A network address SHALL hold at most 2 open public rooms at a time. Creating a third public room SHALL be rejected with
`public-room-limit`, and the web app SHALL say "You already host 2 public rooms. Close one first." Private rooms SHALL
have no such cap. A room counts until it closes.

#### Scenario: Third public room
- **WHEN** Nico, who already hosts 2 public rooms, creates another public room from the same network
- **THEN** the system rejects it with error `public-room-limit`

#### Scenario: Private rooms are unlimited
- **WHEN** Nico, who already hosts 2 public rooms, creates a private room
- **THEN** the room is created

#### Scenario: Closing frees a slot
- **WHEN** Nico closes one of their 2 public rooms and creates a new public room
- **THEN** the room is created

### Requirement: Banned clients and the list
A banned device or address SHALL still be able to watch the public games list, but SHALL NOT be able to report rooms,
which is rejected with `banned`. When reports hide a room, its creator SHALL get a strike (see `moderation`).

#### Scenario: Banned reporter
- **WHEN** a banned device reports a room
- **THEN** the system rejects it with error `banned` and the report is not counted

#### Scenario: Hidden room strikes its host
- **WHEN** reports hide the room "Sala de spam"
- **THEN** the device and address that created it get a strike
