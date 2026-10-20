import { ok, type Result, type RoomError, type RoomSession } from '@luna/contracts'
import type { IdGenerator } from '../../../shared/application/IdGenerator'
import { UNKNOWN_CLIENT, type ClientIdentity } from '../../../shared/domain/ClientIdentity'
import { DisplayName } from '../domain/DisplayName'
import { findRoom, requireNotBanned, reviewPublicName, saveAndPublish, type RoomAccess } from './roomAccess'
import { toRoomSession } from './roomViews'

export class JoinRoom {
  constructor(
    private readonly access: RoomAccess,
    private readonly ids: IdGenerator
  ) {}

  async execute(
    input: { readonly code?: unknown; readonly name?: unknown },
    client: ClientIdentity = UNKNOWN_CLIENT
  ): Promise<Result<RoomSession, RoomError>> {
    const banned = await requireNotBanned(this.access.gate, client)
    if (!banned.ok) return banned
    const room = await findRoom(this.access.rooms, input.code)
    if (!room.ok) return room
    const name = DisplayName.create(input.name)
    if (!name.ok) return name
    if (room.value.isPublic) {
      const reviewed = await reviewPublicName(this.access.gate, {
        roomCode: room.value.code.value,
        text: name.value.value,
        kind: 'name',
        client
      })
      if (!reviewed.ok) return reviewed
    }
    const member = room.value.join({ id: this.ids.next(), token: this.ids.next(), name: name.value, client })
    if (!member.ok) return member
    await saveAndPublish(this.access, room.value)
    return ok(toRoomSession(room.value, member.value))
  }
}
