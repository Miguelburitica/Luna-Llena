## Purpose

Night actions give every living player a secret move during the night, and dawn turns those moves into the night's
deaths, so the village wakes up to consequences without the narrator doing the bookkeeping.

## ADDED Requirements

### Requirement: Who acts at night
During the night phase every living player SHALL have exactly one night action, chosen by their perceived role:
- Werewolf hunts.
- Seer inspects; the Drunk, who perceives the Seer, inspects too.
- Doctor protects.
- Witch uses potions.
- Villager, Hunter and Fool suspect.

Acting outside the night SHALL be rejected with error `not-night`. Dead players SHALL be rejected with `player-dead`.
An action that does not belong to the player's role SHALL be rejected with `not-your-action`. The narrator does not
act. Every action except the Seer's inspection MAY be changed until dawn.

#### Scenario: A villager at night
- **WHEN** Night 1 begins and Ana is a Villager
- **THEN** Ana is asked "Who do you suspect?"

#### Scenario: Acting during the day
- **WHEN** a Werewolf tries to hunt during the day
- **THEN** the system rejects it with error `not-night`

#### Scenario: The dead stay quiet
- **WHEN** a dead Doctor tries to protect someone
- **THEN** the system rejects it with error `player-dead`

#### Scenario: Wrong action
- **WHEN** a Villager tries to inspect a player
- **THEN** the system rejects it with error `not-your-action`

### Requirement: Valid targets
A target SHALL be a living player of the match; otherwise the action is rejected with `target-invalid`. Also rejected
with `target-invalid`:
- a Werewolf hunting a Werewolf;
- a Seer or Drunk inspecting themselves;
- a Witch poisoning themselves;
- a player suspecting themselves.

The Doctor and the Witch's heal MAY save themselves.

#### Scenario: Wolves cannot eat wolves
- **WHEN** Luis, a Werewolf, hunts Tato, the other Werewolf
- **THEN** the system rejects it with error `target-invalid`

#### Scenario: Targeting the dead
- **WHEN** the Seer inspects a dead player
- **THEN** the system rejects it with error `target-invalid`

### Requirement: The wolves' hunt
Each Werewolf SHALL pick one victim. Every Werewolf SHALL see the current picks of the whole pack. The pack's victim is
the player picked by the most Werewolves; on a tie, the victim is the tied player picked most recently. With no picks
there is no victim.

#### Scenario: The pack agrees
- **WHEN** Luis and Tato both pick Juan
- **THEN** both see the pack agrees on Juan and Juan is the pack's victim

#### Scenario: A split pack
- **WHEN** Luis picks Ana and then Tato picks Juan
- **THEN** Juan is the pack's victim

### Requirement: The Seer's vision
The Seer SHALL inspect one player per night. The inspection cannot be changed, and a second one the same night SHALL be
rejected with `already-inspected`. The Seer SHALL immediately and privately learn whether that player is a Werewolf,
judged on their true role. The Seer SHALL keep seeing their past visions for the rest of the game.

#### Scenario: A true vision
- **WHEN** Marta, the Seer, inspects Luis, a Werewolf
- **THEN** Marta sees "Luis is a Werewolf" and nobody else sees it

#### Scenario: Past visions
- **WHEN** Night 2 begins and Marta inspected Sofi on Night 1
- **THEN** Marta still sees "Night 1 · Sofi not a Werewolf"

#### Scenario: One peek per night
- **WHEN** Marta tries a second inspection on the same night
- **THEN** the system rejects it with error `already-inspected`

### Requirement: The Drunk's vision
The Drunk SHALL inspect exactly like the Seer and see the same screens. Their result is decided at random, with even
odds of Werewolf or not, at the moment of the inspection, and then kept. The narrator SHALL see that the result came from
the Drunk.

#### Scenario: A creative vision
- **WHEN** Caro, the Drunk, inspects Ana, a Villager
- **THEN** Caro sees a Werewolf or not-a-Werewolf result chosen at random, and the narrator sees Caro's result marked as a Drunk's vision

### Requirement: The Doctor's protection
The Doctor SHALL protect one living player per night. The player the Doctor protected the previous night is not
allowed (error `protected-last-night`), and the Doctor SHALL see which player that is and why. Protection only stops the
wolves' attack.

#### Scenario: Same patient twice
- **WHEN** the Doctor protected Ana on Night 1 and tries to protect Ana on Night 2
- **THEN** the system rejects it with error `protected-last-night`

#### Scenario: Protecting yourself
- **WHEN** the Doctor protects themselves
- **THEN** the protection is accepted

### Requirement: The Witch's potions
The Witch SHALL see the pack's current victim during the night. The Witch SHALL have one heal potion and one poison potion for
the whole game. Tonight the Witch MAY:
- choose to heal the pack's victim, while there is one;
- choose a poison target;
- choose both;
- choose to do nothing tonight.

Choosing a potion that is already spent SHALL be rejected with `potion-used`. A potion is spent only when dawn uses it.
The Witch SHALL be able to change or cancel these choices until dawn.

#### Scenario: The Witch sees the target
- **WHEN** the pack's victim is Juan
- **THEN** the Witch sees "The wolves are coming for… Juan"

#### Scenario: Heal already used
- **WHEN** the Witch healed on Night 1 and chooses to heal on Night 2
- **THEN** the system rejects it with error `potion-used`

#### Scenario: Nothing tonight
- **WHEN** the Witch chooses to do nothing tonight
- **THEN** both potions stay available and the narrator sees the Witch has acted

### Requirement: Decoy suspicions
Players whose role has no real night power SHALL pick a suspect. A suspicion has no effect on the game, but the
narrator SHALL see it, so watching who taps their screen gives nothing away.

#### Scenario: Naming a suspect
- **WHEN** Ana, a Villager, suspects Tato
- **THEN** Ana sees "You suspect Tato" and the narrator sees Ana suspects Tato

### Requirement: Narrator's night view
During the night the narrator SHALL see every living player's current action and result. The narrator SHALL also see
which living players have not acted yet, and a preview of the dawn outcome: the pack's victim, the protected player,
whether the Witch heals, the poison target, and who would die.

#### Scenario: Waiting on players
- **WHEN** everyone but Sofi and Pipe has acted
- **THEN** the narrator sees "Waiting on Sofi, Pipe"

#### Scenario: Dawn preview
- **WHEN** the pack picked Juan and the Doctor protected Pipe
- **THEN** the narrator's preview says Juan dies

### Requirement: Dawn resolution
When the narrator advances from night to dawn, the system SHALL resolve the night:
1. The pack's victim dies unless the Doctor protected them or the Witch healed them.
2. The Witch's poison target dies even if protected.
3. Each potion used tonight is spent.
4. The Doctor's patient becomes the one not allowed next night.

The deaths SHALL follow the existing alive and dead rules (reveal role on death, win detection). Every member SHALL see
who died at dawn, or that nobody died, until the next night begins. A night with no actions at all simply ends with
nobody dead.

#### Scenario: The wolves strike
- **WHEN** the pack's victim is Juan, nobody protected Juan and the Witch did not heal
- **THEN** at dawn Juan is dead and every member sees Juan didn't wake up

#### Scenario: Saved by the Doctor
- **WHEN** the pack's victim is Ana and the Doctor protected Ana
- **THEN** at dawn nobody died

#### Scenario: Saved by the Witch
- **WHEN** the pack's victim is Ana and the Witch chose to heal
- **THEN** at dawn nobody died and the Witch's heal potion is spent

#### Scenario: Poison and claws
- **WHEN** the pack's victim is Juan and the Witch poisons Luis
- **THEN** at dawn Juan and Luis are dead

#### Scenario: A quiet night
- **WHEN** nobody acted during the night
- **THEN** at dawn nobody died

#### Scenario: Dawn ends the game
- **WHEN** the Witch's poison kills the last Werewolf
- **THEN** the narrator is asked to end the game with the village as winner

### Requirement: Night screens
The web app SHALL show each living player a night dock during the night that fits their action:
- Wolves: a target picker with the pack's picks marked, and "Pack agrees on X" when the pack is unanimous.
- Seer and Drunk: a target picker, the vision card ("The crystal ball says…") and the list of past visions.
- Doctor: a target picker with last night's patient disabled and the reason shown.
- Witch: the wolves' target, the Heal and Poison buttons (spent ones disabled) and "Do nothing tonight".
- Everyone else: the decoy "Who do you suspect?" picker.

After acting, the dock SHALL show the choice and let the player change it while allowed. At dawn every member SHALL
see a death announcement with the tombstone, or the "Nobody died tonight!" card.

#### Scenario: Wolf dock
- **WHEN** Luis opens the game during the night
- **THEN** Luis sees the hunt picker without the other Werewolf as a target, and Tato's pick marked

#### Scenario: Nobody died
- **WHEN** dawn comes and nobody died
- **THEN** every member sees "Nobody died tonight!"
