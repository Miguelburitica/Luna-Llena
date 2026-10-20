import type { Abandonment } from '../domain/Room'
import { closeRoom, type RoomAccess } from './roomAccess'

export class SweepRooms {
  constructor(private readonly access: RoomAccess) {}

  async execute(): Promise<Array<{ readonly code: string; readonly reason: Abandonment }>> {
    const now = this.access.clock.now()
    const closed: Array<{ readonly code: string; readonly reason: Abandonment }> = []
    for (const room of await this.access.rooms.all()) {
      const reason = room.abandonment(now)
      if (reason === null) continue
      await closeRoom(this.access, room)
      closed.push({ code: room.code.value, reason })
    }
    return closed
  }
}
