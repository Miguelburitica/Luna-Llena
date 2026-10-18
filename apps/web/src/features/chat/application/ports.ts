import type { ChatChannel, ChatError, ChatMessage, Result } from '@luna/contracts'
import type { InjectionKey } from 'vue'

export type ChatFailure = ChatError | { readonly code: 'unreachable' }

export type ChatResult<T> = Promise<Result<T, ChatFailure>>

export interface ChatGateway {
  history(): ChatResult<readonly ChatMessage[]>
  send(channel: ChatChannel, text: string): ChatResult<ChatMessage>
  onMessage(listener: (message: ChatMessage) => void): void
  onReconnected(listener: () => void): void
}

export const CHAT_GATEWAY: InjectionKey<ChatGateway> = Symbol('ChatGateway')
