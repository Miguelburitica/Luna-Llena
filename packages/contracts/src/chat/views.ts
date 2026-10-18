import type { ChatChannel, MessageKind } from './vocabulary'

export interface ChatMessage {
  readonly id: string
  readonly channel: ChatChannel
  readonly kind: MessageKind
  readonly authorId: string
  readonly text: string
  readonly sentAt: number
}

export interface ChatAccess {
  readonly read: readonly ChatChannel[]
  readonly write: readonly ChatChannel[]
  readonly lastWordsUntil: number | null
  readonly villagePaused: boolean
}
