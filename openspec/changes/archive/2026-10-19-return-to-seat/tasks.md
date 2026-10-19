## 1. Web application

- [x] 1.1 Add a reactive `savedSeat` (loaded from the session store, set in `enter`, cleared in `forget`) and `returnToSeat` to `useRoomStore`; test in `useRoomStore.test.ts` that it starts from storage, that a rejected return clears it ("Seat is gone"), that an unreachable return keeps it, and that leaving clears it ("Left on purpose")

## 2. Web infrastructure

- [x] 2.1 Add en and es copy to `roomMessages.ts` for the home offer, the join offer and its button; verify the i18n key-parity test passes
- [x] 2.2 Show the return offer on `HomeView` and route to the lobby on success; add `HomeView.test.ts` covering "Home page remembers the seat", "Seat is gone" and "Left on purpose" (no offer without a saved seat)
- [x] 2.3 Show the return offer on `JoinView` when the entered code matches the saved seat, replacing the closed notice and name form; extend `JoinView.test.ts` with "Back out mid-game" (in-game summary plus saved seat leads to the game route) and "Another room"

## 3. Verification

- [x] 3.1 Run `pnpm check` green
- [x] 3.2 In the browser at phone width: start a game, press back from the game to the join page, return to the seat and land in the game with the same role
