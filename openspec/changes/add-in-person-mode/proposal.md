## Why

Luna Llena only works online: every player needs a phone in the room and a voice call. Many groups play Werewolf
around a real table, where the game is louder, more talkative and more theatrical, and phones in hands kill the mood.
For them the app should step back and become a complement: a dealer that passes one phone around, and a logbook
(bitácora) for the narrator that keeps track of every decision, checks the rules and the win, runs the timers and adds
sound and screen effects.

## What Changes

- **A new in-person mode, entirely on one device.** It works offline: no room, no code, no server. The narrator's phone
  holds the whole game.
- **Setup:**
  - choose 6 to 15 players;
  - name them (optional; unnamed seats read "Player 3");
  - pick the house rule "reveal role on death" and the three phase timers;
  - build the deck with the existing deck builder, its balance verdict and its suggested deck.
- **Pass-the-phone dealing:**
  - the roles are dealt at random by the same dealing rule as online;
  - a privacy screen says whose turn it is;
  - the player taps to see their role card, then taps "I've seen it", which hides it for good and moves on;
  - there is no way back to peek at an earlier card;
  - the Drunk sees the Seer card, and Werewolves see their pack;
  - after the last player, a hold-to-open screen hands the phone back to the narrator.
- **The narrator's logbook:**
  - **Night:** a wake-up script: wolves, Seer, Drunk, Doctor, Witch, by name. The narrator logs:
    - the pack's victim;
    - the Seer's target, shown with a big result card to flash to the Seer;
    - the Drunk's random vision, the same way;
    - the Doctor's patient, with last night's patient blocked;
    - the Witch's potions, with the wolves' victim shown and spent potions disabled.

    Roles whose players are dead get a "pretend" step, so the table can't tell who is gone.
  - **Dawn:** who died, ready to announce.
  - **Hunter:** the revenge shot, or a skip.
  - **Vote:** the narrator logs who voted for whom, accused by accused, as the hands go up. The verdict, the tie, the
    Fool's win and the execution follow the online rules.
  - **Win checks:** after every death the narrator is asked to end the game or keep playing.
  - **Undo** of the last logged action.
  - **Manual kill or revive** for table accidents.
- **Timers and effects on the device:**
  - phase countdowns with +30 s and a "time's up" alert;
  - the soundboard (Howl, Thunder, Church bell, and the rest);
  - the screen effects (Lightning, Fog, Shake);
  - ambient loops and automatic stings.

  A **table screen** hides every secret and shows only the phase, the countdown and the effects, so the narrator can
  turn the phone to face the table.
- **End-game summary:** the winner, solo winners, who was who, the night-by-night story and the awards (without
  Chatterbox). "Play again" re-deals with the same names.
- **Survives a reload:** the game is saved on the device after every action and resumed from Home.

## Shared rules, not copied rules

The match rules (dealing, night actions, dawn, verdict, Hunter, Fool, win detection, timeline, awards) move from
`apps/server/src/features/match/domain` into a new framework-free workspace package, `@luna/rules`. The server and the
web both import the same `Match` aggregate. The online game behaves exactly as before.

## Capabilities

### New Capabilities
- `in-person-mode`: setup, pass-the-phone dealing, the narrator's logbook through night, dawn, day, vote and
  execution, undo, timers, on-device effects, the table screen, the end summary and resuming.

### Modified Capabilities
- None. The online specs are unchanged. Moving the match domain into `@luna/rules` is a refactor with no change in
  behaviour.

## Impact

- **New package `packages/rules` (`@luna/rules`):**
  - `Match`, `Night`, `Ballot`, `Seat`, `dealRoles`, `resolveDawn`, `verdictOf`, `winnerOf` and `awardsOf`, with their
    tests;
  - `narratorViewOf`, the narrator projection, which takes the chat access as an argument.
- **Contracts:** `TABLE_ERROR_CODES` with `nothing-to-undo`. Everything else reuses existing vocabulary:
  `ROOM_LIMITS`, `TIMER_OPTIONS`, `ROLE_CATALOG`, `START_CONDITIONS`, `SOUND_CUES`, `SCREEN_EFFECTS` and
  `MATCH_ERROR_CODES`.
- **Server (`features/match`):**
  - `domain/` keeps only `chatPermissionsOf`;
  - `application/` and `infrastructure/` import `Match` from `@luna/rules`;
  - `matchViews.toNarratorView` delegates to `narratorViewOf`.

  No socket event, use case or behaviour changes.
- **Web:**
  - **new `features/table`** with domain, application and infrastructure layers: setup, dealing, the logbook, the
    journal (command log and replay), the table screen and end summary views, i18n en and es, and the routes `/table/*`;
  - **`features/atmosphere`:** the store follows a pluggable scene (a `MatchView` getter) instead of always reading
    `useMatchStore`, and gains `playHere(cue)` for on-device cues. `NarratorSoundboard` takes a `local` prop;
  - **`features/match`:**
    - `RoleRevealOverlay`, `PhaseTimer`, `DawnAnnouncement` and `VerdictReveal` take what they need as props instead
      of reading the room or match store, so the table views can mount them;
    - `EndStory`, `EndAwards`, `RoleCard` and `TargetPicker` are reused as they are;
  - **`features/room`:** the deck section of `RoomSetupView` is extracted into a `DeckBuilder` component;
    `HomeView` gains "Play in person" and "Resume table game".

## Non-goals

- No server, no network and no accounts in this mode. Nothing is sent anywhere.
- No second screen, such as a TV, casting or a projector view on another device. See open questions.
- No chat, ghost powers, last words or voice call in person: the table talks out loud.
- No player phones: players never touch the app except to see their own card during the deal.
- No decoy suspicions: sleeping players do nothing at night.
- No AI-drafted narration in this change.
- No new roles, no new sounds on the shared soundboard, and no change to the online game's rules or screens.
- No anonymous-votes rule: hands are raised in the open.
- No timers that advance the phase by themselves. The narrator still advances.
