import { chatMessages } from '@/features/chat/infrastructure/i18n/chatMessages'
import { matchMessages } from '@/features/match/infrastructure/i18n/matchMessages'
import { roomMessages } from '@/features/room/infrastructure/i18n/roomMessages'
import type { Messages } from '@/shared/infrastructure/i18n/lunaI18n'
import { sharedMessages } from '@/shared/infrastructure/i18n/sharedMessages'

export const lunaMessages: Messages = {
  en: { ...sharedMessages.en, room: roomMessages.en, match: matchMessages.en, chat: chatMessages.en },
  es: { ...sharedMessages.es, room: roomMessages.es, match: matchMessages.es, chat: chatMessages.es }
}
