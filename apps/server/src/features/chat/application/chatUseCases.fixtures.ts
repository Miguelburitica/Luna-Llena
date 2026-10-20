import type { ChatMessage, ReviewLabel, Result } from '@luna/contracts'
import type { ClientIdentity } from '../../../shared/domain/ClientIdentity'
import { FixedClock } from '../../../shared/application/clockAndRandom.fixtures'
import { InMemoryChatLogRepository } from '../infrastructure/InMemoryChatLogRepository'
import { createChatUseCases } from './chatUseCases'
import type {
  Actor,
  ChatAudience,
  ChatAudienceDescription,
  ChatModeration,
  ChatPublisher,
  ChatStrike,
  MemberChatPermissions
} from './ports'

export const CODE = 'LUNA42'
export const CHAT_START_TIME = 5_000_000

export const NARRATOR = 'nico'
export const LUIS = 'luis'
export const TATO = 'tato'
export const CARO = 'caro'
export const PIPE = 'pipe'
export const ANA = 'ana'
export const JUAN = 'juan'

export const EVERYONE = [NARRATOR, LUIS, TATO, CARO, PIPE, ANA, JUAN]

export const unwrap = <T>(result: Result<T, unknown>): T => {
  if (!result.ok) throw new Error(`Expected success, got ${JSON.stringify(result.error)}`)
  return result.value
}

const NOTHING = { lastWordsUntil: null } as const

export const PERMISSIONS = {
  narrator: { read: ['village', 'wolves', 'ghosts'], write: ['village'], closed: [], ...NOTHING },
  villagerByDay: { read: ['village'], write: ['village'], closed: [], ...NOTHING },
  villagerAtNight: { read: ['village'], write: [], closed: ['village'], ...NOTHING },
  villagerWhilePaused: { read: ['village'], write: [], closed: ['village'], ...NOTHING },
  wolfAtNight: { read: ['village', 'wolves'], write: ['wolves'], closed: ['village'], ...NOTHING },
  wolfByDay: { read: ['village', 'wolves'], write: ['village'], closed: ['wolves'], ...NOTHING },
  ghost: { read: ['village', 'ghosts'], write: ['ghosts'], closed: [], ...NOTHING },
  speaker: (until: number) => ({ read: ['village', 'ghosts'], write: ['village', 'ghosts'], closed: [], lastWordsUntil: until })
} as const satisfies Record<string, MemberChatPermissions | ((until: number) => MemberChatPermissions)>

export class FakeChatAudience implements ChatAudience {
  readonly spoken: Array<{ code: string; memberId: string; now: number }> = []
  private members = new Map<string, MemberChatPermissions>()
  private open = true

  set(roster: Readonly<Record<string, MemberChatPermissions>>): void {
    this.members = new Map(Object.entries(roster))
  }

  update(memberId: string, permissions: MemberChatPermissions): void {
    this.members.set(memberId, permissions)
  }

  closeMatch(): void {
    this.open = false
  }

  async membersOf(): Promise<ChatAudienceDescription | undefined> {
    return this.open ? { narratorId: NARRATOR, members: this.members } : undefined
  }

  async lastWordsSpoken(code: string, memberId: string, now: number): Promise<void> {
    this.spoken.push({ code, memberId, now })
    this.members.set(memberId, PERMISSIONS.ghost)
  }
}

export class RecordingChatPublisher implements ChatPublisher {
  readonly deliveries: Array<{ message: ChatMessage; recipientIds: readonly string[] }> = []

  readonly clearedIds: string[] = []
  readonly removedIds: string[] = []

  deliver(message: ChatMessage, recipientIds: readonly string[]): void {
    this.deliveries.push({ message, recipientIds })
  }

  cleared(message: ChatMessage): void {
    this.clearedIds.push(message.id)
  }

  removed(messageId: string): void {
    this.removedIds.push(messageId)
  }

  get latest(): { message: ChatMessage; recipientIds: readonly string[] } {
    const latest = this.deliveries.at(-1)
    if (latest === undefined) throw new Error('Nothing was delivered')
    return latest
  }
}

export const TATO_CLIENT: ClientIdentity = { address: '10.0.0.7', device: 'device-tato' }

export class FakeChatModeration implements ChatModeration {
  publicRoom = true
  readonly muted = new Set<string>()
  bannedUntilValue: number | null = null
  label: ReviewLabel | null = 'ok'
  readonly strikes: ChatStrike[] = []
  readonly reviewed: string[] = []

  async isPublic(): Promise<boolean> {
    return this.publicRoom
  }

  async isMuted(_code: string, memberId: string): Promise<boolean> {
    return this.muted.has(memberId)
  }

  async bannedUntil(): Promise<number | null> {
    return this.bannedUntilValue
  }

  blockedByWordList(text: string): boolean {
    return text.includes('put4')
  }

  async review(_code: string, text: string): Promise<ReviewLabel | null> {
    this.reviewed.push(text)
    return this.label
  }

  async strike(strike: ChatStrike): Promise<void> {
    this.strikes.push(strike)
  }
}

export const NIGHT_ROSTER: Readonly<Record<string, MemberChatPermissions>> = {
  [NARRATOR]: PERMISSIONS.narrator,
  [LUIS]: PERMISSIONS.wolfAtNight,
  [TATO]: PERMISSIONS.wolfAtNight,
  [CARO]: PERMISSIONS.villagerAtNight,
  [PIPE]: PERMISSIONS.villagerAtNight,
  [ANA]: PERMISSIONS.ghost,
  [JUAN]: PERMISSIONS.ghost
}

export const DAY_ROSTER: Readonly<Record<string, MemberChatPermissions>> = {
  [NARRATOR]: PERMISSIONS.narrator,
  [LUIS]: PERMISSIONS.wolfByDay,
  [TATO]: PERMISSIONS.wolfByDay,
  [CARO]: PERMISSIONS.villagerByDay,
  [PIPE]: PERMISSIONS.villagerByDay,
  [ANA]: PERMISSIONS.ghost,
  [JUAN]: PERMISSIONS.ghost
}

export const createChatKit = (
  roster: Readonly<Record<string, MemberChatPermissions>> = DAY_ROSTER,
  moderation?: ChatModeration
) => {
  let idSequence = 0
  const logs = new InMemoryChatLogRepository()
  const publisher = new RecordingChatPublisher()
  const audience = new FakeChatAudience()
  audience.set(roster)
  const clock = new FixedClock(CHAT_START_TIME)
  const useCases = createChatUseCases({
    logs,
    publisher,
    audience,
    clock,
    ids: { next: () => `message-${String((idSequence += 1)).padStart(3, '0')}` },
    ...(moderation === undefined ? {} : { moderation })
  })
  const actorOf = (memberId: string): Actor => ({ code: CODE, memberId })
  const say = (memberId: string, channel: unknown, text: unknown, client?: ClientIdentity) =>
    useCases.sendMessage.execute(actorOf(memberId), { channel, text }, client)
  const reviewsDone = () => Promise.all(useCases.sendMessage.reviews)
  return { useCases, logs, publisher, audience, clock, actorOf, say, reviewsDone }
}
