export const CHAT_CHANNELS = ['village', 'wolves', 'ghosts'] as const
export type ChatChannel = (typeof CHAT_CHANNELS)[number]

export const MESSAGE_KINDS = ['player', 'narrator', 'last-words'] as const
export type MessageKind = (typeof MESSAGE_KINDS)[number]

export const CHAT_LIMITS = {
  maxMessageLength: 280,
  historyPerChannel: 200,
  lastWordsSeconds: 15
} as const

export const CHAT_ERROR_CODES = [
  'chat-not-open',
  'session-invalid',
  'chat-closed',
  'chat-forbidden',
  'message-invalid'
] as const
export type ChatErrorCode = (typeof CHAT_ERROR_CODES)[number]

export interface ChatError {
  readonly code: ChatErrorCode
}

export const chatError = (code: ChatErrorCode): ChatError => ({ code })
