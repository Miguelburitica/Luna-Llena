import { err, ok, roomError, type Result, type RoomError, type RoomSession } from '@luna/contracts'
import { findRoom, saveAndPublish, type RoomAccess } from './roomAccess'
import { toRoomSession } from './roomViews'

export class ResumeSession {
  constructor(private readonly access: RoomAccess) {}

  async execute(input: { readonly code?: unknown; readonly token?: unknown }): Promise<Result<RoomSession, RoomError>> {
    const room = await findRoom(this.access.rooms, input.code)
    if (!room.ok) return err(roomError('session-invalid'))
    const member = room.value.resume(input.token)
    if (!member.ok) return member
    await saveAndPublish(this.access, room.value)
    return ok(toRoomSession(room.value, member.value))
  }
}
