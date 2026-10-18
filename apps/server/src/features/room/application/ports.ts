import type { RoomSnapshot } from '@luna/contracts'
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
