## 1. Contracts

- [x] 1.1 Add `nightAction` to the role catalog, and the night input, views, errors and the `match:act` event; verify with `tsc` in packages/contracts

## 2. Server match domain

- [x] 2.1 Add `Night`, `packVictimOf` and `resolveDawn`; test "The pack agrees", "A split pack", and every Dawn resolution scenario ("The wolves strike", "Saved by the Doctor", "Saved by the Witch", "Poison and claws", "A quiet night")
- [x] 2.2 Add `Match.act` and the dawn transition in `Match.advance`; test "Acting during the day", "The dead stay quiet", "Wrong action", "Wolves cannot eat wolves", "Targeting the dead", "One peek per night", "Same patient twice", "Protecting yourself", "Heal already used", "Nothing tonight", "Dawn ends the game", and the Drunk's random result with a seeded source

## 3. Server match application and infrastructure

- [x] 3.1 Extend `matchViews` (the player night views, visions, the narrator night view with `waitingOn` and `preview`, and `dawn`) and add `ActAtNight`; test "A villager at night", "A true vision" (nobody else sees it), "Past visions", "A creative vision", "The Witch sees the target", "Naming a suspect", "Waiting on players" and "Dawn preview"
- [x] 3.2 Handle `match:act` in `registerMatchHandlers`; extend the socket integration test with a full night (hunt, protect, inspect, potions, suspect), then advance to dawn and check the deaths and the dawn report each member receives

## 4. Web match feature

- [x] 4.1 Add `domain/night.ts` (`targetsFor`, `packAgreement`, `deathsAnnouncement`) with unit tests, and add `act` to the store with store tests
- [x] 4.2 Add `NightDock` with the five docks and `DawnAnnouncement` following the canvas, wire them into `PlayerTable`, and add the action lines and the dawn panel to `NarratorDashboard`; add component tests for "Wolf dock", the Seer's vision and past visions, the Doctor's disabled patient with its reason, the Witch's potions and "Do nothing tonight", the decoy pick, "Nobody died", the death announcement, and the narrator's "Waiting on" and preview

## 5. Verification

- [x] 5.1 Run `pnpm check` green
- [x] 5.2 Play a night in the browser with bots acting through sockets: wolves hunt, the Doctor saves or misses, the Witch acts; at dawn check the announcement on a player tab and the narrator preview
