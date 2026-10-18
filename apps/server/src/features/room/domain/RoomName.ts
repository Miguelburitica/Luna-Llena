import { err, ok, roomError, ROOM_LIMITS, type Result, type RoomError } from '@luna/contracts'
import { normalizeWhitespace } from './text'

export class RoomName {
  private constructor(readonly value: string) {}

  static create(raw: unknown): Result<RoomName, RoomError> {
    if (typeof raw !== 'string') return err(roomError('room-name-invalid'))
    const value = normalizeWhitespace(raw)
    const valid = value.length > 0 && value.length <= ROOM_LIMITS.maxRoomNameLength
    return valid ? ok(new RoomName(value)) : err(roomError('room-name-invalid'))
  }
}
