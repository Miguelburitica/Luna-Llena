import { ROOM_CODE_ALPHABET, ROOM_LIMITS } from '@luna/contracts'

export const normalizeRoomCode = (raw: string): string =>
  [...raw.toUpperCase()]
    .filter((symbol) => ROOM_CODE_ALPHABET.includes(symbol))
    .join('')
    .slice(0, ROOM_LIMITS.codeLength)

export const isCompleteRoomCode = (code: string): boolean => normalizeRoomCode(code).length === ROOM_LIMITS.codeLength

export const inviteLinkFor = (origin: string, code: string): string => `${origin}/join/${code}`
