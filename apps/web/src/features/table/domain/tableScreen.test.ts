import { describe, expect, it } from 'vitest'
import { tableScreenOf } from './tableScreen'

describe('tableScreenOf', () => {
  it('sends a device without a game to the setup', () => {
    expect(tableScreenOf(null, false)).toBe('table-setup')
  })

  it('keeps dealing until the logbook is open', () => {
    expect(tableScreenOf({ stage: 'dealing', seatIndex: 2 }, false)).toBe('table-deal')
    expect(tableScreenOf({ stage: 'hand-back' }, false)).toBe('table-deal')
  })

  it('opens the logbook, or the summary once the game is over', () => {
    expect(tableScreenOf({ stage: 'logbook' }, false)).toBe('table')
    expect(tableScreenOf({ stage: 'logbook' }, true)).toBe('table-over')
  })
})
