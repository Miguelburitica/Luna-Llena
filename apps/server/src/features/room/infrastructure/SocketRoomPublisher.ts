import type { RoomSnapshot } from '@luna/contracts'
import type { LunaServer } from '../../../shared/infrastructure/socketTypes'
import type { RoomPublisher } from '../application/ports'
import { memberChannel, roomChannel } from '../../../shared/infrastructure/socketChannels'

export class SocketRoomPublisher implements RoomPublisher {
  constructor(private readonly io: LunaServer) {}

  publish(snapshot: RoomSnapshot): void {
    this.io.to(roomChannel(snapshot.code)).emit('room:snapshot', snapshot)
  }

  notifyKicked(code: string, memberId: string): void {
    this.io.to(memberChannel(memberId)).emit('room:kicked')
    this.io.in(memberChannel(memberId)).socketsLeave([roomChannel(code), memberChannel(memberId)])
  }

  notifyClosed(code: string): void {
    this.io.to(roomChannel(code)).emit('room:closed')
    this.io.in(roomChannel(code)).socketsLeave(roomChannel(code))
  }
}
