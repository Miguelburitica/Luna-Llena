import type { ContentGate } from './ports'

export const OPEN_GATE: ContentGate = {
  bannedUntil: async () => null,
  review: async () => null,
  strike: async () => undefined,
  noteReport: async () => undefined
}
