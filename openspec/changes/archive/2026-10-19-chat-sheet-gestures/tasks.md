## 1. Web domain

- [x] 1.1 Add `sheetReleaseOf` in `chat/domain/sheetDrag.ts` with `sheetDrag.test.ts` covering "Drag down to close" (past a third), "Flick to close" (fast and short), "Short drag springs back" (slow and short) and upward offsets clamping to stay

## 2. Web infrastructure

- [x] 2.1 Wrap the sheet in a `chat-sheet` transition with slide styles; extend `ChatSheet.test.ts` with "Sheet slides open" (the transition is applied) and "Reduced motion" (the sheet's transition is removed under the `.reduced` root class, asserted on the stylesheet rule)
- [x] 2.2 Add the drag handle around the grabber and tabs with pointer handling, a live transform and spring back; extend `ChatSheet.test.ts` with pointer-event tests for "Drag down to close", "Flick to close", "Short drag springs back" (the tab is unchanged) and that tapping the grabber still closes

## 3. Verification

- [x] 3.1 Run `pnpm check` green
- [x] 3.2 In the browser at phone width: open the chat and see it slide up, drag it halfway down and release to close it, drag it a little and see it spring back, and scroll the message list without moving the sheet
