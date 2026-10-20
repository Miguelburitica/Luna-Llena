import { done, type Result, type RoomError } from '@luna/contracts'
import { UNKNOWN_CLIENT, type ClientIdentity } from '../../../shared/domain/ClientIdentity'
import { findRoom, requireNotBanned, type RoomAccess } from './roomAccess'

export class ReportRoom {
  constructor(private readonly access: RoomAccess) {}

  async execute(input: { readonly code?: unknown }, client: ClientIdentity = UNKNOWN_CLIENT): Promise<Result<void, RoomError>> {
    const { gate, rooms, lobby } = this.access
    const banned = await requireNotBanned(gate, client)
    if (!banned.ok) return banned
    const room = await findRoom(rooms, input.code)
    if (!room.ok) return room
    const counted = room.value.reportCount
    const hidden = room.value.report(client.address)
    if (!hidden.ok) return hidden
    if (room.value.reportCount === counted) return done
    await rooms.save(room.value)
    await gate.noteReport({ roomCode: room.value.code.value, roomName: room.value.name.value, address: client.address })
    if (hidden.value) {
      lobby.changed()
      const creator = room.value.openedBy
      if (creator !== null) await gate.strike({ client: creator, reason: 'room-hidden', roomCode: room.value.code.value, excerpt: room.value.name.value })
    }
    return done
  }
}
