import { getRandomValues } from 'node:crypto'
import { ROOM_LIMITS } from '@luna/contracts'
import type { RoomCodeGenerator } from '../application/ports'
import { RoomCode } from '../domain/RoomCode'

export class RandomRoomCodeGenerator implements RoomCodeGenerator {
  next(): RoomCode {
    return RoomCode.fromAlphabetPositions([...getRandomValues(new Uint8Array(ROOM_LIMITS.codeLength))])
  }
}
