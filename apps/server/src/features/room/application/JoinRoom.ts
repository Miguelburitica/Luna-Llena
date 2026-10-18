import { ok, type Result, type RoomError, type RoomSession } from '@luna/contracts'
import type { IdGenerator } from '../../../shared/application/IdGenerator'
import { DisplayName } from '../domain/DisplayName'
import { findRoom, saveAndPublish, type RoomAccess } from './roomAccess'
import { toRoomSession } from './roomViews'

export class JoinRoom {
  constructor(
    private readonly access: RoomAccess,
    private readonly ids: IdGenerator
  ) {}

  async execute(input: { readonly code?: unknown; readonly name?: unknown }): Promise<Result<RoomSession, RoomError>> {
    const room = await findRoom(this.access.rooms, input.code)
    if (!room.ok) return room
    const name = DisplayName.create(input.name)
    if (!name.ok) return name
    const member = room.value.join({ id: this.ids.next(), token: this.ids.next(), name: name.value })
    if (!member.ok) return member
    await saveAndPublish(this.access, room.value)
    return ok(toRoomSession(room.value, member.value))
  }
}
