import type { Result } from '../result'
import type { ChatMessage } from './views'
import type { ChatChannel, ChatError } from './vocabulary'

export type ChatAck<T> = (result: Result<T, ChatError>) => void

export interface ChatClientEvents {
  'chat:send': (input: { readonly channel: ChatChannel; readonly text: string }, ack: ChatAck<ChatMessage>) => void
  'chat:history': (input: Record<string, never>, ack: ChatAck<readonly ChatMessage[]>) => void
}

export interface ChatServerEvents {
  'chat:message': (message: ChatMessage) => void
}
