## Context

See proposal.md for the why. Relevant current state:

- Palettes are CSS custom properties in `design-system.css`. `:root` holds the night tokens and each `.ph-<phase>` class
  redefines `--bg-1`, `--bg-2`, `--ink`, `--muted`, `--surface`, `--surface-2`, `--line`, `--accent`, `--accent-ink`,
  `--sheet`, `--btn-2`, `--btn-2-ink`, `--edge`. `designSystem.test.ts` parses those blocks and checks contrast.
- Menu screens hard-code `ph-night`. Desk screens (`RoomSetupView`, `NarratorLobby`, `AdminView`) also use `.desk`,
  whose background (`#140A20`) and ink (`#FFF7EC`) are literals, and their scoped styles use literal `rgba(255,255,255,…)`
  surfaces and a literal footer colour.
- Nothing declares `color-scheme`, so Chrome's Auto Dark and Samsung Internet's dark mode treat the page as light-only
  and invert it.
- Device settings live in the `atmosphere` feature: `AtmosphereSettings` (domain), `AtmosphereSettingsStore` and
  `MotionPreference` ports, `useAtmosphereStore` (applies reduced motion through the port and saves on change),
  `LocalAtmosphereSettingsStore` and `DocumentMotionPreference` adapters, `SettingsOverlay.vue` (canvas `Settings`).
  `main.ts` creates the atmosphere store before mounting, so anything it applies is in place for the first render.
- `DeckBuilder.vue` sets `.setup-card-text{overflow-wrap:anywhere}` (the cause of "Hom/bre/lobo"), lays the counter
  beside the name, and uses `minmax(220px,1fr)` columns, which overflow below roughly 330px. The setup footer is
  `position: sticky` with a fixed dark background.

## Goals / Non-Goals

**Goals:**
- One switch point for the menu look: a resolved attribute on `<html>`, so CSS stays declarative and every menu screen
  follows without per-view code.
- Reuse the reduced-motion pattern (domain value, port, document adapter, store) rather than invent a new one.
- Keep the change to tokens and a handful of layout rules; no new components.

**Non-Goals:**
- Changing any phase palette or the narrator dashboard.
- Moving appearance into `@luna/contracts`: the server never sees it, so it is web vocabulary, like volumes.

## Decisions

### 1. A `ph-menu` palette resolved by a `data-color-mode` attribute
`design-system.css` gains `.ph-menu{…dark tokens…;color-scheme:dark}` (same values as `ph-night` plus a new `--page`
token for the desk background) and `:root[data-color-mode="light"] .ph-menu{…light tokens…;color-scheme:light}`.
Menu views replace `ph-night` with `ph-menu`. The store resolves System to `light` or `dark` and the adapter writes
`data-color-mode` on `<html>`.

Light tokens are derived from `ph-day` so the sticker look carries over: `--bg-1:#F4EEFF`, `--bg-2:#FFF1DC`,
`--ink:#22102E`, `--muted:#4E3A5A`, `--surface:rgba(255,251,239,.95)`, `--surface-2:rgba(34,16,46,.07)`,
`--line:rgba(34,16,46,.22)`, `--accent:#8FE34B`, `--accent-ink:#13240A`, `--sheet:#FFFBEF`, `--btn-2:#FF7FC4`,
`--btn-2-ink:#2A0A1E`, `--edge:#FFFFFF`, `--page:#EFE6FA`, and darker team inks (`--team-wolf-soft:#A3152B`,
`--team-village-soft:#1F6630`, `--team-solo-soft:#6E2C9E`) so legends stay readable. Panels inside a light menu stay
light (the `.ph-day .panel` dark override does not apply to `ph-menu`). Exact values may be tuned during apply as long
as the contrast tests pass.

*Alternatives:* only `@media (prefers-color-scheme: light)` in CSS — cannot honour a manual Light or Dark choice.
A body class per view — duplicates the decision in every view. CSS `light-dark()` — needs `color-scheme` to carry the
choice and still needs an attribute for the override; the attribute alone is simpler and testable.

### 2. Declare colour schemes everywhere the browser looks
- `index.html`: `<meta name="color-scheme" content="dark light">`. Declaring dark support is what turns off Chrome's
  Auto Dark; Samsung Internet honours the same signal in current versions.
- `:root{color-scheme:dark}`, `.ph-menu` as above, `.ph-day{color-scheme:light}` so native inputs and sliders match.
- `app.css`: `html,body` background uses `var(--page)` with a `@media (prefers-color-scheme: light)` fallback for the
  instant before scripts run, removing a dark flash on light phones.
- The adapter also updates `<meta name="theme-color">` to the resolved page colour so the browser bar matches.

*Alternative:* `filter: invert()` counter-hacks for Samsung — fragile, breaks illustrations; rejected (proposal
non-goal).

### 3. Appearance is an atmosphere setting behind a port
- Domain (`atmosphere/domain/colorMode.ts`): `COLOR_MODES = ['system','light','dark'] as const`, `ColorMode`,
  `MenuLook = 'light' | 'dark'`, `menuLookOf(mode, systemPrefersLight): MenuLook`. `AtmosphereSettings` gains
  `colorMode`, and `soundSettingsDefaults` sets it to `'system'`.
- Port (`application/ports.ts`):
  ```ts
  export interface ColorModePreference {
    prefersLight(): boolean
    onChange(listener: (prefersLight: boolean) => void): void
    apply(look: MenuLook): void
  }
  export const COLOR_MODE_PREFERENCE: InjectionKey<ColorModePreference>
  ```
- Store: `systemPrefersLight` ref seeded from `prefersLight()` and updated by `onChange`; `menuLook` computed from
  `menuLookOf`; `setColorMode(mode)`; applies `menuLook` immediately and on every change (same shape as reduced motion).
- Adapter `DocumentColorModePreference`: `matchMedia('(prefers-color-scheme: light)')` with its `change` event; `apply`
  sets `document.documentElement.dataset.colorMode` and the `theme-color` meta. Wired in `installAtmosphere.ts`.
- `LocalAtmosphereSettingsStore.load` accepts settings without `colorMode` (or with an unknown one) and fills `'system'`,
  so older saved volumes survive.
- `SettingsOverlay.vue` adds an Appearance row with `LunaSegmented` (System / Light / Dark), between reduced motion and
  language, as in canvas `Settings` rows. i18n keys `atmosphere.settings.appearance` and `…appearanceModes.{system,light,
  dark}` in en and es.

No socket events, use cases or server code change.

### 4. Tokenise the menu screens' literals
`.desk` uses `background-color:var(--page)` and `color:var(--ink)`. In menu views and their components (room setup,
deck builder, lobbies, join, public games, admin, table setup, notice), literal light-on-dark colours become tokens:
`rgba(255,255,255,.04)` → `var(--surface-2)`, `rgba(233,230,255,.1…)` borders → `var(--line)`, footer background →
`var(--sheet)` at .92 via `color-mix`, literal text colours → `var(--ink)`/`var(--muted)`. Illustrated theme tiles in
room setup keep their own colours because they sit on artwork.

### 5. Small-phone rules at one breakpoint, 420px
420px is already the breakpoint in `DeckBuilder.vue`. Rules live with the component they lay out (scoped styles), and
shared ones in `design-system.css`:
- `design-system.css`: `@media (max-width:420px){.desk .h1{font-size:28px} .desk .h2{font-size:21px}}`; nothing else
  shared changes, `--touch` stays 44px.
- `RoomSetupView`: body padding 16px and gap 16px, title 30px, footer `position:static` with the hint on its own line
  (`flex-basis:100%`) and both buttons `flex:1` on one row; `setup-entry-error` margin 16px.
- `DeckBuilder`: `.setup-card-text` uses `overflow-wrap:break-word` (never `anywhere`) and `hyphens:manual` at every
  width; below 420px the card becomes a two-column grid (art | name) with the counter on a second row aligned to the
  name; columns use `minmax(min(220px,100%),1fr)`; the balance legend wraps.
- `NarratorLobby`, `AdminView`: padding 16px below 420px.

*Alternative:* `clamp()` fluid type everywhere — larger blast radius across canvas-matched screens; deferred.

### 6. How scenarios are tested
jsdom has no layout, so visual scenarios are tested at the source of truth, like `designSystem.test.ts` already does:
- Contrast and `color-scheme` scenarios parse `design-system.css` (`.ph-menu` dark block and the light block) and
  `index.html`.
- "Light home screen" and "Light appearance at night" mount `HomeView` and `PlayerTable` and assert their root carries
  `ph-menu` and the phase class respectively; the CSS test asserts the light block is scoped to `.ph-menu` only.
- Store and adapter scenarios use a `FakeColorModePreference` added to `Atmosphere.fixtures.ts`.
- Small-phone scenarios read the components' `<style>` text (no `overflow-wrap:anywhere`, the 420px rules present) and
  are verified in the browser preview at 320px and 360px wide.

## Risks / Trade-offs

- [Samsung Internet versions that ignore `color-scheme` still invert] → we send every standard signal; the proposal
  lists forcing older browsers as a non-goal. Verify on a real Samsung phone after deploy.
- [Light menu values not reviewed by Claude Design] → values are tokens only, contrast-tested, and can be swapped later
  without code changes.
- [Missed literal colours make a light menu show a dark patch] → task to grep menu views for `rgba(255` and hex literals,
  and browser check of every menu screen in both looks.
- [CSS-text tests are brittle to formatting] → assert on normalised declarations (whitespace stripped), matching the
  existing design-system test style.

## Migration Plan

Web only, no data migration beyond the tolerant settings load. Rollback is reverting the web build: the old loader
ignores unknown keys, so settings saved with `colorMode` still load.
