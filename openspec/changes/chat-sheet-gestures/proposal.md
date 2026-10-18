## Why

On phones, the chat sheet pops in and out with no motion, and the only way to close it is to tap the small grabber.
Players expect to drag a bottom sheet down to dismiss it, the way native apps work.

## What Changes

- **Motion:** the chat sheet slides up from the bottom when it opens and slides down when it closes.
- **Drag to close:** dragging the sheet's grabber or tab row downwards moves the sheet with the finger. Releasing past
  a third of the sheet's height, or with a quick downward flick, closes it. Otherwise the sheet springs back.
- **Tap still works:** tapping the grabber still closes the sheet.
- **Reduced motion:** with reduced motion on (system setting or the in-game setting), the sheet opens and closes without
  sliding. Dragging still works.

## Capabilities

### New Capabilities

### Modified Capabilities
- `chat`: adds sheet motion and drag-to-close to the chat screens.

## Impact

- Server and contracts: none.
- Web, `features/chat`:
  - new `domain/sheetDrag.ts`: a pure release rule, close or stay;
  - `infrastructure/components/ChatSheet.vue`: transition, pointer handling and styles.

## Non-goals

- Dragging the sheet up to resize it, or snap points other than open and closed.
- A dimmed backdrop or tap-outside-to-close.
- The narrator's chat monitor, which is not a sheet.
