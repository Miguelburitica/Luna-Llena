## Why

On Android phones with the browser's automatic dark mode on (Chrome "darken websites", Samsung Internet dark mode),
the browser repaints our already dark screens: buttons turn muddy, counter signs vanish and outlined text loses its
outline. We never told the browser that the app has its own colours, so it guesses. At the same time some players want
a light look for the menus, and on small phones (360px wide and below) the room setup screen breaks: role names wrap
mid-word ("Hom / bre / lobo"), and the sticky footer covers the deck and stacks its buttons.

## What Changes

- **Own colours, never repainted:** the app declares which colour schemes it draws, so the browser's forced or automatic
  dark mode leaves every screen as designed.
- **Light and dark menus:** the menu screens (home, join, public games, room setup, lobbies, admin, in-person table
  setup and notices) get a light and a dark palette. A new **Appearance** setting (System, Light, Dark) chooses between
  them. It defaults to System, follows the phone when the phone switches, and is remembered on the device.
- **Phases stay phases:** in-game screens (role reveal, night, dawn, day, vote, ghost, end screen, narrator dashboard,
  in-person deal and table) keep their phase palettes whatever the appearance setting says.
- **Small phones:** below 420px wide the desk screens (room setup, narrator lobby, admin) use phone spacing and smaller
  headings, deck cards keep each role name whole and put the counter under the name, the setup footer stops covering the
  form and keeps its buttons on one row, and nothing scrolls sideways. Touch targets stay at least 44px.

## Capabilities

### New Capabilities
- `appearance`: colour schemes the app owns, the light and dark menu palettes, the Appearance setting, and how screens
  fit small phones.

### Modified Capabilities
- `atmosphere`: the Settings screen gains the Appearance setting.

## Impact

- Web, `src/features/atmosphere`: `domain/soundSettings.ts` (settings gain `colorMode`, old saved settings keep working),
  `application/ports.ts` and `useAtmosphereStore.ts` (a `ColorModePreference` port, `setColorMode`),
  `infrastructure/DocumentColorModePreference.ts` (new), `LocalAtmosphereSettingsStore.ts`, `SettingsOverlay.vue`,
  `installAtmosphere.ts`, i18n.
- Web, `src/shared/infrastructure/ui/styles`: `design-system.css` (`color-scheme`, a `ph-menu` palette with light and
  dark values, tokenised `desk`, small-phone rules), `app.css`.
- Web, `apps/web/index.html`: `color-scheme` meta.
- Web views moving from `ph-night` to `ph-menu`: room (`HomeView`, `JoinView`, `PublicGamesView`, `RoomSetupView`,
  `PlayerLobby`, `NarratorLobby`, `DeckBuilder`), admin (`AdminView`), table (`TableSetupView`), shared `LunaNotice`.
- Server and contracts: none.

## Non-goals

- Light versions of game phases. Night stays night; the phase palettes already include a light day.
- Syncing the appearance between devices or with the narrator. It is a per-device preference.
- A new design canvas. The light menu palette is derived from the existing day palette; Claude Design can refine it later
  by swapping tokens.
- Landscape and tablet layouts beyond what already works.
- Forcing a look on browsers that ignore `color-scheme` entirely (some older Samsung Internet versions). We use every
  standard signal; we do not fight the browser with filters.
