import { describe, expect, it } from 'vitest'
import { inviteLinkFor, isCompleteRoomCode, normalizeRoomCode } from './roomCode'

describe('room code input', () => {
  it('uppercases, drops characters outside the alphabet and caps the length', () => {
    expect(normalizeRoomCode(' lu-na 42xyz')).toBe('LUNA42')
    expect(normalizeRoomCode('O0I1ab')).toBe('AB')
  })

  it('knows when a code is complete', () => {
    expect(isCompleteRoomCode('luna42')).toBe(true)
    expect(isCompleteRoomCode('LUNA4')).toBe(false)
  })

  it('builds the invite link', () => {
    expect(inviteLinkFor('https://luna.example', 'LUNA42')).toBe('https://luna.example/join/LUNA42')
  })
})
