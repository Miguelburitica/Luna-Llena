## Purpose

Keeps the game looking as designed on every phone: the app owns its colours so browsers do not repaint it, menus come
in a light and a dark look chosen per device, and every screen stays readable on small phones.

## ADDED Requirements

### Requirement: The app owns its colours
The web app SHALL tell the browser which colour schemes it draws, both in the page head and in its styles, so that a
browser's forced or automatic dark mode does not recolour any screen. Native controls (scrollbars, inputs, range
sliders) SHALL follow the scheme of the screen they sit on.

#### Scenario: Phone with automatic dark mode
- **WHEN** Caro opens the home screen on a phone whose browser darkens websites automatically
- **THEN** the page declares both light and dark schemes, so the browser leaves its colours as designed

#### Scenario: Native controls on a light menu
- **WHEN** Caro views a menu screen in the light look
- **THEN** that screen declares the light scheme, so its inputs and sliders are drawn light

### Requirement: Light and dark menus
The menu screens (home, join, public games, room setup, player and narrator lobby, admin, in-person table setup and
notices) SHALL have a light look and a dark look. The dark look SHALL be the current night look. In both looks body text
SHALL have a contrast ratio of at least 4.5:1 against both ends of the background, and the label on a primary button
SHALL have a contrast ratio of at least 4.5:1 against the button.

#### Scenario: Light home screen
- **WHEN** Caro's appearance is Light and Caro opens the home screen
- **THEN** the home screen uses the light menu look

#### Scenario: Readable light menu
- **WHEN** a player reads a menu screen in the light look
- **THEN** its text has at least 4.5:1 contrast against the background and its primary button label at least 4.5:1
  against the button

#### Scenario: Readable dark menu
- **WHEN** a player reads a menu screen in the dark look
- **THEN** its text has at least 4.5:1 contrast against the background and its primary button label at least 4.5:1
  against the button

### Requirement: Appearance setting
The web app SHALL offer an Appearance setting with the values System, Light and Dark. It SHALL default to System. With
System, menus SHALL use the light look when the device prefers light and the dark look otherwise, and SHALL switch
while open when the device changes. The setting SHALL be remembered on the device. Settings saved before this setting
existed SHALL keep their other values and get System.

#### Scenario: First visit follows the phone
- **WHEN** Caro opens the game for the first time on a phone set to light mode
- **THEN** the appearance is System and the menus use the light look

#### Scenario: Phone switches at sunset
- **WHEN** Caro's appearance is System and the phone switches to dark mode while the lobby is open
- **THEN** the lobby switches to the dark look without a reload

#### Scenario: Forcing dark on a light phone
- **WHEN** Caro chooses Dark on a phone set to light mode
- **THEN** the menus use the dark look, and they still do after a reload

#### Scenario: Older saved settings
- **WHEN** Caro opens the game with sound settings saved before Appearance existed
- **THEN** Caro's volumes and reduced motion are kept and the appearance is System

### Requirement: Phases keep their palette
In-game screens (role reveal, night, dawn, day, vote, ghost, last words, end screen, narrator dashboard, and the
in-person deal, table and logbook) SHALL use their phase palette whatever the Appearance setting is.

#### Scenario: Light appearance at night
- **WHEN** Caro's appearance is Light and night falls
- **THEN** Caro's table uses the night palette

### Requirement: Fits small phones
Every screen SHALL fit a phone 320px wide without scrolling sideways, and every button, counter step and toggle SHALL
keep a touch target of at least 44px. On screens narrower than 420px:
- the desk screens (room setup, narrator lobby, admin) SHALL use phone spacing and smaller headings;
- a deck card SHALL show each role name whole, never broken inside a word, with its counter below the name;
- the room setup footer SHALL not cover the form: it SHALL scroll with the page, keep Cancel and Create on one row, and
  show its hint above them.

#### Scenario: Werewolf card on a small phone
- **WHEN** a narrator builds the deck on a phone 360px wide
- **THEN** the Werewolf card shows "Hombre lobo" without breaking a word, and its counter sits below the name

#### Scenario: Setup footer on a small phone
- **WHEN** a narrator scrolls the room setup on a phone 360px wide
- **THEN** the footer does not cover the deck, and Cancel and Create sit side by side

#### Scenario: Narrowest phone
- **WHEN** a player opens the home, join, public games, room setup or lobby screen on a phone 320px wide
- **THEN** the page does not scroll sideways and every control is at least 44px tall
