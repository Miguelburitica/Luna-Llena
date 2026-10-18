import { ROOM_CODE_ALPHABET } from '@luna/contracts'
import { describe, expect, it } from 'vitest'
import { DisplayName } from './DisplayName'
import { unwrap } from './Room.fixtures'
import { RoomCode } from './RoomCode'
import { RoomName } from './RoomName'

describe('RoomCode', () => {
  it('ignores letter case and surrounding spaces', () => {
    expect(unwrap(RoomCode.parse('  luna42 ')).value).toBe('LUNA42')
  })

  it.each(['LUNA4', 'LUNA420', 'LUN0A4', 'LUNI42', 'LUNO42', 'LUN142', 42])('rejects %s as not found', (raw) => {
    expect(RoomCode.parse(raw)).toEqual({ ok: false, error: { code: 'room-not-found' } })
  })

  it('never uses the ambiguous characters 0, O, 1 and I', () => {
    expect(ROOM_CODE_ALPHABET).not.toMatch(/[0O1I]/)
    expect(ROOM_CODE_ALPHABET).toHaveLength(32)
  })

  it('builds a code from alphabet positions', () => {
    expect(RoomCode.fromAlphabetPositions([0, 1, 2, 3, 24, 31]).value).toBe('ABCD29')
  })
})

describe('DisplayName', () => {
  it('trims and collapses whitespace', () => {
    expect(unwrap(DisplayName.create('  Ana   la Brava ')).value).toBe('Ana la Brava')
  })

  it.each(['', '   ', 'x'.repeat(21), undefined, 7])('rejects %s', (raw) => {
    expect(DisplayName.create(raw)).toEqual({ ok: false, error: { code: 'name-invalid' } })
  })

  it('compares names ignoring letter case', () => {
    expect(unwrap(DisplayName.create('ana')).sameAs(unwrap(DisplayName.create('ANA')))).toBe(true)
  })
})

describe('RoomName', () => {
  it('rejects a blank room name', () => {
    expect(RoomName.create('  ')).toEqual({ ok: false, error: { code: 'room-name-invalid' } })
  })
})
