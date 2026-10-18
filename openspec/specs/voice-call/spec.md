# voice-call Specification

## Purpose
The voice call link keeps the group's external call one tap away from every screen of the game, so the table talk the
game depends on starts quickly and stays fair at night.

## Requirements

### Requirement: The room's call link
A room SHALL have at most one voice call link. The link is empty by default. The narrator SHALL be able to:
- set the link when creating the room;
- change or remove it at any time, in the lobby or during a game.

Anyone else trying to change it SHALL be rejected with `not-narrator`. Every member SHALL see the current link in the
lobby state, and anyone looking up the room by code SHALL see it in the room summary.

#### Scenario: Link at creation
- **WHEN** Nico creates a room with the call link https://discord.gg/abc123
- **THEN** every member and anyone looking up the code sees that link

#### Scenario: Changing the link mid-game
- **WHEN** the call drops during Night 2 and the narrator sets a new link
- **THEN** every member sees the new link at once

#### Scenario: Removing the link
- **WHEN** the narrator removes the link
- **THEN** the room has no call link

#### Scenario: A player tries to change it
- **WHEN** Caro, a player, sets a call link
- **THEN** the system rejects it with error `not-narrator`

### Requirement: Valid links
A call link SHALL be an absolute `https://` URL with a host and no user name or password, at most 300 characters after
trimming. Anything else SHALL be rejected with `voice-call-invalid`, and the previous link stays.

#### Scenario: Not secure
- **WHEN** the narrator sets http://meet.example.com/room
- **THEN** the system rejects it with error `voice-call-invalid`

#### Scenario: Not a link
- **WHEN** the narrator sets "our usual discord"
- **THEN** the system rejects it with error `voice-call-invalid`

#### Scenario: Hidden credentials
- **WHEN** the narrator sets https://user:secret@meet.example.com
- **THEN** the system rejects it with error `voice-call-invalid`

### Requirement: Free call in one click
The web app SHALL offer the narrator a "Create a free call" action. It fills the link field with a Jitsi Meet room
named after the room code, for example https://meet.jit.si/LunaLlena-CE9JLT, for the narrator to save.

#### Scenario: One-click call
- **WHEN** the narrator of room CE9JLT presses "Create a free call"
- **THEN** the link field contains https://meet.jit.si/LunaLlena-CE9JLT

### Requirement: Join the call
When the room has a call link, the web app SHALL show a "Join the call" button on four screens:
- the Join screen's "Room found" card;
- the player lobby;
- the game table, during every phase;
- the narrator dashboard.

The button SHALL name the provider when it recognises the link's host, and say "Join the call" otherwise. It SHALL open
the link in a new tab without giving that page access to the game. The recognised hosts are:
- discord.gg, discord.com → Discord
- meet.google.com → Google Meet
- zoom.us and its subdomains → Zoom
- chat.whatsapp.com, call.whatsapp.com → WhatsApp
- meet.jit.si → Jitsi

When there is no link, the narrator SHALL see a prompt to add one, and players see nothing.

#### Scenario: Discord recognised
- **WHEN** the link is https://discord.gg/abc123
- **THEN** players see "Join on Discord"

#### Scenario: Unknown provider
- **WHEN** the link is https://calls.example.org/luna
- **THEN** players see "Join the call"

#### Scenario: No link yet
- **WHEN** the room has no call link
- **THEN** players see no call button and the narrator sees "Add a voice call"

### Requirement: Mics off at night
When the night phase begins, every player's game table SHALL show a short reminder, "Night falls — mics off". The
reminder can be dismissed and goes away when the night ends. It SHALL only appear when the room has a call link.

#### Scenario: Nightfall reminder
- **WHEN** Night 2 begins in a room with a call link
- **THEN** every player sees "Night falls — mics off"

#### Scenario: No call, no reminder
- **WHEN** the night begins in a room without a call link
- **THEN** no reminder appears
