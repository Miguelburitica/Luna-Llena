## MODIFIED Requirements

### Requirement: Timeline
The match SHALL record a timeline entry for each of these moments, in order:
- Every night resolved at dawn: the pack's victim, the protected player, whether the Witch healed, the poison target,
  every vision (who looked at whom, the result, and whether it came from the Drunk), and the deaths.
- Every vote resolved at execution: the full verdict, including who voted for whom even when votes were anonymous.
- Every Hunter shot, taken or skipped.
- Every manual kill or revive by the narrator.
- Every ghost haunt: the ghost, the power used, and for a whisper the word and its target.

The timeline SHALL be sent to members only once the game is over.

#### Scenario: Story of a night
- **WHEN** on Night 1 the wolves targeted Ana, the Doctor protected Ana and the Seer inspected Sofi
- **THEN** the end-of-game timeline has a Night 1 entry with those facts and no deaths

#### Scenario: Secrets stay secret until the end
- **WHEN** the game is still running
- **THEN** no member's view contains the timeline

#### Scenario: Anonymous votes revealed at last
- **WHEN** votes were anonymous during the game
- **THEN** the end-of-game timeline shows who voted for whom

#### Scenario: The ghost's secret
- **WHEN** Juan's ghost whispered "bakery" to Marta on Night 3
- **THEN** the end-of-game timeline shows Juan's ghost whispered "bakery" to Marta in Night 3
