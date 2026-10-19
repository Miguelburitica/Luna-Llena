## ADDED Requirements

### Requirement: Opening an in-person game
The home screen SHALL offer "Play in person" next to hosting and joining an online room. An in-person game SHALL run
entirely on the narrator's device: it SHALL need no room, no code and no network connection, and SHALL send nothing to
the server. A device SHALL hold at most one in-person game at a time.

#### Scenario: Offline table
- **WHEN** Nico opens "Play in person" with the device offline
- **THEN** the table setup opens and the whole game can be played without a connection

#### Scenario: Nothing leaves the device
- **WHEN** Nico plays a full in-person game
- **THEN** no request or socket message is sent to the server

### Requirement: Table setup
The setup SHALL let the narrator choose:
- the number of players, from 6 to 15;
- an optional name for each seat, in the order the phone will travel around the table;
- the reveal-role-on-death house rule;
- the night, day and vote timers from the same values as an online room;
- the deck, with the same deck builder, copy limits, balance verdict and suggested deck as an online room.

An unnamed seat SHALL read "Player N", where N is its seat number. Names SHALL be 1 to 20 characters after trimming and
unique ignoring letter case; otherwise the setup shows `name-invalid` or `name-taken` on that seat. Dealing SHALL be
possible only when the deck holds exactly one card per player and at least one Werewolf. Otherwise the setup SHALL
show the unmet conditions `deck-mismatch` or `no-wolves`.

#### Scenario: Quick setup
- **WHEN** Nico chooses 8 players, names nobody and asks for the suggested deck
- **THEN** the seats read Player 1 to Player 8, the deck is 2 Werewolves, Seer, Doctor, Witch, Hunter, Fool and Drunk, and dealing is possible

#### Scenario: Same name twice
- **WHEN** Nico names seat 2 "Ana" and seat 5 "ana"
- **THEN** seat 5 shows `name-taken` and dealing is not possible

#### Scenario: Deck too big
- **WHEN** Nico chooses 7 players and the deck holds 8 cards
- **THEN** the setup shows the unmet condition `deck-mismatch`

#### Scenario: Too few players
- **WHEN** Nico tries to choose 5 players
- **THEN** the player counter stops at 6

### Requirement: Pass-the-phone dealing
When the narrator deals, the system SHALL deal the deck so every seat receives exactly one card, chosen uniformly at
random, and then guide the phone around the table in seat order. For each seat:
1. A privacy screen SHALL show only "Pass the phone to <name>" and a button "I'm <name>".
2. The role card SHALL then show face down; a tap SHALL flip it.
3. "I've seen it" SHALL hide the card and move to the next seat's privacy screen.

A seat's card SHALL NOT be shown again during the deal: there is no back step, and leaving and returning SHALL resume
at the first seat that has not seen their card. The narrator's logbook SHALL stay closed until every seat has seen
their card.

#### Scenario: Seven seats, seven cards
- **WHEN** Nico deals for 7 players with a deck of 2 Werewolves, Seer, Doctor, Witch, Hunter and Fool
- **THEN** each seat holds exactly one of those cards and every card is held by exactly one seat

#### Scenario: Privacy between players
- **WHEN** Ana taps "I've seen it"
- **THEN** the card is hidden and the screen shows only "Pass the phone to Caro"

#### Scenario: No peeking back
- **WHEN** Caro is on the privacy screen after Ana saw their card
- **THEN** there is no way to show Ana's card again

#### Scenario: Reload mid-deal
- **WHEN** the page reloads after 3 of 8 seats saw their card
- **THEN** the deal resumes at seat 4's privacy screen with the same dealt cards

### Requirement: What the card shows
During the deal every seat SHALL see their perceived role card: the role art, the team, the power and the win
condition. The Drunk SHALL see the Seer card and the Seer's team. A Werewolf SHALL also see the names of the other
Werewolves.

#### Scenario: The Drunk's card
- **WHEN** Caro is dealt the Drunk and flips the card
- **THEN** Caro sees the Seer card and the village team

#### Scenario: The pack
- **WHEN** Luis and Tato are the Werewolves and Luis flips the card
- **THEN** Luis sees the Werewolf card and Tato named as the pack

### Requirement: Handing the phone back
After the last seat has seen their card, the system SHALL show "Give the phone back to the narrator" and open the
logbook only after a press and hold of about one second, so a stray tap cannot reveal the roles.

#### Scenario: Back to the narrator
- **WHEN** the last seat taps "I've seen it" and Nico presses and holds the open button
- **THEN** the logbook opens at Night 1 showing every seat's true role

#### Scenario: A quick tap
- **WHEN** someone taps the open button without holding it
- **THEN** the logbook stays closed

### Requirement: Logbook and phases
The logbook SHALL show the narrator every seat with name, true role (the Drunk as Drunk), alive or dead, and the
current phase and round. The phases, rounds and their order SHALL follow the online game: night, dawn, day, vote,
execution, then the next night. Only the narrator's "Next" SHALL advance them. The house rules ghost powers, last words
and anonymous votes SHALL be off in person.

#### Scenario: A full day passes
- **WHEN** the narrator presses Next five times from Night 1
- **THEN** the logbook shows Night 2

#### Scenario: The narrator sees everything
- **WHEN** Caro is the Drunk
- **THEN** the logbook shows Caro as Drunk

### Requirement: Consulting a role
At any moment after the deal, the narrator SHALL be able to tap a seat in the logbook to open that player's role card.
The card SHALL show the true role, the team and the power. For the Drunk, it SHALL also show that the player believes
they are the Seer. Closing the card SHALL return to the same place in the logbook. Consulting a role SHALL NOT change
the game or the journal.

#### Scenario: Who was Caro again
- **WHEN** the narrator taps Caro, the Drunk, during Day 2
- **THEN** the Drunk card opens with "Thinks they are the Seer", and closing it returns to Day 2

### Requirement: Night wake-up script
During the night the logbook SHALL show a wake-up script with one step per night power in the deck, in this order:
Werewolves, Seer, Drunk, Doctor, Witch. Each step SHALL name the players to wake. The Seer and the Drunk SHALL be
separate steps, each naming one player, because both believe they are the Seer. A step whose players are all dead
SHALL still appear as a "pretend" step, with a short countdown, so the table cannot tell the power is gone. Villagers,
Hunters and Fools SHALL have no step, and a power with no card in the deck SHALL have no step at all. Each step SHALL show whether it has been logged.

#### Scenario: Script for the default deck
- **WHEN** Night 1 begins with the default deck
- **THEN** the script reads Werewolves (Luis, Tato), Seer (Marta), Drunk (Caro), Doctor (Juan) and Witch (Sofi)

#### Scenario: A dead Seer
- **WHEN** Night 3 begins and Marta, the only Seer, is dead
- **THEN** the Seer step shows as a pretend step with a countdown and nothing to log

#### Scenario: No Witch in the deck
- **WHEN** Night 1 begins with a deck that has no Witch
- **THEN** the script has no Witch step

### Requirement: Logging the hunt
At the Werewolves' step the narrator SHALL pick the pack's victim among living players who are not Werewolves. The
pick SHALL count for every living Werewolf, so the pack agrees on that victim. The narrator MAY change the pick until
dawn.

#### Scenario: The pack points
- **WHEN** the narrator logs Juan as the pack's victim
- **THEN** the dawn preview names Juan as the victim

#### Scenario: Wolves cannot eat wolves
- **WHEN** the narrator opens the victim picker
- **THEN** Luis and Tato, the Werewolves, are not offered

### Requirement: Logging visions
At the Seer's step the narrator SHALL pick the player the Seer points at, never the Seer. The system SHALL decide the
result with the online rule: the truth for the Seer; for the Drunk, a random result with even odds, kept once drawn.
The logbook SHALL then show a full-screen result card ("Werewolf" or "Not a Werewolf") to show to that player. A
vision cannot be changed, and a second one in the same night by the same player SHALL be rejected with
`already-inspected`. The logbook SHALL keep each player's past visions, marking the Drunk's as a Drunk's vision.

#### Scenario: A true vision
- **WHEN** the narrator logs that Marta, the Seer, points at Luis, a Werewolf
- **THEN** the result card shows "Werewolf"

#### Scenario: The Drunk's vision
- **WHEN** the narrator logs that Caro, the Drunk, points at Ana, a Villager
- **THEN** the result card shows a random result, and the logbook records it as a Drunk's vision

#### Scenario: One peek per night
- **WHEN** the narrator tries to log a second vision for Marta on the same night
- **THEN** the system rejects it with error `already-inspected`

### Requirement: Logging the Doctor and the Witch
At the Doctor's step the narrator SHALL pick a living patient. The Doctor MAY pick themselves. Last night's patient
SHALL be disabled with the reason shown, and logging them SHALL be rejected with `protected-last-night`. At the Witch's
step the logbook SHALL show the pack's current victim. The narrator SHALL log heal, poison (with a target other than
the Witch), both, or "nothing tonight". A spent potion SHALL be disabled, and logging it SHALL be rejected with
`potion-used`. These choices MAY change until dawn.

#### Scenario: Same patient twice
- **WHEN** the Doctor protected Ana on Night 1
- **THEN** on Night 2 Ana is disabled in the Doctor's picker as last night's patient

#### Scenario: The Witch sees the target
- **WHEN** the pack's victim is Juan and the narrator reaches the Witch's step
- **THEN** the logbook shows "The wolves are coming for… Juan"

#### Scenario: Heal already used
- **WHEN** the Witch healed on Night 1
- **THEN** on Night 2 the Heal button is disabled

### Requirement: Ending the night
During the night the logbook SHALL show the dawn preview: the victim, the protected player, the Witch's heal, the
poison target and who would die. When the narrator presses Next while a script step for a living player is not logged,
the logbook SHALL ask to confirm. Dawn SHALL resolve with the online rules: the victim dies unless protected or
healed, the poison kills even if protected, used potions are spent, and the Doctor's patient is blocked next night.

#### Scenario: Saved by the Doctor
- **WHEN** the pack's victim is Ana and the Doctor protected Ana
- **THEN** at dawn the logbook shows that nobody died

#### Scenario: Poison and claws
- **WHEN** the pack's victim is Juan and the Witch poisons Luis
- **THEN** at dawn Juan and Luis are dead

#### Scenario: Forgot the Doctor
- **WHEN** the Doctor's step is not logged and the narrator presses Next
- **THEN** the logbook asks to confirm before dawn comes

### Requirement: Dawn announcement
At dawn the logbook SHALL show who died, with their role when reveal role on death is on, or "Nobody died tonight!",
ready for the narrator to read out or to show on the table screen.

#### Scenario: A death at dawn
- **WHEN** Juan, the Doctor, died in the night with reveal role on death on
- **THEN** the dawn announcement shows Juan's tombstone and the Doctor card

### Requirement: Hunter's shot
When the Hunter dies by any cause, the logbook SHALL ask the narrator to log the Hunter's target among living players,
or to skip the shot. The target SHALL die at once under the same death rules. Next SHALL stay disabled while the shot
is pending.

#### Scenario: One last shot
- **WHEN** the wolves kill Sofi, the Hunter, and the narrator logs Tato as Sofi's target
- **THEN** Tato is dead

#### Scenario: Waiting for the shot
- **WHEN** the Hunter's shot is pending
- **THEN** the narrator cannot press Next until the shot is logged or skipped

### Requirement: Logging the vote
During the vote the narrator SHALL log who voted for whom as the table raises hands. The narrator picks an accused and
taps the living players who voted for them. A voter SHALL hold at most one vote: tapping them under another accused
moves their vote, and tapping them again clears it. Nobody MAY vote for themselves. The logbook SHALL show the running
tally. When the narrator presses Next, the verdict SHALL follow the online rules:
- the player with strictly the most votes is executed;
- a tie or no votes executes nobody;
- executing the Fool records the Fool as a solo winner and the game goes on.

#### Scenario: Hands up
- **WHEN** the narrator logs Ana, Caro, Pipe and Sofi voting for Luis and Juan and Tato voting for Sofi
- **THEN** the tally shows Luis 4 and Sofi 2, and at Next Luis is executed

#### Scenario: Changing hands
- **WHEN** Caro is logged under Luis and the narrator taps Caro under Tato
- **THEN** Caro's vote moves to Tato

#### Scenario: A tie
- **WHEN** Luis and Tato get 3 votes each
- **THEN** at Next the logbook shows it is a tie and nobody is executed

#### Scenario: Fooled you
- **WHEN** the village executes Marta, the Fool
- **THEN** the logbook shows "The Fool wins!", Marta is a solo winner and the game goes on

### Requirement: Win checks
After every change to who is alive, the system SHALL check the online win conditions. When a team has won, the logbook
SHALL ask the narrator to end the game or keep playing. Keeping playing SHALL dismiss the question until the next
change to who is alive.

#### Scenario: Last wolf falls
- **WHEN** the village executes the last living Werewolf
- **THEN** the narrator is asked to end the game with the village as winner

#### Scenario: Wolves take over
- **WHEN** dawn leaves 2 Werewolves and 2 other players alive
- **THEN** the narrator is asked to end the game with the wolves as winner

### Requirement: Table corrections
The narrator SHALL be able to mark any seat dead or alive again from the logbook, for example when a player leaves the
table. The change SHALL follow the same death, Hunter and win rules and SHALL appear in the end story.

#### Scenario: A player goes home
- **WHEN** the narrator marks Pipe dead during the day
- **THEN** Pipe shows as dead and the end story records the narrator's change

### Requirement: Undo
The narrator SHALL be able to undo the last logged action, back to the start of Night 1, one action at a time. Undo
SHALL restore exactly the state before that action, including potions, the blocked patient, visions and who is alive.
A redone Drunk's vision draws again. The deal itself cannot be undone. Undo with nothing logged SHALL be rejected with
`nothing-to-undo`.

#### Scenario: Wrong victim
- **WHEN** the narrator logs Ana as the pack's victim by mistake and presses Undo
- **THEN** the pack has no victim again

#### Scenario: Undo a dawn
- **WHEN** the Witch's heal was spent at dawn and the narrator undoes the advance to dawn
- **THEN** the logbook is back at the night and the heal potion is available

#### Scenario: Nothing to undo
- **WHEN** the narrator presses Undo at the start of Night 1
- **THEN** the system rejects it with error `nothing-to-undo`

### Requirement: Timers
When a night, day or vote begins and its timer is above 0, the logbook and the table screen SHALL show a countdown. The
narrator SHALL be able to add 30 seconds. When the countdown reaches zero, the device SHALL show a "Time's up" alert
and, with sound on, play a short alarm, once per phase. Timers SHALL NOT advance the phase.

#### Scenario: Day countdown
- **WHEN** the day begins with a 180 second day timer
- **THEN** the logbook shows 3:00 counting down

#### Scenario: Time's up
- **WHEN** the vote countdown reaches zero with sound on
- **THEN** the device shows "Time's up" and plays the alarm once, and the vote stays open

### Requirement: Effects on the device
The logbook SHALL include the soundboard and the screen effects. They SHALL play on this device only. The sound toggle,
the ambient loop per phase, the automatic stings and the sound and motion settings SHALL behave as in the online game,
driven by the in-person game's phases.

#### Scenario: Thunder at the table
- **WHEN** the narrator presses Thunder with sound on
- **THEN** the device plays thunder

#### Scenario: Nightfall sting
- **WHEN** the narrator advances from execution to night with sound on
- **THEN** the device plays the howl and the night loop starts

### Requirement: Table screen
The narrator SHALL be able to switch to a table screen that shows no secrets: the phase scene, the round, the
countdown, the latest dawn announcement or verdict, and the screen effects. The table screen SHALL return to the
logbook only after a press and hold.

#### Scenario: Facing the table
- **WHEN** the narrator opens the table screen during the day
- **THEN** the screen shows the day scene and the countdown and no role of any living player

#### Scenario: Lightning for the table
- **WHEN** the narrator triggers Lightning and then opens the table screen
- **THEN** the table screen flashes

### Requirement: End summary
When the narrator ends a game that has a winner, the device SHALL show the end summary:
- the winning team with a flavor line;
- any solo winners;
- a plot twist for the Drunk;
- who was who;
- the night-by-night and day-by-day story, expandable;
- the awards Most Suspicious, Worst Liar, Betrayed Own Team and Silent Assassin, computed as online.

There is no Chatterbox award in person.

#### Scenario: The village celebrates
- **WHEN** the narrator ends the game after the village won
- **THEN** the summary shows the village won and every true role, the Drunk included

#### Scenario: Votes remembered
- **WHEN** Luis received 9 votes over the game, more than anyone
- **THEN** the summary shows Luis as Most Suspicious with 9 votes

### Requirement: Play again
From the end summary the narrator SHALL be able to play again with the same seats, names, timers, rule and deck, and
go straight to a new deal. The narrator SHALL also be able to go back to setup or leave.

#### Scenario: Rematch at the table
- **WHEN** the narrator presses Play again
- **THEN** a new random deal starts at seat 1's privacy screen with the same names

### Requirement: Saved on the device
The in-person game SHALL be saved on the device after every action: the setup, the deal, the progress of the deal and
every logged action. After a reload or reopening the app, Home SHALL offer "Resume table game", which returns to the
same screen and state. Starting a new in-person game while one is saved SHALL ask to confirm and then discard the old
one.

#### Scenario: The phone locks mid-game
- **WHEN** the browser reloads during Day 2
- **THEN** Home offers to resume, and resuming shows Day 2 with the same deaths, potions and visions

#### Scenario: Starting over
- **WHEN** a game is saved and the narrator chooses "Play in person" and confirms
- **THEN** the saved game is discarded and a fresh setup opens
