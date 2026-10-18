## ADDED Requirements

### Requirement: Slimy wordmark
The home screen SHALL show the "Luna Llena" wordmark as slime-green lettering with thick ink outlines and drips, above
a gross moon. The wordmark SHALL be announced to assistive technology as the heading "Luna Llena", and the moon as an
image.

#### Scenario: Opening the game
- **WHEN** a player opens the home screen
- **THEN** they see the dripping "Luna Llena" wordmark as the page heading and the gross moon above it

### Requirement: Sticker role cards with pun names
Every role in the catalog SHALL have a pun sticker name in English and in Spanish, unique within each language. A role
card face and a mini role card SHALL show the role's sticker name together with its plain role name, the role's art and
its team. A Drunk SHALL see the Seer's sticker name, because they are shown the Seer card.

| Role | English sticker | Spanish sticker |
|---|---|---|
| Werewolf | Wolfgang Drool | Lobo Baboso |
| Villager | Snotty Otto | Otto Mocoso |
| Seer | Goo-Eyed Gail | Clara Legañas |
| Doctor | Doc Wartson | Doctora Verrugas |
| Witch | Brewella Ooze | Bruja Burbuja |
| Hunter | Hank the Stank | Cazador Pecueca |
| Fool | Fly-Brain Freddy | Bufón Moscón |
| Drunk | Hiccup Hugo | Hipólito Hipo |

#### Scenario: The Seer's card
- **WHEN** a player dealt the Seer flips their card in English
- **THEN** the card shows "Goo-Eyed Gail" and "Seer"

#### Scenario: Spanish sticker
- **WHEN** the same card is shown in Spanish
- **THEN** it shows "Clara Legañas" and "Vidente"

#### Scenario: The Drunk's sticker
- **WHEN** Caro is dealt the Drunk and flips the card
- **THEN** the card shows the Seer's sticker name, not "Hiccup Hugo"

#### Scenario: Every role has a sticker
- **WHEN** the role catalog is listed in either language
- **THEN** every role has a sticker name and no two roles share one

### Requirement: Gross cast
Every player avatar and every role SHALL have its own sticker illustration in the gross cartoon style: thick ink
outline, a white sticker edge, and at least one party-safe gross detail (slime, drool, snot, warts, stink lines, flies
or a wonky eye). The tombstone, ghost, rooster, card back and phase scenes SHALL use the same style.

#### Scenario: A full table
- **WHEN** ten players pick the ten avatars
- **THEN** each seat shows its own outlined sticker face

#### Scenario: Every role has art
- **WHEN** any role card is shown
- **THEN** it shows that role's sticker illustration

### Requirement: Readable phases
Each phase (night, dawn, day, vote, ghost) SHALL keep its own palette. In every phase, body text SHALL have a contrast
ratio of at least 4.5:1 against both ends of the phase background, and the label on a primary button SHALL have a
contrast ratio of at least 4.5:1 against the button.

#### Scenario: Night text
- **WHEN** a player reads the table at night
- **THEN** the text has at least 4.5:1 contrast against the night background

#### Scenario: Day button
- **WHEN** a player looks at a primary button during the day
- **THEN** its label has at least 4.5:1 contrast against the button colour

### Requirement: Reduced motion
When the device asks for reduced motion, or the player turns on reduced motion in settings, the sticker look SHALL
not animate: no dripping, wobbling, bobbing or flicker.

#### Scenario: Reduced motion
- **WHEN** a player with reduced motion turned on opens the home screen
- **THEN** the wordmark drips and the moon stay still

### Requirement: Party-safe and original
Sticker names and art SHALL stay party-safe: no vomit, body-hair or nudity gags. Names, logo and card frame SHALL be
original, with no third-party trading-card brand, character or name.

#### Scenario: Clean names
- **WHEN** the sticker names are listed in both languages
- **THEN** none mentions vomit, barf, puke, armpits or body hair
