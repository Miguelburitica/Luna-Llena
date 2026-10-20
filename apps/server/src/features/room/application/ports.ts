import type { ReviewLabel, RoleId, RoomSnapshot, SeatTakeover, StrikeReason, TimerPhase } from '@luna/contracts'
import type { ClientIdentity } from '../../../shared/domain/ClientIdentity'
import type { Room } from '../domain/Room'
import type { RoomCode } from '../domain/RoomCode'

export interface RoomRepository {
  find(code: RoomCode): Promise<Room | undefined>
  all(): Promise<readonly Room[]>
  save(room: Room): Promise<void>
  remove(code: RoomCode): Promise<void>
}

export interface RoomCodeGenerator {
  next(): RoomCode
}

export interface RoomPublisher {
  publish(snapshot: RoomSnapshot): void
  notifyKicked(code: string, memberId: string): void
  notifyClosed(code: string): void
  notifySeatTakenOver(code: string, takeover: SeatTakeover): void
}

export interface LobbyNotifier {
  changed(): void
}

export type ReviewedName = 'name' | 'room-name'

export interface RoomStrike {
  readonly client: ClientIdentity
  readonly reason: StrikeReason
  readonly roomCode: string
  readonly excerpt: string | null
}

export interface ContentGate {
  bannedUntil(client: ClientIdentity): Promise<number | null>
  review(roomCode: string, text: string, kind: ReviewedName): Promise<'blocked' | ReviewLabel | null>
  strike(strike: RoomStrike): Promise<void>
  noteReport(report: { readonly roomCode: string; readonly roomName: string; readonly address: string }): Promise<void>
}

export interface Actor {
  readonly code: string
  readonly memberId: string
}

export interface GameOpening {
  readonly code: string
  readonly narratorId: string
  readonly playerIds: readonly string[]
  readonly deck: Readonly<Record<RoleId, number>>
  readonly timers: Readonly<Record<TimerPhase, number>>
  readonly revealRoleOnDeath: boolean
  readonly anonymousVotes: boolean
  readonly lastWords: boolean
  readonly ghostPowers: boolean
}

export interface GameStarter {
  start(opening: GameOpening): Promise<void>
  isOver(code: string): Promise<boolean>
  discard(code: string): Promise<void>
  handOver(code: string): Promise<void>
}
