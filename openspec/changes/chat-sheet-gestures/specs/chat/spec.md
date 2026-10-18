## ADDED Requirements

### Requirement: Chat sheet motion
The chat sheet SHALL slide up from the bottom when it opens and slide down when it closes. A player SHALL be able to
drag the sheet down by its grabber or tab row: the sheet follows the finger, closes when released more than a third of
its height down or after a quick downward flick, and otherwise returns to fully open. Dragging the message list SHALL
scroll the messages, not move the sheet. Tapping the grabber SHALL still close the sheet. With reduced motion on, the
sheet SHALL open and close without sliding.

#### Scenario: Sheet slides open
- **WHEN** Luis taps the chat bar
- **THEN** the chat sheet slides up from the bottom of the screen

#### Scenario: Drag down to close
- **WHEN** Luis drags the grabber down by more than a third of the sheet's height and lets go
- **THEN** the sheet slides away and the chat bar is shown again

#### Scenario: Flick to close
- **WHEN** Luis flicks the tab row quickly downwards, even over a short distance
- **THEN** the sheet closes

#### Scenario: Short drag springs back
- **WHEN** Luis drags the grabber down a little, slowly, and lets go
- **THEN** the sheet returns to fully open with the same tab selected

#### Scenario: Reduced motion
- **WHEN** Luis has reduced motion on and opens or closes the chat
- **THEN** the sheet appears and disappears without sliding
