import { err, ok, roomError, ROOM_LIMITS, type Result, type RoomError, type RoomVisibility } from '@luna/contracts'
import { containsLink } from '../../../shared/domain/plainText'
import { normalizeWhitespace } from './text'

export class RoomName {
  private constructor(readonly value: string) {}

  static create(raw: unknown, visibility: RoomVisibility = 'private'): Result<RoomName, RoomError> {
    if (typeof raw !== 'string') return err(roomError('room-name-invalid'))
    const value = normalizeWhitespace(raw)
    const valid = value.length > 0 && value.length <= ROOM_LIMITS.maxRoomNameLength
    if (!valid || (visibility === 'public' && containsLink(value))) return err(roomError('room-name-invalid'))
    return ok(new RoomName(value))
  }
}
