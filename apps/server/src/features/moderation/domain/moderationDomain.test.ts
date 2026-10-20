import { MODERATION_LIMITS } from '@luna/contracts'
import { describe, expect, it } from 'vitest'
import { BanList } from './BanList'
import { ReviewBudget } from './ReviewBudget'
import { StrikeLedger } from './StrikeLedger'
import { blockedByWordList, normalizeForMatch } from './wordList'

const HOUR = 3_600_000
const tato = { address: '10.0.0.1', device: 'device-tato' }

describe('Word list', () => {
  it('undoes letter swaps, accents and repeated letters', () => {
    expect(normalizeForMatch('P4ráááá')).toBe('para')
  })

  it('catches a slur spelled with a 4 in place of an a', () => {
    expect(blockedByWordList('eres una put4 jaja')).toBe(true)
    expect(blockedByWordList('FUUUCK this')).toBe(true)
  })

  it('lets normal game talk through', () => {
    expect(blockedByWordList('Tato votó por Ana, sospechoso')).toBe(false)
    expect(blockedByWordList('computadora y disputa')).toBe(false)
  })
})

describe('Review budget', () => {
  it('allows 30 reviews a minute', () => {
    const budget = new ReviewBudget()
    for (let review = 0; review < MODERATION_LIMITS.reviewsPerMinute; review += 1) expect(budget.take(0)).toBe(true)
    expect(budget.take(1000)).toBe(false)
    expect(budget.take(61_000)).toBe(true)
  })

  it('stops after 600 reviews in a room', () => {
    const budget = new ReviewBudget()
    for (let review = 0; review < MODERATION_LIMITS.reviewsPerRoom; review += 1) budget.take(review * 3000)
    expect(budget.take(10 * 24 * HOUR)).toBe(false)
  })
})

describe('Strikes', () => {
  it('bans a device on its third strike within 24 hours', () => {
    const ledger = new StrikeLedger()
    expect(ledger.strike(tato, 0)).toEqual([])
    expect(ledger.strike(tato, HOUR)).toEqual([])
    expect(ledger.strike(tato, 2 * HOUR)).toEqual([{ kind: 'device', value: 'device-tato' }])
  })

  it('forgets strikes older than 24 hours', () => {
    const ledger = new StrikeLedger()
    ledger.strike(tato, 0)
    ledger.strike(tato, HOUR)
    expect(ledger.strike(tato, 25 * HOUR + 1)).toEqual([])
  })

  it('needs 6 strikes on a shared address', () => {
    const ledger = new StrikeLedger()
    const friends = [
      { address: '10.0.0.9', device: 'device-ana' },
      { address: '10.0.0.9', device: 'device-caro' }
    ]
    const banned = friends.flatMap((friend) => [...ledger.strike(friend, 0), ...ledger.strike(friend, 1)])
    expect(banned).toEqual([])
  })
})

describe('Bans', () => {
  it('keeps the latest end across device and address and expires', () => {
    const bans = new BanList()
    bans.ban({ kind: 'device', value: 'device-tato' }, 24 * HOUR, 'strikes')
    expect(bans.bannedUntil(tato, HOUR)).toBe(24 * HOUR)
    expect(bans.bannedUntil(tato, 24 * HOUR)).toBeNull()
  })

  it('lifts a ban', () => {
    const bans = new BanList()
    bans.ban({ kind: 'address', value: '10.0.0.1' }, 48 * HOUR, 'operator')
    expect(bans.active(0)).toEqual([{ key: { kind: 'address', value: '10.0.0.1' }, until: 48 * HOUR, source: 'operator' }])
    bans.lift({ kind: 'address', value: '10.0.0.1' })
    expect(bans.bannedUntil(tato, 0)).toBeNull()
  })
})
