import type { AdminRoomView } from '@luna/contracts'
import type { RoomRepository } from './ports'
import { closeRoom, findRoom, type RoomAccess } from './roomAccess'

export class AdminRooms {
  constructor(
    private readonly rooms: RoomRepository,
    private readonly access: RoomAccess
  ) {}

  async list(): Promise<AdminRoomView[]> {
    return (await this.rooms.all()).map((room) => ({
      code: room.code.value,
      name: room.name.value,
      narratorName: room.narrator.name.value,
      visibility: room.visibility,
      status: room.status,
      playerCount: room.players.length,
      reports: room.reportCount,
      hidden: room.isHidden
    }))
  }

  async close(code: string): Promise<boolean> {
    const room = await findRoom(this.rooms, code)
    if (!room.ok) return false
    await closeRoom(this.access, room.value)
    return true
  }
}
