import type { RoleId, RoomSnapshot, TimerPhase } from '@luna/contracts'
import type { Room } from '../domain/Room'
import type { RoomCode } from '../domain/RoomCode'

export interface RoomRepository {
  find(code: RoomCode): Promise<Room | undefined>
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
}

export interface GameStarter {
  start(opening: GameOpening): Promise<void>
}
