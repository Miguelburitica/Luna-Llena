import type { RoomRepository } from '../application/ports'
import type { Room } from '../domain/Room'
import type { RoomCode } from '../domain/RoomCode'

export class InMemoryRoomRepository implements RoomRepository {
  private readonly rooms = new Map<string, Room>()

  async find(code: RoomCode): Promise<Room | undefined> {
    return this.rooms.get(code.value)
  }

  async all(): Promise<readonly Room[]> {
    return [...this.rooms.values()]
  }

  async save(room: Room): Promise<void> {
    this.rooms.set(room.code.value, room)
  }

  async remove(code: RoomCode): Promise<void> {
    this.rooms.delete(code.value)
  }
}
