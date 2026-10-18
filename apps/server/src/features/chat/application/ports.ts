import type { ChatChannel, ChatMessage } from '@luna/contracts'
import type { ChatLog } from '../domain/ChatLog'

export interface ChatLogRepository {
  find(code: string): Promise<ChatLog | undefined>
  save(log: ChatLog): Promise<void>
}

export interface ChatPublisher {
  deliver(message: ChatMessage, recipientIds: readonly string[]): void
}

export interface MemberChatPermissions {
  readonly read: readonly ChatChannel[]
  readonly write: readonly ChatChannel[]
  readonly closed: readonly ChatChannel[]
  readonly lastWordsUntil: number | null
}

export interface ChatAudienceDescription {
  readonly narratorId: string
  readonly members: ReadonlyMap<string, MemberChatPermissions>
}

export interface ChatAudience {
  membersOf(code: string, now: number): Promise<ChatAudienceDescription | undefined>
  lastWordsSpoken(code: string, memberId: string, now: number): Promise<void>
}

export interface Actor {
  readonly code: string
  readonly memberId: string
}
