import { ok, type Result, type RoomError, type RoomSummary } from '@luna/contracts'
import type { RoomRepository } from './ports'
import { findRoom } from './roomAccess'
import { toRoomSummary } from './roomViews'

export class LookUpRoom {
  constructor(private readonly rooms: RoomRepository) {}

  async execute(input: { readonly code?: unknown }): Promise<Result<RoomSummary, RoomError>> {
    const room = await findRoom(this.rooms, input.code)
    return room.ok ? ok(toRoomSummary(room.value)) : room
  }
}
