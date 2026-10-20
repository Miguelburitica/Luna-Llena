## 1. Contracts

- [x] 1.1 None: appearance is web-only vocabulary (design decision 3). Verify `packages/contracts` has no diff.

## 2. Server

- [x] 2.1 None: no server domain, application or infrastructure change. Verify `apps/server` has no diff.

## 3. Web domain

- [x] 3.1 Add `atmosphere/domain/colorMode.ts` (`COLOR_MODES`, `ColorMode`, `MenuLook`, `menuLookOf`) and `colorMode` in
  `AtmosphereSettings` and `soundSettingsDefaults`; test "First visit follows the phone" and "Forcing dark on a light
  phone" as pure cases in `colorMode.test.ts`, and the `'system'` default in `soundSettings.test.ts`

## 4. Web application

- [x] 4.1 Add the `ColorModePreference` port and `COLOR_MODE_PREFERENCE` key, and `FakeColorModePreference` in
  `Atmosphere.fixtures.ts`
- [x] 4.2 Add `systemPrefersLight`, `menuLook` and `setColorMode` to `useAtmosphereStore`, applying the look at start and
  on change; test "First visit follows the phone", "Phone switches at sunset" and "Forcing dark on a light phone" in
  `useAtmosphereStore.test.ts`

## 5. Web infrastructure

- [x] 5.1 Add `DocumentColorModePreference` (matchMedia, `data-color-mode`, `theme-color`) and wire it in
  `installAtmosphere.ts`; test reading, change events and applying in `DocumentColorModePreference.test.ts`
- [x] 5.2 Make `LocalAtmosphereSettingsStore.load` fill `colorMode: 'system'` when missing or unknown; test "Older saved
  settings" in `LocalAtmosphereSettingsStore.test.ts`
- [x] 5.3 Add the Appearance row (`LunaSegmented`, System / Light / Dark) to `SettingsOverlay.vue` with en and es copy in
  `atmosphereMessages.ts`; test "Choosing the look" in `SettingsOverlay.test.ts`
- [x] 5.4 In `index.html` add `<meta name="color-scheme" content="dark light">`; in `design-system.css` add
  `:root{color-scheme:dark}`, `.ph-day{color-scheme:light}`, the `.ph-menu` dark block with `--page` and the
  `:root[data-color-mode="light"] .ph-menu` light block (design decision 1); in `app.css` use `var(--page)` for the page
  background with the `prefers-color-scheme: light` fallback; test "Phone with automatic dark mode", "Native controls on
  a light menu", "Readable light menu", "Readable dark menu" and that the light block targets only `.ph-menu` in
  `designSystem.test.ts`
- [x] 5.5 Tokenise `.desk` (`--page`, `--ink`) and switch menu views from `ph-night` to `ph-menu`: `HomeView`,
  `JoinView`, `PublicGamesView`, `RoomSetupView`, `PlayerLobby`, `NarratorLobby`, `AdminView`, `TableSetupView`,
  `LunaNotice`; test "Light home screen" in `HomeView.test.ts` and "Light appearance at night" in
  `PlayerTable.test.ts` (root keeps the phase class, never `ph-menu`)
- [x] 5.6 Replace literal light-on-dark colours with tokens in those views and their components (`DeckBuilder`,
  `DeskHeader` and any other component mounted only on menus); verify with
  `grep -nE "rgba\(255|rgba\(233|#[0-9a-fA-F]{6}"` over them that only artwork tiles keep literals
- [x] 5.7 Small phones in `DeckBuilder.vue`: `overflow-wrap:break-word` instead of `anywhere`, `minmax(min(220px,100%),1fr)`
  columns, wrapping legend, and below 420px the art | name grid with the counter on its own row; test "Werewolf card on
  a small phone" in `smallPhones.test.ts` (no `anywhere`, the 420px card rule present)
- [x] 5.8 Small phones in `RoomSetupView.vue`, `NarratorLobby.vue`, `AdminView.vue` and the shared `.desk` heading rule
  in `design-system.css`: 16px spacing, smaller titles, static setup footer with hint above and both buttons on one row;
  test "Setup footer on a small phone" and "Narrowest phone" in `smallPhones.test.ts` (static footer and `flex:1`
  buttons under 420px, no fixed widths over 320px in those views' styles)

## 6. Verification

- [x] 6.1 Run `pnpm check` green
- [ ] 6.2 In the browser preview at 320px and 360px wide, in both light and dark (emulated `prefers-color-scheme` and
  the manual setting), check home, join, public games, room setup (deck and footer), player lobby, narrator lobby and
  admin: no sideways scroll, role names whole, footer not covering the deck, no dark patches on light menus
- [ ] 6.3 Start a game with Light appearance and confirm night, day and vote screens keep their phase palettes
- [ ] 6.4 After deploy, open the home and room setup screens on an Android phone with Chrome "darken websites" and with
  Samsung Internet dark mode on, and confirm the colours match the design
