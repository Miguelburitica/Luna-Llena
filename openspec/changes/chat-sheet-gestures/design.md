## Context

`ChatSheet.vue` renders a `section.sheet` with `v-if="chat.open"`. The grabber button calls `chat.closeSheet()`. The
design system already disables every transition under `@media (prefers-reduced-motion: reduce)` and under the
`.reduced` root class that the atmosphere settings apply. A CSS transition therefore gets reduced motion for free.
Screen: `design/canvas/DayChat.dc.html`, which keeps the `sheet`, `grabber` and `tabs` markup.

## Goals / Non-Goals

**Goals:**
- Keep `chat.open` as the single source of truth. Dragging ends by calling `closeSheet()`, so unread counts and the
  chat bar keep working.
- Put the release rule in pure domain code so it is unit-tested without a DOM.

**Non-Goals:**
- A gesture library. Pointer events are enough for one vertical drag.

## Decisions

- **Release rule in `chat/domain/sheetDrag.ts`.** `sheetReleaseOf({ offset, height, velocity })` returns `'close'` when
  `offset > height / 3`, or when `velocity >= 0.5` px/ms and `offset >= 24` px. Otherwise it returns `'stay'`. Negative
  offsets clamp to 0, so the sheet never lifts above its open position. The constants live next to the rule. They are
  UI tuning, not shared vocabulary.
- **Drag handle is a header wrapper.** The grabber and the tab row are wrapped in a `chat-sheet-handle` element with
  `touch-action: none` that owns the pointer listeners (`pointerdown` with `setPointerCapture`, `pointermove`,
  `pointerup`, `pointercancel`). The message list keeps native scroll. A pointer that moves less than 6 px is treated as
  a tap, so the grabber's click and tab clicks still work.
- **Following the finger.** While dragging, the sheet gets an inline `transform: translateY(<offset>px)` and an
  `is-dragging` class that turns off its transition. On `'stay'` the offset resets to 0 and the transition animates the
  spring back. On `'close'` the component calls `closeSheet()`, and the leave transition starts from the current
  offset.
- **Open and close motion.** The `section` is wrapped in `<Transition name="chat-sheet">`, with
  `transform: translateY(100%)` on enter-from and leave-to, over 280ms `cubic-bezier(.2,.8,.2,1)`. The existing global
  reduced-motion rules remove the slide.
- **Velocity.** Velocity is measured from the last two `pointermove` samples, which is enough to tell a flick from a
  slow drag.

## Risks / Trade-offs

- [jsdom has no layout, so `height` is 0 in tests] → component tests stub the element's `getBoundingClientRect`. The
  thresholds themselves are covered by the domain unit tests.
- [Some browsers fire `pointercancel` when a scroll starts] → `touch-action: none` on the handle prevents this, and
  `pointercancel` resets to open.
