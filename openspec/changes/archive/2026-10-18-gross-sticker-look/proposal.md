## Why

The group wants Luna Llena to feel like a pack of gross-out trading stickers: rude, sticky cartoon kids with pun names,
loud slime colours and thick outlines. The moonlit storybook look reads as too polite for a party game among friends.
This change replaces the Classic look with an original sticker style instead of adding a second theme pack.

## What Changes

- **Logo and home:** a drippy, slimy "Luna Llena" wordmark, a gross moon (warts, drool, a wonky eye) and a slime-town
  home scene.
- **Role cards:** every role in the catalog becomes a die-cut sticker card with a pun sticker name in English and
  Spanish next to its plain role name. The card back becomes a sticker-pack wrapper.
- **Cast and icons:** the 10 player avatars, the tombstone, the ghost and the rooster are redrawn as gross cartoon
  kids and props. Every icon gets a wobbly marker stroke, so the set no longer reads as a clean line-icon app. Over
  twenty icons get gross redraws with drips, warts, flies and stink lines.
- **UI chrome:** slime greens and bubblegum pinks, thick ink outlines, chunky press shadows, sticker borders with a
  peel corner, and goofy fonts: a dripping logo face, gooey headings, a scrappy story hand and a rounded UI face. Buttons, cards, sheets, chips, tabs, inputs and the narrator desk
  share the look.
- **Phases:** night, dawn, day, vote and ghost keep their own palettes, now in the sticker colours, with text and
  accent buttons that stay readable. Reduced motion still stops every animation.
- The Classic theme keeps its id. Only its tagline changes.
- **Gross level:** party-safe. Slime, drool, snot, warts, stink lines, flies and wonky eyes are in. Vomit, body hair
  and nudity are out.

## Capabilities

### New Capabilities
- `sticker-look`: the visual identity of the game. Covers the wordmark, sticker role cards with pun names, the gross
  cast of avatars and role art, readable phase palettes, reduced motion, and the party-safe gross level.

### Modified Capabilities

## Impact

- Contracts: none. Role ids, avatar ids and theme ids are unchanged.
- Server: no feature folder is touched.
- Web:
  - `src/shared/infrastructure/ui`: `design-system.css`, `app.css`, every SVG in `assets/illustrations`, and the
    `RoleCard`, `DeskHeader` and new `SlimeWordmark` components;
  - `src/shared/infrastructure/i18n/sharedMessages.ts`: the `roleStickers` names and the Classic tagline;
  - `src/features/room/infrastructure/views/HomeView.vue`: the wordmark and home scene;
  - `index.html`: fonts and theme colour.
  - Scoped styles that hard-code the old palette, so each view uses the new tokens.
- Design: `design/canvas/luna-design-system.css`, `Home.dc.html` and `Roles.dc.html`.

## Non-goals

- New roles, new rules or a second theme pack. The Colombia pack stays where it is.
- Painted, airbrushed art. The drawings are code-drawn SVG and read as cartoon stickers.
- Copying any existing trading-card brand: no third-party logo, card frame, character or name.
- New sounds. The atmosphere sound set is unchanged.
