import { err, ok, roomError, ROOM_LIMITS, type Result, type RoomError } from '@luna/contracts'
import { caseInsensitiveKey, normalizeWhitespace } from './text'

export class DisplayName {
  private constructor(readonly value: string) {}

  static create(raw: unknown): Result<DisplayName, RoomError> {
    if (typeof raw !== 'string') return err(roomError('name-invalid'))
    const value = normalizeWhitespace(raw)
    const valid = value.length > 0 && value.length <= ROOM_LIMITS.maxNameLength
    return valid ? ok(new DisplayName(value)) : err(roomError('name-invalid'))
  }

  get key(): string {
    return caseInsensitiveKey(this.value)
  }

  sameAs(other: DisplayName): boolean {
    return this.key === other.key
  }
}
