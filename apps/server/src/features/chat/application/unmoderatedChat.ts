import type { ChatModeration } from './ports'

export const UNMODERATED_CHAT: ChatModeration = {
  isPublic: async () => false,
  isMuted: async () => false,
  bannedUntil: async () => null,
  blockedByWordList: () => false,
  review: async () => null,
  strike: async () => undefined
}
