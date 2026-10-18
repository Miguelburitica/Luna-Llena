## Context

The look lives in three places: the design tokens and component classes in `design-system.css`, the SVG illustrations
in `assets/illustrations` that the stylesheet maps to `bg-*`, `f-*` and `r-*` classes, and the mask icons `i-*`. Views
only use class names, so a restyle that keeps the class names reaches every screen without touching view logic.
Role display names come from `sharedMessages` (`roles.*`, `roleCards.*`). This change adds no domain model, use case,
port or socket event.

Views implemented against the canvas:
- `Home.dc.html`: `HomeView`;
- `Roles.dc.html`: `RoleCard` face, back and mini;
- `RoleReveal.dc.html`, `LobbyPlayer.dc.html`, `Join.dc.html`, `NarratorDashboard.dc.html` and the night and day
  screens pick up the look through the shared classes.

## Goals / Non-Goals

**Goals:**
- One original gross-out sticker identity across player and narrator screens.
- Keep every existing class name, so views keep working.
- Readable phases and reduced motion, checked by tests.

**Non-Goals:**
- Raster or painted art.
- A theme switcher. Classic is replaced, not duplicated.
- Changes to rules, contracts or the server.

## Decisions

### Palette and tokens
New base tokens on `:root`:
- `--slime #8FE34B`, `--slime-deep #3E8E1F`;
- `--bubblegum #FF7FC4`, `--bubblegum-deep #C8327F`;
- `--booger #E9E35A`;
- `--outline #1C0F26`, the ink used for every thick outline and press shadow;
- `--sticker #FFFBEF`, the white die-cut edge.

The existing tokens (`--moon`, `--lantern`, `--parchment*`, `--team-*`, `--ink-*`) keep their names with new values.
`--parchment` becomes sticker cream, so narration bubbles and the story panel read as sticker paper.

Phase palettes keep their structure:

| Phase | Background | Accent | Feel |
|---|---|---|---|
| night | grape purple to swamp | slime green | slime town at night |
| dawn | grape to bubblegum | booger yellow | sunrise in bubblegum |
| day | mint to custard | bubblegum pink | sunny playground |
| vote | dark plum to raspberry | mustard | tense playground court |
| ghost | grey-green | ectoplasm mint | greyed, as before |

A test reads the phase blocks from the stylesheet and checks the 4.5:1 contrast for `--ink` against `--bg-1` and
`--bg-2`, and for `--accent-ink` against `--accent`.

### Fonts
The fonts must not read as a tidy app UI. Every face is rounded, gooey or scrappy:
- Logo: Rubik Wet Paint, letters that already drip, used only for the wordmark.
- Display: Gluten at 900, a gooey rounded face for headings, sticker names and phase names.
- Story: Gaegu at 700, a scrappy hand-lettered face for narration and taglines.
- UI: Sniglet at 400 and 800, a goofy rounded face for buttons, chat and labels.
All four come from Google Fonts in `index.html`. `font-synthesis-weight: none` keeps the browser from faking weights.

### Chrome
- **Buttons:** 3px `--outline` border and a 5px hard `--outline` press shadow that collapses on press, with a glossy
  top highlight. Primary is slime, secondary is a sticker-white fill on light phases and a tinted fill on dark phases,
  danger is raspberry.
- **Cards, docks and panels:** a sticker edge (`--sticker` ring) inside an `--outline` ring, with a slight tilt only on
  the role card.
- **Sheets:** an outlined top edge with a slime drip band drawn by a CSS mask.
- **Chips, tabs and segmented controls:** thick outline pills.
- **Inputs:** an outlined sticker field.
- **Avatars:** a sticker-white ring plus an outline ring; `--ring` still recolours the inner ring for you, target and
  pack.

### Wordmark
`SlimeWordmark.vue` in `shared/infrastructure/ui/components` renders an `h1` with the text "Luna Llena" in the display
font, slime fill and a thick outline. An inline SVG drip band hangs under the letters, with drips that grow slowly.
Text plus SVG drips keeps the heading real text for screen readers and translation, and needs no letter paths.
`DeskHeader` uses a small version.

### Illustrations
Every SVG in `assets/illustrations` is redrawn on its existing filename. The shared recipe:
- a 6px `--outline`-coloured stroke;
- a white sticker silhouette behind the figure;
- flat cartoon fills with one highlight;
- at least one party-safe gross detail.

The cast:
- **Avatars:** ana, a snot bubble; caro, braces and drool; juan, a wart and a wonky eye; luis, a fly circling;
  marta, slime pigtails; nico, stink lines; pipe, a runny nose; sofi, a green tongue; tato, a pimple-covered nose;
  vale, goo-dripping hair.
- **Roles:**
  - Wolfgang Drool: a drooling pup-wolf.
  - Snotty Otto: a villager with a snot bubble and a pitchfork.
  - Goo-Eyed Gail: a seer with a wonky eye and a slimy crystal ball.
  - Doc Wartson: a doctor with warts and a dripping syringe of green goo.
  - Brewella Ooze: a witch over a bubbling slime cauldron.
  - Hank the Stank: a hunter with stink lines and flies.
  - Fly-Brain Freddy: a jester with flies around the hat.
  - Hiccup Hugo: a dazed kid with soda bubbles.
- **Props and scenes:**
  - the logo moon: warts, a wonky eye and drool;
  - the card back: a sticker-pack wrapper with slime splats;
  - the tombstone: mossy and slimed;
  - the ghost: snotty;
  - the rooster: wonky-eyed;
  - the phase scenes: a crooked slime town with drippy roofs.
Seats and labels sit on the existing scene geometry.

### Role sticker names
`sharedMessages` gains `roleStickers.<role>` in en and es. `RoleCard` shows the sticker name in a label strip and the
plain role name under it. The drunk already receives the Seer as its perceived role, so it shows the Seer's sticker.
The names are display text, not vocabulary, so they stay in i18n and not in contracts.

### Card frame
The role card is a die-cut sticker:
- a cream body with a 4px outline;
- a team-coloured inner frame;
- a slime drip top edge;
- the art in a rounded blob window;
- the sticker name on a tilted label strip;
- a curled peel corner at bottom right, drawn with a CSS gradient.
It has no brand banner, no numbering and no logo strip. That keeps the frame original.

### Icons
The icons must not look like a clean line-icon set:
- Every mask icon gets a 2.9 stroke and an SVG turbulence and displacement filter, so the lines wobble like a marker
  drawing. Each icon uses its own noise seed.
- Twenty-two icons get gross redraws: moon, sun, ghost, paw, heart, eye, chat, home, trophy, lock, send, flask, shield,
  crown, bell, users, check, quill, vote, link, sparkles and help. The redraws add a drip, a wart, a fly or a stink
  line.
- Monochrome masks keep working with `currentColor`.

### Motion
New keyframes `drip` and `wobble` run on the wordmark drips and the home moon. The existing
`prefers-reduced-motion` rule and the `.reduced` class already stop every animation. A test checks that both rules
still cover all elements.

## Risks / Trade-offs

- Code-drawn SVG is simpler than painted stickers. Accepted: the style is flat cartoon by design.
- A loud palette can hurt legibility. The contrast test guards text and primary buttons. Secondary surfaces stay
  translucent on dark phases.
- Other sessions are editing `HomeView`, `JoinView` and `ChatSheet`. This change edits `HomeView` only for the hero,
  and leaves the return-to-seat parts intact.
- Third-party fonts load from Google Fonts like the current ones. The fallback is Comic Sans or a system cursive.
- The wobble filter is rendered once per icon image by the browser. It costs nothing at runtime beyond the mask.
