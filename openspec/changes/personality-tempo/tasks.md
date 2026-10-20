## 1. Server domain

- [x] 1.1 Add `bots/domain/tempo.ts` and `bots/domain/ChatFloor.ts`, and give `BotTable` a floor; test the floor in `domain/bots.test.ts`
- [x] 1.2 Move Spanish slang into the `chaos` and `paranoid` voices and add the first-word rule; test "Slang by voice"
- [x] 1.3 Add `seconding` to the wolf-plan intent and its intent line; test "Wolves agree in new words"
- [x] 1.4 Add `room/domain/botPersonality.ts` with the weighted surprise pick; test "Surprise me spreads the table" in `room/domain/Room.test.ts`

## 2. Server application

- [x] 2.1 Read odds and delays from the tempo in `botTurns.ts`; test "Fast and slow" in `bots/domain/bots.test.ts`
- [x] 2.2 Make `speak` take turns per chat, with human answers skipping the queue; test "One at a time"
- [x] 2.3 Cap dawn reactions and make followers wait; tests "Two reactions per dawn" and "Followers follow"
- [x] 2.4 Resolve the surprise personality from the room's bots in `AddBot`; extend `room/application/bots.test.ts`

## 3. Verification

- [x] 3.1 Run `pnpm check` green
