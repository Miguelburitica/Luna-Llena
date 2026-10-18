## MODIFIED Requirements

### Requirement: Ghost screens
The web app SHALL show dead players a ghost dock while the game runs and ghost powers are on (canvas `Ghost`):
- "Haunt the living once per game" with Flicker and Whisper choices;
- for Whisper, a one-word input and a living-player picker with "Whisper “word” to Name";
- after use, "Your haunting power is spent".

A received flicker SHALL briefly flicker the whole screen. When the player prefers reduced motion, it SHALL show a
"A ghost flickered the lights" toast instead. A received whisper SHALL show as a ghost toast for a few seconds. The
narrator dashboard SHALL list every haunt of the game so far, with names, round and word, built from the narrator's
game view so that it survives a reload. Only new haunts SHALL raise a toast.

#### Scenario: Spent
- **WHEN** Juan used the haunt
- **THEN** Juan's ghost dock shows "Your haunting power is spent"

#### Scenario: Gentle flicker
- **WHEN** a flicker arrives and the player prefers reduced motion
- **THEN** the player sees the toast and no flashing

#### Scenario: Narrator reloads
- **WHEN** two ghosts already haunted and the narrator reloads the dashboard
- **THEN** the haunt feed still lists both haunts and no toast appears for them
