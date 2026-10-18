import { err, ok, roomError, ROOM_CODE_ALPHABET, ROOM_LIMITS, type Result, type RoomError } from '@luna/contracts'

export class RoomCode {
  private constructor(readonly value: string) {}

  static parse(raw: unknown): Result<RoomCode, RoomError> {
    if (typeof raw !== 'string') return err(roomError('room-not-found'))
    const candidate = raw.trim().toUpperCase()
    const valid =
      candidate.length === ROOM_LIMITS.codeLength && [...candidate].every((symbol) => ROOM_CODE_ALPHABET.includes(symbol))
    return valid ? ok(new RoomCode(candidate)) : err(roomError('room-not-found'))
  }

  static fromAlphabetPositions(positions: readonly number[]): RoomCode {
    if (positions.length !== ROOM_LIMITS.codeLength) throw new RangeError('A room code needs exactly one position per character')
    const symbols = positions.map((position) => {
      const symbol = ROOM_CODE_ALPHABET[position % ROOM_CODE_ALPHABET.length]
      if (symbol === undefined) throw new RangeError('Alphabet position must be a non-negative integer')
      return symbol
    })
    return new RoomCode(symbols.join(''))
  }

  equals(other: RoomCode): boolean {
    return this.value === other.value
  }
}
