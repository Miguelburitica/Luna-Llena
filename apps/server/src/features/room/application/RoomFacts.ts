import type { RoomRepository } from './ports'
import { findRoom } from './roomAccess'

export class RoomFacts {
  constructor(private readonly rooms: RoomRepository) {}

  async isMuted(code: string, memberId: string): Promise<boolean> {
    const room = await findRoom(this.rooms, code)
    return room.ok && room.value.isMuted(memberId)
  }

  async isPublic(code: string): Promise<boolean> {
    const room = await findRoom(this.rooms, code)
    return room.ok && room.value.isPublic
  }
}
