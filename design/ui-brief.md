# Luna Llena — UI & Feature Design Brief

Handoff for the UI design of **Luna Llena**, an online Werewolf party game for groups of friends.

---

## 1. Product in one paragraph

Luna Llena is an online social-deduction game for 6–16 friends. Players join a room from a link and get a secret role. The game alternates between **Night**, when wolves pick a victim and special roles use their powers, and **Day**, when the village discusses and votes to execute a suspect. A human **Narrator (God)** runs the game from a dashboard. The game helps them with sound, animations and AI-drafted story text, and the narrator reads the story out over the group's voice call (Discord, Meet or WhatsApp). The game provides text chat. The tone is a **spooky storybook comedy**: atmospheric, but made for laughing with friends.

**MVP scope:** online only, Classic theme, one room = one game at a time.
**Later:** a "Colombian mode" theme pack (La Patasola, El Mohán, La Llorona…) that reskins the game and adds roles. The design system must be **themeable** so this is a token/illustration swap, not a redesign.

---

## 2. Users & devices

| User | Device | Primary need |
|---|---|---|
| **Player** | Mostly phone (portrait), some laptop | See their secret role, act fast at night, chat, vote, feel the drama |
| **Narrator (God)** | Laptop/desktop (landscape) | See everything, control pacing, read the story, trigger effects |

- **Mobile-first** for every player view. Target width 360–430px, scaling up to desktop.
- The **Narrator dashboard is desktop-first** (min 1280px), with a usable tablet fallback.
- Players are often **on a voice call at the same time**, so the UI should be glanceable. Big phase cues, little reading.

---

## 3. Visual direction

- **Mood:** moonlit storybook. Deep night blues and violets, warm candle and lantern oranges, a parchment cream for narration. Day phases shift to dusty golds and soft sky.
- **Comedy:** characters are cute and slightly goofy, not gory. Deaths are shown as comic tombstones, ghosts or a "poof" with a feather. There is no blood.
- **Illustration:** hand-drawn village houses, a big moon and sun, fog, and fireflies. Avatars are round character portraits.
- **Typography:** a storybook display face for titles and narration. A clean, legible sans for UI and chat.
- **Motion is part of the identity:**
  - Day/night transitions: the sun sets and the moon rises, and the palette shifts.
  - Role cards flip.
  - Tombstones drop in.
  - Vote tallies fill.
- **Sound** (the design should show where it's controlled): an ambient loop for each phase, plus stings for death, vote reveal and howl.
- **Accessibility:**
  - Phases must be distinguishable without color (icon + label).
  - Minimum touch target 44px.
  - Readable contrast on the dark backgrounds.
  - A "reduced motion" variant.

### Theme tokens (must be swappable per theme)
- Color palette for each phase: night, dawn, day, vote.
- Display font.
- Village illustration set: houses, landmark, sky elements.
- Role art and role display names.
- Sound set (not visual, but listed in the theme).

---

## 4. Roles (MVP — Classic theme)

| Role | Team | Night power | Win condition |
|---|---|---|---|
| Werewolf | Wolves | Chooses a victim together with the other wolves (shared wolf chat) | Wolves equal or outnumber the villagers |
| Villager | Village | None (gets a decoy "Who do you suspect?" prompt) | All wolves dead |
| Seer | Village | Inspects one player and learns whether they're a wolf | All wolves dead |
| Doctor | Village | Protects one player from death tonight (not the same player two nights in a row) | All wolves dead |
| Witch | Village | One heal potion and one poison potion for the whole game | All wolves dead |
| Hunter | Village | None. When killed, immediately takes one player down with them | All wolves dead |
| Fool | Solo | None | Wins alone if the village executes them |
| Drunk | Village | Believes they're the Seer; their results are random | All wolves dead |

The Drunk's screens must look **identical** to the Seer's. They learn the truth on the end screen.

Each role needs: an illustration, a team color badge, a one-line power description, and a win condition line.

---

## 5. Game flow

```
Home → Create room (Narrator) / Join room (Player)
     → Lobby → Start
     → Role reveal
     → [ Night → Dawn → Day → Vote → Execution ] repeat
     → End game → Play again (same room)
```

The Narrator advances each phase manually. Optional timers can auto-advance.

---

## 6. Views

### 6.1 Home
- Logo, tagline, and an animated moon or village hero.
- Two primary actions: **Create a room** and **Join with code** (a code input with 4–6 characters).
- A link to **How to play / Roles guide**.
- Opening a join link lands the player directly on the join step with the code prefilled.

### 6.2 Room setup (Narrator)
- Room name.
- **Theme selector:** Classic (active); Colombian mode shown as a locked "Coming soon" card.
- **Role deck builder:**
  - Each role's card has a − / + counter.
  - A live **balance meter** shows wolves vs village vs solo.
  - A "Suggested deck for N players" button fills the counters.
- **Timers:** night, day discussion, vote. Each has an "off" option for manual control.
- **Toggles:** ghost powers, last words, reveal role on death (yes/no), anonymous votes (yes/no).
- CTA: **Create room**, which goes to the Narrator lobby.

### 6.3 Lobby (Player)
- Room name and code with a **copy invite link** button.
- **Name + avatar picker:** a grid of avatar portraits, each pickable by only one player.
- Players list showing avatar, name and a ready check. The narrator is marked with a crown or quill icon.
- **I'm ready** toggle.
- Waiting state: idle village animation and "Waiting for the narrator to start…".
- Edge states:
  - Name already taken.
  - Room full.
  - Game already started (offer to spectate if available later; MVP shows an error).

### 6.4 Lobby (Narrator)
- Everything in the player lobby, plus:
  - Deck summary compared with the player count, e.g. "8 players · 8 roles ✔" or "Deck has 7 roles for 8 players ✖".
  - Kick a player (with confirmation).
  - Edit settings (back to setup).
  - **Start game**, enabled only when the deck matches the player count and everyone is ready.

### 6.5 Role reveal (Player)
- A face-down card. Tapping it flips it to show:
  - Role art and role name.
  - Team badge.
  - Power description.
  - Win condition.
- Wolves also see the list of fellow wolves.
- "Got it" closes the reveal.
- **Hold-to-peek:** during the game, a small card icon re-shows the role while it's pressed. The role is never visible at rest, in case someone is screen-sharing.

### 6.6 Game table (Player): main screen
Persistent layout on mobile, from top to bottom:
1. **Phase banner:** icon, phase name, day/night counter ("Night 2"), and a **timer ring**.
2. **Village scene:** players arranged in a circle or arc of houses or portraits. Each portrait has states: alive, dead (tombstone), ghost (translucent), voted-for (marker count), and you (highlight).
3. **Action dock:** contextual and phase-dependent (see the states below).
4. **Chat:** a collapsible sheet on mobile and a side panel on desktop, with tabs **Village · Wolves · Ghosts**. Players only see the tabs they have access to. An unread badge appears on each tab.

States to design:

**Night**
- The scene darkens, the moon rises, fog rolls in, and the village chat is locked ("The village sleeps").
- Each role gets its action prompt in the dock:
  - **Wolves:** a target picker of living non-wolves. Each wolf's current pick shows live to the other wolves. Wolf chat is open.
  - **Seer and Drunk:** a target picker. The result appears as a small card ("Marta is… a Werewolf 🐺" / "not a Werewolf").
  - **Doctor:** a target picker. The player protected last night is disabled, with a tooltip explaining why.
  - **Witch:** sees tonight's victim and gets two potion buttons (Heal / Poison + target), each greyed out once used.
  - **Villager, Hunter and Fool:** a decoy prompt, "Who do you suspect?", which picks a player.
- After submitting: a "Done — the village sleeps…" waiting state with a subtle animation. The player can change their choice until the night ends.

**Dawn**
- The sun rises and the palette warms.
- **Narration card:** a parchment-style storybook page. The narrator's text appears with a typewriter effect.
- **Death reveal:** the victim's portrait turns into a tombstone with a comic flourish. If "reveal role on death" is on, a role flip follows.
- "Nobody died tonight" variant: a happy rooster and a relieved village.
- **Last words:** the dead player gets a 15-second spotlight. Their chat message shows enlarged to everyone, then the timer ends it.

**Day**
- Bright scene, village chat open, discussion timer.
- The dock shows "Discuss — vote opens in 2:30". It can show a hint like "Who's acting suspicious?".

**Vote**
- The dock becomes a **target picker**: tap a portrait, then press **Lock vote**. The vote can be changed until the timer ends or the player locks it.
- Live state: X of Y players have voted. If votes aren't anonymous, voters' faces show on their target.
- **Reveal:** an animated tally with bars or stacked avatars filling up, then the top-voted player is shown.
- Tie handling: "Tie! No execution today" or a narrator decision (the design needs a tie state).
- **Execution scene:** the executed player's portrait gets a comic exit, and their role flips if the setting is on.
- **Hunter revenge:** if the Hunter dies, every player sees "The Hunter takes aim…". The Hunter gets an urgent target picker with a short timer.
- **Fool wins:** if the Fool is executed, a special interruption screen shows the Fool's victory over everyone. The game may continue or end, depending on settings.

**Ghost (dead player)**
- Desaturated scene with their portrait shown as a ghost.
- The village chat is read-only and the Ghosts chat tab is open.
- **Haunt button**, once per game:
  - *Flicker:* every living player's screen briefly flickers, as if a candle went out.
  - *Whisper:* send one anonymous word to a chosen living player, shown as a spooky toast.
- After use, the button shows "Your haunting power is spent".

### 6.7 Narrator dashboard (desktop)
Multi-panel layout:
- **Header:** room name, phase stepper (Lobby → Night → Dawn → Day → Vote → Execution), and **Next phase** / **Back** buttons. The current night/day number.
- **Players grid:** every player with avatar, name, **role visible**, alive/dead state, and their night action this round ("Seer → inspected Juan"). A quick action menu on each player offers: kill, revive, mute in chat, kick.
- **Night results panel:** a summary of what will happen at dawn ("Wolves chose Ana · Doctor protected Ana → Ana survives"). It flags who hasn't acted yet.
- **Narration composer:**
  - An AI-drafted story paragraph based on the night's events, in the theme's tone.
  - Actions: **Regenerate**, edit it inline, **Publish to players**. Publishing pushes it to the dawn narration card.
  - Tone chips: spooky / funny / dramatic.
  - A history of narrations already published.
- **Soundboard:** a grid of large buttons (Howl, Thunder, Church bell, Suspense, Scream, Rooster, Drumroll, Sad trombone), plus volume and ambient on/off.
- **Effects:** trigger visual effects on all player screens (lightning flash, fog, shake).
- **Timer controls:** start, pause, +30s, skip.
- **Chat monitor:** read all channels, including the wolf and ghost chats, and post as **Narrator**. Narrator messages have a distinct bubble style.
- **Win check:** when a team meets its win condition, a banner appears: "Village wins! End game?"

### 6.8 End game
- A **winning team banner** with a celebratory animation for the winners and a comic defeat for the losers.
- **Roles revealed:** everyone's role, with "you were the Drunk all along 🍺" style reveals.
- **Timeline:** night by night and day by day, it shows what really happened ("Night 1: Wolves targeted Ana. Doctor saved her. Seer inspected Luis."). It can be scrolled or expanded.
- **Awards** (3–5 funny titles), each with a winner avatar:
  - Most Suspicious: the most votes received.
  - Worst Liar: a wolf voted out on day 1.
  - Betrayed Own Team: a villager who voted against villagers the most.
  - Silent Assassin: a wolf that survived without being voted.
  - Chatterbox: the most messages.
- **Play again** (same room and players, back to lobby) and **Leave**.

### 6.9 Overlays & system states
- **How to play / Role guide:** a modal or full-screen view with flow steps and role cards. It's reachable from home, the lobby and the in-game menu.
- **Settings:** master volume, music, effects, reduced motion, language (ES / EN).
- **Reconnecting:** a non-blocking banner ("Reconnecting to the village…"). After a long disconnect it becomes a full-screen state.
- **Errors:** room not found, room full, game already started, kicked by narrator, narrator disconnected (game paused).
- **Toasts:** a player joined or left, a ghost whisper, a timer warning at 10 seconds left.
- **Confirmations:** kicking a player, ending the game, manually killing or reviving.

---

## 7. Shared components

- **Role card:** face-down, face-up, mini (for the timeline and end screen), locked (theme preview).
- **Avatar portrait:** alive, dead/tombstone, ghost, selected, voted-for (count badge), you, narrator, disconnected.
- **Phase banner:** night, dawn, day, vote, execution.
- **Timer ring:** normal, warning at the last 10s, paused.
- **Target picker:** a grid or circle of selectable portraits, with disabled states and their reasons.
- **Chat:**
  - Message bubbles: own, other, system ("Ana joined"), narrator (parchment style), ghost (translucent), wolf (red tint).
  - Input, tabs, unread badges.
- **Vote tally:** live bars and stacked avatars, plus the reveal animation.
- **Narration card:** parchment page with typewriter text.
- **Buttons:** primary, secondary, danger, icon, and soundboard tile.
- **Inputs:** text, room-code segmented input, counter (− / +), toggle.
- **Badges:** team (wolves, village, solo), status, count.
- **Modals, sheets and toasts.**

---

## 8. Interaction & content notes

- Every timed action shows the time left. Actions submitted by the deadline are kept; players who miss it are logged as "no action".
- Secrecy matters:
  - A player's role must never show on screen at rest.
  - Night results are visible only to the player who owns them.
  - Wolves see each other.
- UI copy is short and playful, in **Spanish and English**. Examples:
  - "La aldea duerme…" / "The village sleeps…"
  - "Alguien no amaneció" / "Someone didn't wake up"
- Mid-game, the narrator can take any action from the dashboard without leaving the current view.

---

## 9. Future: Colombian mode (design for it, don't build it)

- A theme pack that swaps palette, illustrations (a colonial pueblo, a church, a tienda, mountains), role names and sounds.
- Example reskins: Werewolf → **La Patasola**, Doctor → **El Cura**, Witch → **La Curandera**, Drunk → **El Borracho del pueblo**.
- New roles to come:
  - **La Chismosa:** broadcasts a scrambled message to the village.
  - **El Tendero:** sees who visited a player at night.
  - **El Político:** has a double vote that can be bought once.
  - **La Llorona:** a neutral role.
- The theme selector in room setup and the locked theme card are where this first appears in the MVP.

---

## 10. Deliverables requested from design

1. A design system with tokens (the Classic theme), plus a token sheet showing which values change per theme.
2. Mobile screens for every player view and state in §6.3–6.6 and §6.8.
3. A desktop narrator dashboard (§6.7), plus the setup and lobby (§6.2, §6.4).
4. The component library (§7) with every state.
5. Motion notes for the day/night transition, card flip, death reveal, vote tally and haunt flicker.
