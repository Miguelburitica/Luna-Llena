import type { ChatChannel, ChatMessage, ReviewLabel, StrikeReason } from '@luna/contracts'
import type { ClientIdentity } from '../../../shared/domain/ClientIdentity'
import type { ChatLog } from '../domain/ChatLog'

export interface ChatLogRepository {
  find(code: string): Promise<ChatLog | undefined>
  save(log: ChatLog): Promise<void>
  remove(code: string): Promise<void>
}

export interface ChatPublisher {
  deliver(message: ChatMessage, recipientIds: readonly string[]): void
  cleared(message: ChatMessage, recipientIds: readonly string[]): void
  removed(messageId: string, recipientIds: readonly string[]): void
}

export interface ChatStrike {
  readonly client: ClientIdentity
  readonly reason: StrikeReason
  readonly roomCode: string
  readonly excerpt: string
}

export interface ChatModeration {
  isPublic(code: string): Promise<boolean>
  isMuted(code: string, memberId: string): Promise<boolean>
  bannedUntil(client: ClientIdentity, now: number): Promise<number | null>
  blockedByWordList(text: string): boolean
  review(code: string, text: string): Promise<ReviewLabel | null>
  strike(strike: ChatStrike): Promise<void>
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
