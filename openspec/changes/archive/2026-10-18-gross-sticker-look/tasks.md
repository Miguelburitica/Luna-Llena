## 1. Contracts

- [x] 1.1 Confirm no contract changes: role, avatar and theme ids stay as they are

## 2. Web domain

- [x] 2.1 None. The look adds no view rules.

## 3. Web application

- [x] 3.1 None. No store or port changes.

## 4. Web infrastructure

- [x] 4.1 Restyle `design-system.css` with the new tokens, phase palettes, fonts and chrome, keeping every class name; update `app.css` and `index.html` fonts; test "Night text" and "Day button" with a contrast test over every phase block, and "Reduced motion" by checking the reduced-motion rules
- [x] 4.2 Add `roleStickers` in en and es and a sticker label on `RoleCard` face and mini; test "The Seer's card", "Spanish sticker", "The Drunk's sticker", "Every role has a sticker" and "Clean names"
- [x] 4.3 Add `SlimeWordmark` and use it in `HomeView` and `DeskHeader`; test "Opening the game"
- [x] 4.4 Redraw every illustration (logo moon, card back, 10 avatars, tomb, ghost, rooster, 8 roles, 3 scenes) in the sticker style, and thicken and grossify the icons; test "A full table" and "Every role has art" by checking each avatar and role maps to an existing outlined SVG
- [x] 4.5 Replace hard-coded old palette colours in scoped view styles with tokens where they clash
- [x] 4.6 Update `design/canvas/luna-design-system.css`, `Home.dc.html` and `Roles.dc.html`

## 5. Verification

- [x] 5.1 Run `pnpm check` green
- [x] 5.2 In the browser at phone width, check home, join, lobby, role reveal and table, plus the narrator dashboard, then screenshot them for the user
