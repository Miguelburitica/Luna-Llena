import { roomMessages } from '@/features/room/infrastructure/i18n/roomMessages'
import type { Messages } from '@/shared/infrastructure/i18n/lunaI18n'
import { sharedMessages } from '@/shared/infrastructure/i18n/sharedMessages'

export const lunaMessages: Messages = {
  en: { ...sharedMessages.en, room: roomMessages.en },
  es: { ...sharedMessages.es, room: roomMessages.es }
}
